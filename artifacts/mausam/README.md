# MAUSAM — Your Personalized Weather Experience

MAUSAM prioritizes weather conditions based on a person's interests and plans. The Expo app includes onboarding, a personalized home screen, hourly and 7-day forecasts, rule-based insights, relevant weather alerts, and saved locations.

## Run in Replit

The project uses Replit-managed Clerk authentication, the workspace's shared Express/TypeScript API service, PostgreSQL, and an Expo mobile app.

1. Start **API Server** and **MAUSAM Weather** from the Workflows pane.
2. Create an account or sign in. New users then choose their weather interests and activity during onboarding.
3. Demo data is enabled by default and works without any weather API access.
4. Open **Your profile** to change interests, add a location, enable in-app alert preferences, or switch to live weather.
5. To use the mobile app on a device, open the Expo preview QR code in Expo Go.

The Replit workspace provides `DATABASE_URL` to the API service. Create or update the development tables with:

```sh
pnpm --filter @workspace/db run push
```

## Weather sources

- Demo mode provides sample current conditions and forecasts for Pune, Mumbai, Nashik, and Sangamner.
- Live mode uses Open-Meteo Forecast and Air Quality endpoints, which do not require an API key for this prototype.
- City search uses Open-Meteo Geocoding. Weather requests use latitude and longitude.
- The weather adapter and forecast types are isolated in `lib/weather.ts` so another provider can be added later.

## Backend and data

The API contract is in `../../lib/api-spec/openapi.yaml`; profile and location routes require an authenticated Clerk session. Regenerate typed API clients after changing the contract:

```sh
pnpm --filter @workspace/api-spec run codegen
```

The API persists account profiles, preferences, and saved locations in PostgreSQL. Schema definitions also include weather history, alerts, and recommendations for future server-side persistence.

## Recommendations and notifications

The rule-based recommendation engine and alert rules are separate from screen rendering. Notification delivery is behind a small provider interface; FCM credentials are intentionally not included in the mobile app or this prototype. Add a server-side Firebase provider when a Firebase project is connected. Google sign-in can be enabled from the Replit Auth pane; email and password sign-in are available by default.

The existing workspace backend is Express/TypeScript rather than FastAPI. It was kept to use the preconfigured API workflow and database integration.

## Local environment reference

See `.env.example` for variable names. Do not place provider credentials in `EXPO_PUBLIC_*` variables.
