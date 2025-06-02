import { GoogleGenAI } from '@google/genai';
import { config } from '../config';

export interface QueryEnhancement {
  enhancedQuery: string;
  categories: string[];
  attributes: Record<string, any>;
  intent: 'search' | 'browse' | 'specific' | 'comparison';
}

export interface ProductReranking {
  productId: string;
  relevanceScore: number;
}

class GeminiService {
  private ai: GoogleGenAI;
  private model = 'gemini-2.0-flash-lite';

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: config.gemini.apiKey,
    });
  }

  async enhanceSearchQuery(query: string): Promise<QueryEnhancement> {
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Du bist ein Baumarkt-Suchexperte. Analysiere diese Suchanfrage und verbessere sie.
            
Suchanfrage: "${query}"

Gib eine JSON-Antwort zurück mit:
- enhancedQuery: Verbesserte Suchanfrage mit relevanten technischen Begriffen
- categories: Liste der wahrscheinlichen Produktkategorien (z.B. ["Werkzeuge", "Schrauben"])
- attributes: Wichtige Produktattribute (z.B. {"material": "Stahl", "größe": "M8"})
- intent: Suchintention (search/browse/specific/comparison)

Beispiel für "Dübel für Betonwand":
{
  "enhancedQuery": "Betondübel Schwerlastdübel Betonanker Wanddübel",
  "categories": ["Befestigungstechnik", "Dübel"],
  "attributes": {"material": "Beton", "anwendung": "Schwerlast"},
  "intent": "specific"
}`,
          },
        ],
      },
    ];

    try {
      const response = await this.ai.models.generateContentStream({
        model: this.model,
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
        contents,
      });

      let result = '';
      for await (const chunk of response) {
        result += chunk.text;
      }
      
      if (!result) {
        throw new Error('No response from Gemini');
      }
      
      return JSON.parse(result);
    } catch (error) {
      console.error('Error enhancing query:', error);
      // Fallback to original query
      return {
        enhancedQuery: query,
        categories: [],
        attributes: {},
        intent: 'search',
      };
    }
  }

  async rerankProducts(
    query: string,
    products: Array<{ id: string; name: string; description: string; category: string; price?: number }>
  ): Promise<ProductReranking[]> {
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Du bist ein Baumarkt-Produktexperte. Bewerte die Relevanz dieser Produkte für die Suchanfrage.

Suchanfrage: "${query}"

WICHTIG: Wenn die Suchanfrage Begriffe wie "günstig", "preiswert", "billig" enthält, MUSS der Preis ein Hauptkriterium sein!

Produkte:
${products.map((p, i) => `${i + 1}. ${p.name} - ${p.description} (Kategorie: ${p.category}, Preis: €${p.price || 'unbekannt'})`).join('\n')}

Gib eine JSON-Antwort zurück mit einem Array von:
{
  "productId": "id",
  "relevanceScore": 0-100
}

Bewertungskriterien:
- Produkttyp-Übereinstimmung (passt das Produkt zur Suchanfrage?)
- Preis (bei Begriffen wie "günstig": niedrigere Preise = höhere Scores!)
- Verfügbarkeit
- Markenqualität im Verhältnis zum Preis

Sortiere nach Relevanz (höchster Score zuerst).`,
          },
        ],
      },
    ];

    try {
      const response = await this.ai.models.generateContentStream({
        model: this.model,
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
        contents,
      });

      let result = '';
      for await (const chunk of response) {
        result += chunk.text;
      }
      
      if (!result) {
        throw new Error('No response from Gemini');
      }
      
      const rankings: ProductReranking[] = JSON.parse(result);
      
      // Map back to original product IDs
      return rankings.map((r, index) => ({
        ...r,
        productId: products[index].id,
      }));
    } catch (error) {
      console.error('Error reranking products:', error);
      // Fallback to original order
      return products.map((p, index) => ({
        productId: p.id,
        relevanceScore: 100 - index * 10,
      }));
    }
  }

}

export const geminiService = new GeminiService();