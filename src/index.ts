import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config';
import { searchController } from './controllers/search.controller';
import { openSearchService } from './services/opensearch.service';
import { cacheService } from './services/cache.service';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.get('/api/search', searchController.search.bind(searchController));
app.get('/api/search/suggestions', searchController.suggestions.bind(searchController));
app.get('/api/products/:id', searchController.getProduct.bind(searchController));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      opensearch: false,
      redis: false,
    },
  };

  try {
    // Check OpenSearch
    await openSearchService.search('test', { size: 1 });
    health.services.opensearch = true;
  } catch (error) {
    console.error('OpenSearch health check failed:', error);
  }

  try {
    // Check Redis
    await cacheService.get('health', { check: true });
    health.services.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  const httpStatus = health.services.opensearch && health.services.redis ? 200 : 503;
  res.status(httpStatus).json(health);
});

// Cache stats endpoint
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats',
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
  });
});

// Start server
async function start() {
  try {
    // Initialize services
    console.log('Initializing OpenSearch...');
    await openSearchService.initialize();
    
    console.log('Connecting to Redis...');
    await cacheService.connect();

    // Start Express server
    app.listen(config.node.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.node.port}`);
      console.log(`📊 API available at http://localhost:${config.node.port}/api`);
      console.log(`🎨 Frontend available at http://localhost:${config.node.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await cacheService.close();
  process.exit(0);
});

start();