Track My Worth now includes a **web app** and a new **Expo React Native mobile app shell** in the same workspace.

## Getting Started

Install dependencies:

```bash
npm install
```

Use Node `20.19.4` or newer. Expo SDK 54 and React Native 0.81 require a newer Node release than older SDK 53 setups.

Run the web app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Run the mobile app:

```bash
npm run mobile:dev
```

Key workspace layout:

```text
apps/mobile        Expo Router app for iOS + Android
packages/domain    Shared financial logic, CPF/FIRE logic, types, formatters
packages/api-client Shared Supabase-backed client operations for mobile-safe access
packages/config    Shared app tokens/theme constants
```

Environment:

- Web uses the repo-root `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Mobile uses `apps/mobile/.env.local` with:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

If the web app and mobile app use the same Supabase project, the URL and anon
key can be the same values in both files.

Setup:

```bash
cp .env.example .env.local
cp apps/mobile/.env.example apps/mobile/.env.local
```

After changing mobile env values, restart Expo completely:

```bash
cd apps/mobile
npx expo start --clear
```

Troubleshooting:

- `Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY for mobile app.`
  means `apps/mobile/.env.local` is missing those values, or Expo was not
  restarted after the file changed.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Supabase Auth for React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)

The web app remains the primary production surface today. The mobile app is now scaffolded with shared domain logic and a read-oriented shell for Dashboard, Accounts, Expenses, FIRE, and Settings.
