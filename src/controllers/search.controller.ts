import { Request, Response } from 'express';
import { searchService } from '../services/search.service';
import { z } from 'zod';

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  inStock: z.string().optional().transform(val => val === 'true'),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  useAI: z.string().optional().default('true').transform(val => val === 'true'),
  noCache: z.string().optional().default('false').transform(val => val === 'true'),
});

const suggestionsQuerySchema = z.object({
  q: z.string().min(1).max(50),
});

export class SearchController {
  async search(req: Request, res: Response): Promise<void> {
    try {
      const parsed = searchQuerySchema.parse(req.query);
      
      const filters: any = {};
      if (parsed.category) filters.category = parsed.category;
      if (parsed.inStock !== undefined) filters.inStock = parsed.inStock;
      if (parsed.minPrice !== undefined || parsed.maxPrice !== undefined) {
        filters.priceRange = {
          min: parsed.minPrice || 0,
          max: parsed.maxPrice || 999999,
        };
      }

      const result = await searchService.search(parsed.q, {
        useAI: parsed.useAI,
        filters,
        noCache: parsed.noCache,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: error.errors,
        });
        return;
      }

      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async suggestions(req: Request, res: Response): Promise<void> {
    try {
      const parsed = suggestionsQuerySchema.parse(req.query);
      const suggestions = await searchService.getSuggestions(parsed.q);

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: error.errors,
        });
        return;
      }

      console.error('Suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await searchService.getProduct(id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

export const searchController = new SearchController();