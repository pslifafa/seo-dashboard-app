# RankPilot SEO Dashboard

A self-hosted SEO agency dashboard with a public marketing site — projects, keywords,
backlinks, ad campaigns, tasks, notifications, billing, site audits, and role-based client
access (Owner / Admin / Client).

## Quick start (local / VPS)

```bash
npm install
npm start
```

Then open:
- **Public site:** http://localhost:3000/
- **Admin panel:** http://localhost:3000/admin
- **Client login/signup:** http://localhost:3000/login

## Deploying to shared hosting (cPanel)

See **[CPANEL_DEPLOY.md](./CPANEL_DEPLOY.md)** for a full step-by-step guide — no VPS or
root access required, just cPanel's built-in "Setup Node.js App" tool.

## Default login
- Email: `admin@example.com`
- Password: `admin123` ← **change this immediately** in Settings → Change Password

## Roles
| Role | Access |
|---|---|
| Owner | Everything — Users, Settings, billing config, all SEO data |
| Admin | Create/edit/delete all SEO data (projects, keywords, backlinks, ads, tasks, notifications, bills) — no Users/Settings |
| Client | Read-only across the dashboard |

Owners manage who gets in from **Admin → Users**: add an email directly, or approve/ban
requests submitted through the public site's "Create account" flow.

## Admin panel sections
| Section | What it does |
|---|---|
| Overview | Live stats, performance chart, traffic sources, keyword position distribution |
| Projects | Tracked sites/domains |
| Keywords | Rankings, volume, difficulty, position |
| Backlinks | Inbound links, domain rating, dofollow/nofollow |
| Site Audit | Auto-calculated SEO health score per project (editable/overridable) |
| Insights & Reports | Impressions / Clicks / Conversions trends, 7d–all time |
| Ads & Campaigns | Spend, clicks, impressions, conversions per campaign |
| Billing | Real activity log tied to campaign spend, monthly bills, payment methods |
| Tasks | SEO work items with priority/status |
| Notifications | Alerts with read/delete |
| Users (Owner only) | Whitelist client emails, assign roles, set access expiry, approve/ban sign-up requests |
| Settings (Owner only) | Site branding (title/logo), billing settings, account/sign-out |

## Google Sign-In (optional)

`/login` supports real "Sign in with Google" if you set `GOOGLE_CLIENT_ID` in `.env` (get
one free at https://console.cloud.google.com/apis/credentials). Without it, a clearly
labeled demo button is shown instead.

## Folder structure
```
seo-app/
├── server.js          # Express server + REST API
├── db.js              # SQLite schema + seed data
├── auth.js            # Password hashing
├── public/
│   ├── index.html     # Public marketing site
│   ├── login.html     # Client login / request-access page
│   ├── admin.html     # Admin dashboard
│   ├── admin.js        # Admin JS (auth, CRUD, modals, charts)
│   └── styles.css     # Shared styles
├── .env                # PORT, SESSION_SECRET, GOOGLE_CLIENT_ID
├── CPANEL_DEPLOY.md    # cPanel deployment guide
└── README.md
```

## Data persistence

Everything lives in `data.sqlite`, created automatically on first run in the app's root
folder. Back it up regularly — it's the only stateful file in the app.
