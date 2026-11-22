# InvoiceFlow — Next.js 16 Full-Stack Invoicing App

A complete invoicing app for freelancers, built end to end with **Next.js 16** (TypeScript, App Router, Tailwind CSS) and **SQLite** — frontend and backend in one project, no separate API server, no accounts, no API keys.

Built in the video **"Next.js 16 Full Stack Project — Build a Complete App with Server Actions & Database"** on the Simplified Dev Code Camp YouTube channel.

## What it does

- **Dashboard** — totals billed, collected, outstanding and overdue, computed live from the database.
- **Clients** — full CRUD with server-side validation.
- **Invoices** — line-item invoices with a live total, saved transactionally.
- **Status workflow** — Draft → Sent → Paid, with overdue computed from the calendar.
- **Search & filters** — search text and status filters that live in the URL (Next 16's async `searchParams`).
- **Printable invoice** — a print-CSS view that looks like a real invoice.
- **JSON API** — the same queries exposed as route handlers (`/api/clients`, `/api/invoices`).

## How it works

- **Server Components** read the database directly — no loading spinners, no client fetch.
- **Server Actions** write to the database, with real server-side validation.
- **SQLite** (`better-sqlite3`) stores everything in one local file, `data/invoiceflow.db`. The database is created and seeded automatically the first time the app runs.
- **Money is stored as integer cents** and formatted only for display, so totals are always exact.
- Database pages opt out of build-time prerendering with `force-dynamic` — otherwise they would be frozen at build time.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

The app opens with the seed data from the video: **$4,200.00 billed across 8 invoices, $815.00 collected, $2,950.00 outstanding and $1,550.00 overdue**. Add your first real client and send invoice INV-1009 for your own work.

## Production build

```bash
npm run build
npm run start
```

## Project structure

```
src/
  app/
    page.tsx                 Dashboard
    clients/                 Client list, new client, edit client
    invoices/                Invoice list (search + status filters),
                             new invoice, invoice detail, edit, print view
    api/clients/route.ts     JSON API — clients
    api/invoices/route.ts    JSON API — invoices
  components/
    ClientForm.tsx  InvoiceForm.tsx  StatusBadge.tsx
    DeleteButton.tsx  PrintButton.tsx
  lib/
    db.ts        SQLite connection, schema + seed data
    queries.ts   Shared database queries
    actions.ts   Server Actions (CRUD + validation)
    format.ts    Money formatting (cents → $x,xxx.xx)
```

The `data/` folder (the SQLite database) is gitignored — it is created locally on first run.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/guides/forms)
