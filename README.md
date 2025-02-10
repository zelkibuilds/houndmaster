# 🐕 Houndmaster

A blockchain contract analysis tool that tracks and analyzes smart contracts across multiple chains. Think of it as your loyal companion in the world of smart contract exploration.

## 🌟 Features

- Multi-chain support (Ethereum, Base, Arbitrum, Polygon, etc.)
- Real-time contract verification status
- Source code and ABI retrieval
- Rate-limited API interactions
- Beautiful medieval-themed UI
- Collection tracking and analysis

## 🛠 Tech Stack

- **Frontend**: React + React Router
- **Styling**: TailwindCSS
- **Database**: PostgreSQL + Drizzle ORM
- **Runtime**: Node.js
- **Package Manager**: pnpm
- **Type Safety**: TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- pnpm (v8 or higher)
- An Etherscan API key
- A Supabase PostgreSQL database

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

   Then edit `.env` and add your Etherscan API key and Supabase database credentials.

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
- Use the provided `BlockExplorerAPI` class which handles rate limiting

### Environment Variables

Required environment variables:

- `ETHERSCAN_API_KEY`: Your Etherscan API key
- `DATABASE_URL`: Your Supabase PostgreSQL connection string
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key

## 📄 License

MIT License - See LICENSE file for details
