import { Client } from '@opensearch-project/opensearch';
import { config } from '../config';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  brand: string;
  price: number;
  attributes: Record<string, any>;
  tags: string[];
  inStock: boolean;
  ean?: string;
  articleNumber: string;
}

export interface SearchResult {
  products: Product[];
  total: number;
  took: number;
}

class OpenSearchService {
  private client: Client;
  private indexName = 'products';

  constructor() {
    this.client = new Client({
      node: `http://${config.opensearch.host}:${config.opensearch.port}`,
      auth: {
        username: config.opensearch.username,
        password: config.opensearch.password,
      },
    });
  }

  async initialize(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists.body) {
        await this.createIndex();
      }
    } catch (error) {
      console.error('Error initializing OpenSearch:', error);
      throw error;
    }
  }

  private async createIndex(): Promise<void> {
    await this.client.indices.create({
      index: this.indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              german_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'german_stop', 'german_stemmer'],
              },
            },
            filter: {
              german_stop: {
                type: 'stop',
                stopwords: '_german_',
              },
              german_stemmer: {
                type: 'stemmer',
                language: 'german',
              },
            },
          },
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: {
              type: 'text',
              analyzer: 'german_analyzer',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            description: {
              type: 'text',
              analyzer: 'german_analyzer',
            },
            category: {
              type: 'keyword',
              fields: {
                text: { type: 'text', analyzer: 'german_analyzer' },
              },
            },
            subcategory: {
              type: 'keyword',
              fields: {
                text: { type: 'text', analyzer: 'german_analyzer' },
              },
            },
            brand: { type: 'keyword' },
            price: { type: 'float' },
            attributes: { type: 'object' },
            tags: {
              type: 'keyword',
              fields: {
                text: { type: 'text', analyzer: 'german_analyzer' },
              },
            },
            inStock: { type: 'boolean' },
            ean: { type: 'keyword' },
            articleNumber: { type: 'keyword' },
          },
        },
      },
    });
  }

  async indexProduct(product: Product): Promise<void> {
    await this.client.index({
      index: this.indexName,
      id: product.id,
      body: product,
      refresh: true,
    });
  }

  async bulkIndexProducts(products: Product[]): Promise<void> {
    const operations = products.flatMap((product) => [
      { index: { _index: this.indexName, _id: product.id } },
      product,
    ]);

    await this.client.bulk({
      body: operations,
      refresh: true,
    });
  }

  async search(query: string, filters?: any): Promise<SearchResult> {
    const body: any = {
      size: config.search.maxResults,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query,
                fields: ['name^3', 'description^2', 'tags.text', 'category.text', 'brand'],
                type: 'best_fields',
                operator: 'or',
                fuzziness: 'AUTO',
              },
            },
            {
              match: {
                articleNumber: {
                  query,
                  boost: 5,
                },
              },
            },
            {
              match: {
                ean: {
                  query,
                  boost: 5,
                },
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
      highlight: {
        fields: {
          name: {},
          description: {},
        },
      },
    };

    // Apply filters if provided
    if (filters) {
      body.query.bool.filter = [];
      
      if (filters.category) {
        body.query.bool.filter.push({ term: { category: filters.category } });
      }
      
      if (filters.inStock !== undefined) {
        body.query.bool.filter.push({ term: { inStock: filters.inStock } });
      }
      
      if (filters.priceRange) {
        body.query.bool.filter.push({
          range: {
            price: {
              gte: filters.priceRange.min,
              lte: filters.priceRange.max,
            },
          },
        });
      }
    }

    const response = await this.client.search({
      index: this.indexName,
      body,
    });

    return {
      products: response.body.hits.hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
        _highlight: hit.highlight,
      })),
      total: response.body.hits.total.value,
      took: response.body.took,
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id,
      });
      
      return response.body._source as Product;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getSuggestions(prefix: string): Promise<string[]> {
    const response = await this.client.search({
      index: this.indexName,
      body: {
        size: 10,
        _source: ['name'],
        query: {
          match_phrase_prefix: {
            name: {
              query: prefix,
              max_expansions: 10,
            },
          },
        },
      },
    });

    const suggestions = response.body.hits.hits.map((hit: any) => hit._source.name);
    return [...new Set(suggestions)]; // Remove duplicates
  }
}

export const openSearchService = new OpenSearchService();