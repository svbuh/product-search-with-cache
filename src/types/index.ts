export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory: string;
  brand: string;
  price: number;
  currency: string;
  unit: string;
  inStock: boolean;
  stockQuantity: number;
  features: string[];
  specifications: Record<string, string>;
  tags: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductCategory {
  TOOLS = 'tools',
  BUILDING_MATERIALS = 'building_materials',
  GARDEN = 'garden',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  PAINT_DECORATING = 'paint_decorating',
  HARDWARE = 'hardware',
  FLOORING = 'flooring',
  LIGHTING = 'lighting',
  KITCHEN_BATHROOM = 'kitchen_bathroom'
}

export interface SearchQuery {
  query: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  brands?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'name';
}

export interface SearchResult {
  products: Product[];
  total: number;
  took: number;
  query: string;
  suggestions?: string[];
}

export interface LLMSearchQuery {
  originalQuery: string;
  enhancedQuery: string;
  filters: {
    categories?: ProductCategory[];
    priceRange?: { min?: number; max?: number };
    features?: string[];
    brands?: string[];
  };
  intent: 'browse' | 'specific' | 'comparison' | 'recommendation';
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}