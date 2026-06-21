# Consent Hound Demo

This is a consent-first hackathon demo inspired by the workflow you described:

- Run one command.
- Open an operator dashboard.
- Copy a participant link.
- The participant sees a clearly disclosed chat page.
- The page asks the browser for location permission when it opens.
- If permission is denied, no location is collected.

## Run

```powershell
npm start
```

The command prompt prints both links:

```text
Dashboard: http://localhost:8787
Participant link: http://localhost:8787/s/<session-id>
```

Copy the participant link and share it with your authorized tester. Incoming chat, denied permission, and shared location events also appear in the same command prompt window.

## Deploy

This project includes Vercel routes for `api/[...path].js`, `/`, `/dashboard`, and `/s/<session-id>`.

```powershell
npx vercel --prod
```

Vercel serverless memory is temporary. For a serious demo with many testers, connect a real store such as Vercel KV, Upstash Redis, or Supabase.

## Important

Browser geolocation works on `localhost` or HTTPS. If you share the link with another device, host it over HTTPS or use an authorized tunnel for the hackathon environment.

This app stores events in memory only. Restarting the server clears all sessions.
