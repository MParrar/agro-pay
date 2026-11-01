# Agro-Pay

Digital replacement for the handwritten harvest notebook: daily piece-rate delivery
log and weekly payroll with printable payslips. UI in Spanish, code in English.

## Structure

```
agro-pay-app/
├── package.json              # root helper scripts (runs both apps)
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js           # seeds the "La dehesa" garden
│   └── src/
│       ├── index.js          # Express app
│       ├── lib/              # prisma client, validation, calculateEntry, HttpError
│       ├── middleware/       # JWT auth, error handler
│       └── routes/           # auth, catalogs (fruit/garden/group), workers, entries, payroll
└── frontend/
    ├── package.json, vite.config.js, tailwind.config.js, postcss.config.js, index.html
    └── src/
        ├── main.jsx, App.jsx, index.css (Tailwind + @media print)
        ├── api/client.js     # Axios instance + JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/       # Layout, CrudSection, Payslip
        ├── lib/              # dates, format, calc preview
        └── pages/            # Login, Dashboard, Settings, Payroll
```

## Setup

1. Create a Neon project and copy both the **pooled** and **direct** connection strings.
2. Configure env:
   ```bash
   cp backend/.env.example backend/.env   # fill DATABASE_URL, DIRECT_URL, ADMIN_*, JWT_SECRET
   ```
3. Install, migrate and seed:
   ```bash
   npm run install:all
   npm run db:migrate -- --name init      # creates tables + citext extension
   npm run db:seed                        # creates "La dehesa"
   ```
4. Run in development (API on :3001, web on :5173 with `/api` proxied):
   ```bash
   npm run dev
   ```

## Deploy on Netlify

`netlify.toml` builds the frontend to the CDN and runs Express as one Netlify Function
(`backend/netlify/functions/api.js`) behind `/api/*`. Pending Prisma migrations are
applied during each build. Set these in Site settings → Environment variables:
`DATABASE_URL`, `DIRECT_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`
(optional `JWT_EXPIRES_IN`). `CORS_ORIGIN` is not needed (same origin).

## Production (standalone Node server)

```bash
npm run build                     # builds frontend/dist
cd backend && npm run db:deploy   # apply migrations
npm start                         # Express serves the API and frontend/dist
```

## API

| Method | Path | Notes |
|---|---|---|
| POST | `/api/login` | `{ username, password }` → `{ token }` (checked against env vars) |
| GET/POST/PUT/DELETE | `/api/fruit-types`, `/api/gardens`, `/api/groups`, `/api/workers` | Standard REST; worker names are unique ignoring case (409) |
| GET | `/api/entries?from=ISO&to=ISO` | List entries in range |
| POST | `/api/entries` | `{ workerId, fruitTypeId, gardenId, kg, boxes }` |
| PUT | `/api/entries/:id` | Same body as POST (+ optional `createdAt`); keeps original rates unless the fruit changes |
| DELETE | `/api/entries/:id` | |
| GET | `/api/payroll/weekly?start=ISO&end=ISO` | Totals by worker, group and garden |

All routes except `/api/login` and `/api/health` require `Authorization: Bearer <token>`.

### Pay calculation

```
fruitValue = kg * pricePerKg
discount   = boxes * discountPerBox
discount > fruitValue  →  400 (rejected)
totalPaid  = round(fruitValue - discount)
```

Each entry stores snapshots of both rates, so later price changes never alter past pay.
