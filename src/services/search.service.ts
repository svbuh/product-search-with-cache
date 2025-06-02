import { openSearchService, Product, SearchResult } from './opensearch.service';
import { geminiService } from './gemini.service';
import { cacheService } from './cache.service';

export interface EnhancedSearchResult extends SearchResult {
  enhanced: boolean;
  queryEnhancement?: {
    original: string;
    enhanced: string;
    categories: string[];
    intent: string;
  };
}

class SearchService {
  async search(query: string, options?: {
    useAI?: boolean;
    filters?: any;
    noCache?: boolean;
  }): Promise<EnhancedSearchResult> {
    const { useAI = true, filters: initialFilters, noCache = false } = options || {};
    let filters = initialFilters;

    // Check cache first
    if (!noCache) {
      const cacheKey = { query, filters, useAI };
      const cached = await cacheService.get<EnhancedSearchResult>('search', cacheKey);
      if (cached) {
        console.log(`Cache hit for query: "${query}"`);
        return cached;
      }
    }

    let searchQuery = query;
    let queryEnhancement;

    // Enhance query with AI if enabled
    if (useAI) {
      try {
        queryEnhancement = await geminiService.enhanceSearchQuery(query);
        searchQuery = queryEnhancement.enhancedQuery;
        
        // Add category filter if AI detected specific categories
        if (queryEnhancement.categories.length > 0 && !filters?.category) {
          filters = {
            ...filters,
            category: queryEnhancement.categories[0],
          };
        }
      } catch (error) {
        console.error('Error enhancing query:', error);
        // Continue with original query
      }
    }

    // Perform OpenSearch query
    const searchResult = await openSearchService.search(searchQuery, filters);

    // Re-rank results with AI if enabled and we have results
    if (useAI && searchResult.products.length > 0) {
      try {
        const topProducts = searchResult.products.slice(0, 20); // Re-rank top 20
        const rankings = await geminiService.rerankProducts(
          query,
          topProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            price: p.price,
          }))
        );

        // Sort products based on AI rankings
        const rankedProducts = rankings
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .map(ranking => {
            const product = topProducts.find(p => p.id === ranking.productId);
            return {
              ...product!,
              _aiScore: ranking.relevanceScore,
            };
          });

        // Replace top products with re-ranked ones
        searchResult.products = [
          ...rankedProducts,
          ...searchResult.products.slice(20),
        ];
      } catch (error) {
        console.error('Error re-ranking products:', error);
        // Continue with original results
      }
    }

    const result: EnhancedSearchResult = {
      ...searchResult,
      enhanced: useAI,
      queryEnhancement: queryEnhancement ? {
        original: query,
        enhanced: queryEnhancement.enhancedQuery,
        categories: queryEnhancement.categories,
        intent: queryEnhancement.intent,
      } : undefined,
    };

    // Cache the result
    if (!noCache) {
      const cacheKey = { query, filters, useAI };
      await cacheService.set('search', cacheKey, result);
    }

    return result;
  }

  async getSuggestions(prefix: string): Promise<string[]> {
    // Check cache first
    const cached = await cacheService.get<string[]>('suggestions', { prefix });
    if (cached) {
      return cached;
    }

    const suggestions = await openSearchService.getSuggestions(prefix);
    
    // Cache suggestions
    await cacheService.set('suggestions', { prefix }, suggestions);
    
    return suggestions;
  }

  async getProduct(id: string): Promise<Product | null> {
    // Check cache first
    const cached = await cacheService.get<Product>('product', { id });
    if (cached) {
      return cached;
    }

    const product = await openSearchService.getProductById(id);
    
    if (product) {
      // Cache product
      await cacheService.set('product', { id }, product);
    }
    
    return product;
  }
}

export const searchService = new SearchService();