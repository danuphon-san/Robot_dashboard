# Machine Dashboard

Modern Next.js dashboard for `machine_state` and `machine_anomaly_scores`.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- `shadcn/ui`-style component structure
- `lucide-react`
- PostgreSQL via `pg`

## Data flow

`machine_state` + `machine_anomaly_scores` -> Next.js API routes -> dashboard UI

## Endpoints

- `/api/dashboard/summary`
- `/api/dashboard/machines?limit=12`
- `/api/dashboard/anomalies?limit=8`
- `/api/dashboard/timeseries?hours=24`

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```
# Robot_dashboard
