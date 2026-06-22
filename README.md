# College Vidya Analytics Dashboard

Custom Next.js dashboard for College Vidya lead qualification analytics.

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Environment Variables

Set these locally in `.env.local` and in Vercel project settings:

```bash
COLLEGE_VIDYA_USER_UID=091cf311-6949-42fd-b1d2-de3bb4b3bf48
COLLEGE_VIDYA_BACKEND_BASE_URL=https://service.monade.ai/db_services
COLLEGE_VIDYA_API_KEY=...
```

Do not commit real API keys.

## Vercel Deployment

Use the simplest GitHub flow:

1. Import this repository in Vercel.
2. Add the environment variables above.
3. Keep the production branch as `main`.
4. Push to `main`; Vercel will rebuild automatically.

No separate CI/CD pipeline is required.
