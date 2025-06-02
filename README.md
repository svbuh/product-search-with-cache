# KI Product Search with Cache

A comprehensive LLM-based product search system for a German hardware store (Baumarkt) with intelligent caching, built with TypeScript, OpenSearch, Redis, and Google Gemini 2.0 Flash.

## Features

- **Intelligent Search**: Enhanced search queries using Google Gemini 2.0 Flash
- **High Performance**: Redis caching for fast response times
- **Full-Text Search**: OpenSearch integration with German language support
- **Modern UI**: Responsive web interface with real-time search
- **RESTful API**: Well-structured API endpoints
- **Production Ready**: Error handling, logging, rate limiting, and security features

## Tech Stack

- **Backend**: Node.js with TypeScript
- **Search Engine**: OpenSearch (ports 9201/9301)
- **Cache**: Redis
- **AI/LLM**: Google Gemini 2.0 Flash
- **Frontend**: Vanilla JavaScript with modern CSS
- **Infrastructure**: Docker Compose

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Google Cloud account with Gemini API access

## Quick Start

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env and add your Gemini API key
```

3. **Start infrastructure**:
```bash
npm run docker:up
```

4. **Build and start the application**:
```bash
npm run build
npm start
```

For development:
```bash
npm run dev
```

5. **Seed sample data**:
```bash
npm run seed:products
```

6. **Access the application**:
- Web UI: http://localhost:3000
- API: http://localhost:3000/api
- OpenSearch Dashboards: http://localhost:5602

## API Endpoints

### Search Endpoints

- `GET /api/search` - Basic product search
- `GET /api/search/enhanced` - AI-enhanced search with Gemini
- `GET /api/search/suggestions` - Search suggestions
- `GET /api/products/:id` - Get product by ID

### Query Parameters

- `q` - Search query
- `category` - Filter by category
- `minPrice` / `maxPrice` - Price range filter
- `inStock` - Stock availability filter
- `brands` - Filter by brands (comma-separated)
- `sortBy` - Sort results (relevance, price_asc, price_desc, rating, name)
- `limit` - Results per page (max 100)
- `offset` - Pagination offset

## Project Structure

```
├── src/
│   ├── config/         # Configuration management
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic (OpenSearch, Redis, Gemini)
│   ├── models/         # Data models
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities (logger, etc.)
├── public/             # Frontend assets
├── scripts/            # Utility scripts
├── tests/              # Test files
└── docker-compose.yml  # Infrastructure setup
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Testing

```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

## Configuration

Key configuration options in `.env`:

- `GEMINI_API_KEY` - Your Google Gemini API key
- `OPENSEARCH_NODE` - OpenSearch endpoint (default: http://localhost:9201)
- `REDIS_HOST/PORT` - Redis connection details
- `CACHE_TTL` - Cache expiration time in seconds

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Use a process manager like PM2:
```bash
pm2 start dist/index.js --name product-search
```

## Security Features

- Helmet.js for security headers
- Rate limiting to prevent abuse
- Input validation with Joi
- CORS configuration
- Environment variable validation

## Performance Optimizations

- Redis caching for search results
- Efficient OpenSearch queries
- Response compression
- Static asset caching
- Database connection pooling

## License

MIT