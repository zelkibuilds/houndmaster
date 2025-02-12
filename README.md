# 🐕 Houndmaster

A blockchain contract analysis tool that tracks and analyzes smart contracts across multiple chains. Think of it as your loyal companion in the world of smart contract exploration.

## 🌟 Features

- Multi-chain support (Ethereum, Base, ApeChain, Abstract, Polygon, Arbitrum)
- Real-time contract verification status
- Source code and ABI retrieval
- Rate-limited API interactions
- Beautiful medieval-themed UI
- Collection tracking and analysis
- AI-powered website analysis
- Mint revenue analysis
- Project roadmap extraction
- Service recommendations

## 🛠 Tech Stack

- **Frontend**: React + React Router
- **Styling**: TailwindCSS
- **Database**: PostgreSQL + Drizzle ORM
- **Runtime**: Node.js
- **Package Manager**: pnpm
- **Type Safety**: TypeScript
- **AI**: Google Gemini API
- **Web Scraping**: Playwright

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- pnpm (v8 or higher)
- Block explorer API keys (Etherscan, BaseScan, ApeScan, ABScan, PolygonScan, ArbiScan)
- A Supabase PostgreSQL database
- Google Generative AI API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/zelkibuilds/houndmaster.git
   cd houndmaster
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your API keys and database credentials.

4. Set up the database:

   ```bash
   # Generate initial migration
   pnpm db:generate

   # Apply schema to database
   pnpm db:push
   ```

### Development

Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm typecheck` - Run type checking
- `pnpm db:generate` - Generate new migrations
- `pnpm db:push` - Apply schema changes directly (development)
- `pnpm db:migrate` - Apply migrations (production)
- `pnpm db:studio` - Open database GUI

## 📝 Development Guidelines

### Database Operations

- Use Drizzle ORM for all database operations
- Add new queries to `queries.server.ts`

#### Schema Changes

When making schema changes:

1. Modify the schema in `app/lib/db/schema.ts`
2. Run `pnpm db:generate` to create a new migration
3. Run `pnpm db:push` to apply changes in development
4. Commit the generated migration files

For production deployments, use `pnpm db:migrate` instead of `db:push`.

### API Rate Limits

- Block explorer APIs are rate-limited to 5 requests/second
- Magic Eden API is rate-limited to 2 requests/second with a minimum interval of 600ms
- Use the provided API classes which handle rate limiting

### Environment Variables

Required environment variables:

- Block Explorer API Keys:
  - `ETHERSCAN_API_KEY`: Your Etherscan API key
  - `BASE_SCAN_API_KEY`: Your BaseScan API key
  - `APE_SCAN_API_KEY`: Your ApeScan API key
  - `ABSCAN_API_KEY`: Your ABScan API key
  - `POLYGON_SCAN_API_KEY`: Your PolygonScan API key
  - `ARBISCAN_API_KEY`: Your ArbiScan API key
- Database Configuration:
  - `DATABASE_URL`: Your Supabase PostgreSQL connection string
  - `SUPABASE_URL`: Your Supabase project URL
  - `SUPABASE_KEY`: Your Supabase anon key
- AI Configuration:
  - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google Generative AI API key
- API Configuration:
  - `API_URL`: Your API URL (defaults to http://localhost:5173/api)

## 📄 License

MIT License - See LICENSE file for details
