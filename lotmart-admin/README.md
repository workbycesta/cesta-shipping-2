# Lotmart Admin — SaaS Control Center

React + Vite admin panel for the Lotmart marketplace. Each feature has its own page.

## Pages
- `/` — Dashboard (GMV, hottest lots, pending buyers, recent activity)
- `/orders` — Orders & live bidding (timers, bidders, assign winner)
- `/lots` — Lotmart Direct lots (CRUD for own inventory)
- `/traders` — Buyer approvals
- `/pricing` — Pricing engine (global hike, ranges, timer earliness)
- `/timers` — Live timer inspector
- `/team` — Admin accounts
- `/activity` — Audit log

## Run
```bash
cd lotmart-admin
npm install
npm run dev   # http://localhost:3001
```

Backend must run on `http://localhost:2000` (see `/server`). Dev proxy forwards `/api/*` there.
