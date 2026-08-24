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

Run mobile E2E flows with Maestro after the app is already open on an iOS
simulator or device:

```bash
npm run mobile:e2e
```

You can also run individual flows:

```bash
npm run mobile:e2e:login
npm run mobile:e2e:account
npm run mobile:e2e:expense
npm run mobile:e2e:cpf
npm run mobile:e2e:fire
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

### Optional dashboard ads

Ads are only rendered inside the signed-in dashboard and are disabled by
default. To enable the single, low-impact dashboard placement after your
AdSense account and consent flow are ready, add the following production
environment variables in Vercel:

- `NEXT_PUBLIC_ADS_ENABLED=true`
- `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-...`
- `NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT=...`

Admins can exempt a user by email from the dashboard Admin > Ads tab. Apply
the `014_ad_free_users.sql` migration before using the whitelist. Do not enable
ads for EEA, UK, or Swiss traffic until an AdSense-compatible consent flow is
configured.
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

For Expo Go login automation on iOS, add these optional values to
`apps/mobile/.env.local` and restart Expo:

- `EXPO_PUBLIC_E2E_TEST_EMAIL`
- `EXPO_PUBLIC_E2E_TEST_PASSWORD`

When they are present, the mobile login screen shows a dev-only `Use E2E Credentials`
button that Maestro can tap before signing in.

By default the Maestro flows target Expo Go on iOS with `host.exp.Exponent`.
You can override that by setting `MAESTRO_APP_ID` before running the test
command if you are using a custom dev build.

Troubleshooting:

- `Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY for mobile app.`
  means `apps/mobile/.env.local` is missing those values, or Expo was not
  restarted after the file changed.
- If Maestro cannot find your app, make sure the mobile app is already open on
  the simulator or device before running `npm run mobile:e2e`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Supabase Auth for React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)

The web app remains the primary production surface today. The mobile app is now scaffolded with shared domain logic and a read-oriented shell for Dashboard, Accounts, Expenses, FIRE, and Settings.
