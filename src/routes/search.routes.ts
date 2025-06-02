import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { OpenSearchService } from '../services/opensearch.service';
import { RedisService } from '../services/redis.service';
import { GeminiService } from '../services/gemini.service';

const router = Router();

// Initialize services
const openSearchService = new OpenSearchService();
const redisService = new RedisService();
const geminiService = new GeminiService();

// Initialize controller
const searchController = new SearchController(
  openSearchService,
  redisService,
  geminiService
);

// Routes
router.get('/search', searchController.search.bind(searchController));
router.get('/search/enhanced', searchController.enhancedSearch.bind(searchController));
router.get('/search/suggestions', searchController.getSuggestions.bind(searchController));
router.get('/products/:id', searchController.getProduct.bind(searchController));

export default router;