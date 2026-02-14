# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

**Net Worth Tracker** - A Next.js 16 app for tracking personal finances across cash and investment accounts.

### Tech Stack
- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Database**: Supabase (Postgres with Row Level Security)
- **Auth**: Supabase Auth with SSR cookies
- **UI**: shadcn/ui components, Tailwind CSS, Recharts
- **Stock Prices**: yahoo-finance2 (no API key required)

### Key Directories
- `app/(auth)/` - Login/signup pages (public routes)
- `app/dashboard/` - Protected routes with sidebar layout
- `lib/actions.ts` - Server Actions for all mutations (accounts, holdings, preferences)
- `lib/stock-api.ts` - Yahoo Finance integration with 24-hour Supabase cache
- `lib/calculations.ts` - Net worth and gains calculations
- `lib/exchange-rates.ts` - Currency conversion
- `components/forms/` - Form components for creating/editing holdings

### Data Model
- **accounts** - Cash or investment accounts (per user)
- **cash_holdings** - Balance + currency, belongs to account
- **stock_holdings** - Ticker + shares + cost basis, belongs to account
- **stock_prices** - Shared price cache (ticker is primary key)
- **net_worth_snapshots** - Daily snapshots for historical charts
- **user_preferences** - Base currency setting

### Supabase Patterns
- Server client: `lib/supabase/server.ts` - use in Server Components and Server Actions
- Client: `lib/supabase/client.ts` - use in Client Components
- Middleware: `lib/supabase/middleware.ts` - session refresh
- All tables use RLS; holdings access is via account ownership check

### Stock Ticker Format
Yahoo Finance requires exchange suffixes for non-US stocks:
- US stocks: `AAPL`, `MSFT` (no suffix)
- LSE stocks: `VWRA.L`, `HSBC.L` (`.L` suffix)
- Store tickers with correct suffix in database

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
