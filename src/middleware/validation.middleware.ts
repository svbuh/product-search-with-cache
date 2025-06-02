import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './error.middleware';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }
    
    next();
  };
};

export const searchQuerySchema = Joi.object({
  q: Joi.string().allow('').optional(),
  category: Joi.string().valid(
    'tools',
    'building_materials',
    'garden',
    'electrical',
    'plumbing',
    'paint_decorating',
    'hardware',
    'flooring',
    'lighting',
    'kitchen_bathroom'
  ).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  inStock: Joi.boolean().optional(),
  brands: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  offset: Joi.number().min(0).optional(),
  sortBy: Joi.string().valid(
    'relevance',
    'price_asc',
    'price_desc',
    'rating',
    'name'
  ).optional(),
});

export const productSchema = Joi.object({
  sku: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string().required(),
  subcategory: Joi.string().required(),
  brand: Joi.string().required(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().default('EUR'),
  unit: Joi.string().default('Stück'),
  inStock: Joi.boolean().default(true),
  stockQuantity: Joi.number().min(0).default(0),
  features: Joi.array().items(Joi.string()).default([]),
  specifications: Joi.object().default({}),
  tags: Joi.array().items(Joi.string()).default([]),
  images: Joi.array().items(Joi.string()).default([]),
  rating: Joi.number().min(0).max(5).default(0),
  reviewCount: Joi.number().min(0).default(0),
});