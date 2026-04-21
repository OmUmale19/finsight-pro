# FinSight Pro

FinSight Pro is a production-ready full-stack expense intelligence platform built with Next.js, Prisma, PostgreSQL, and a Python ETL + analytics engine. It ingests messy transaction data, standardizes it, categorizes spending, calculates a Financial Health Score, and surfaces actionable insights through a polished fintech dashboard.

## Core capabilities

- Multi-user email/password authentication with JWT session cookies
- CSV, Google Sheets, and JSON payload ingestion
- Python ETL pipeline for cleaning, normalization, category mapping, and recurring-expense tagging
- Advanced analytics engine for financial health scoring, waste signals, anomalies, forecasting, recommendations, and spending persona detection
- Interactive dashboard with Recharts visualizations and Framer Motion transitions
- Budgets, savings goals, alerts, and what-if simulation tooling
- Pipeline logging for ETL observability

## Stack

- Frontend: Next.js App Router, Tailwind CSS, shadcn-style UI primitives, Recharts, Framer Motion
- Backend: Next.js Route Handlers
- Database: PostgreSQL + Prisma ORM
- Auth: JWT + bcrypt password hashing
- Data engineering: Python, pandas, numpy, scikit-learn, APScheduler

## Project structure

```text
app/                  Next.js pages and API routes
components/           UI, charts, forms, and app shell
etl/                  Python ETL, insights engine, anomaly detection, scheduler
lib/                  Auth, ingestion, analytics, dashboard services, ETL orchestration
prisma/               Prisma schema and seed script
tests/                Vitest unit tests
```

## Local setup

1. Install Node dependencies:

```bash
npm install
```

2. Install Python dependencies:

```bash
pip install -r etl/requirements.txt
```

3. Copy the environment file and update values:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: long random secret for JWT signing
- `APP_URL`: frontend base URL
- `PYTHON_BIN`: Python executable path, defaults to `python`
- `UPLOAD_STORAGE_DIR`: local folder for uploaded raw files
- `ETL_TEMP_DIR`: temp folder used when Next.js calls the Python pipeline

4. Create the database schema:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Seed demo data:

```bash
npm run prisma:seed
```

6. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo account after seeding:

- Email: `demo@finsightpro.dev`
- Password: `Password@123`

## ETL and analytics flow

1. User uploads CSV, Google Sheet URL, or JSON payload.
2. Raw rows are stored and pipeline logs are created.
3. Next.js writes temporary JSON files and invokes Python scripts.
4. `etl_pipeline.py` cleans data, standardizes schema, normalizes categories, and tags recurring rows.
5. `insights_engine.py` computes:
   - Financial Health Score
   - Smart behavior insights
   - Wasteful spending signals
   - Recurring expense detection
   - Anomaly detection
   - Forecasted next-month spending
   - Spending persona classification
6. Processed transactions, insights, and alerts are persisted back to PostgreSQL.

## Testing

Frontend/backend unit tests:

```bash
npm test
```

Python ETL tests:

```bash
python -m unittest etl/test_pipeline.py
```

## Deployment

Recommended production deployment:

- Frontend/API: Vercel
- PostgreSQL: Neon, Supabase, or Railway Postgres
- Python ETL dependencies: install on the same service runtime or split into a lightweight worker/container
- Scheduler: run `python etl/scheduler.py` on Render, Railway, or a containerized worker

## Deployment checklist

- Set all environment variables in the deployment platform
- Run Prisma migrations against production Postgres
- Ensure Python runtime includes `pandas`, `numpy`, `scikit-learn`, and `apscheduler`
- Persist `storage/` if local upload retention matters, or swap to S3-compatible storage
- Rotate `JWT_SECRET` securely and enable HTTPS in production

## Notes

- Upload processing is cumulative: new imports are merged with existing raw history before the ETL reruns.
- Google Sheets ingestion expects a public sheet or a direct CSV export URL.
- The scheduler ships as a heartbeat example and can be extended into recurring reprocessing or notifications.

## License

Copyright (c) 2026 Om Sudhir Umale (omumale1904@gmail.com). All rights reserved.
Licensed under the MIT License.
