# Deploying to cPanel

This app is a standard Node.js + Express app with a SQLite database file — it works with
cPanel's built-in **"Setup Node.js App"** tool (Passenger), which most shared-hosting and
reseller cPanel accounts include. No VPS or root access needed.

## Before you start

Check your host actually has Node.js App support: in cPanel, look for an icon called
**"Setup Node.js App"** (sometimes under a "Software" section). If it's not there, your
host doesn't support Node — ask them to enable it, or use a Node-friendly host instead
(Render, Railway, DigitalOcean App Platform all work with zero code changes).

## Step 1 — Upload the files

1. In cPanel, open **File Manager** (or use FTP/SFTP).
2. Create a folder for the app, e.g. `/home/yourcpaneluser/seo-app` — **this should NOT be
   inside `public_html`**. cPanel's Node.js tool serves the app through its own proxy, so it
   doesn't need to live in your web root.
3. Upload this zip and extract it into that folder, so you end up with:
   ```
   seo-app/
   ├── server.js
   ├── db.js
   ├── auth.js
   ├── package.json
   ├── .env
   └── public/
   ```

## Step 2 — Create the Node.js App

1. cPanel → **Setup Node.js App** → **Create Application**.
2. **Node.js version:** pick 18.x or newer (20.x is fine too).
3. **Application mode:** Production.
4. **Application root:** the folder path from Step 1 (e.g. `seo-app`).
5. **Application URL:** the domain or subdomain you want this on (e.g. `dashboard.yoursite.com`).
6. **Application startup file:** `server.js`
7. Click **Create**.

## Step 3 — Environment variables

cPanel's Node app screen has an "Environment Variables" section. Add these (or just keep the
`.env` file that's already included — either works, since the app reads both):

| Key | Value |
|---|---|
| `SESSION_SECRET` | Already set to a random value in `.env`. Leave it, or generate your own. |
| `GOOGLE_CLIENT_ID` | Optional — only needed for real "Sign in with Google". Leave blank otherwise. |

You do **not** need to set `PORT` — cPanel assigns and injects that automatically.

## Step 4 — Install dependencies

Still on the Node.js App page, click **"Run NPM Install"**. This installs Express,
better-sqlite3, etc. It can take a minute — `better-sqlite3` compiles a small native module,
so this step must succeed before the app will start.

> **If NPM Install fails:** your host's Node environment may be missing build tools
> (python3/make/gcc) that `better-sqlite3` needs to compile from source on some
> architectures. Precompiled binaries exist for most common Linux setups, so this usually
> just works — but if it doesn't, contact your host and ask them to enable a C++ build
> environment for Node apps, or ask about switching to a VPS-based plan.

## Step 5 — Start it

Click **Restart** (or **Start**) on the Node.js App page. Then visit your Application URL.

- **Public site:** `https://yourdomain.com/`
- **Admin login:** `https://yourdomain.com/admin`
- **Default login:** `admin@example.com` / `admin123` — **change this immediately** in
  Settings → Change Password after your first login.

## Data persistence

The app creates `data.sqlite` in the application root on first run and stores everything
there (projects, keywords, campaigns, users, bills, etc.). Back this file up periodically —
cPanel's File Manager or a cron job with `cp` works fine. If you ever need to reset the app
back to sample data, just delete `data.sqlite` and restart the app.

## Updating the app later

Upload new files over the old ones (skip `.env` and `data.sqlite` so you don't lose your
config or data), then click **Restart** on the Node.js App page. If `package.json` changed,
run **NPM Install** again first.

## Common issues

- **"502 Bad Gateway" / blank page:** the app crashed on startup — check the Node.js App
  page for an "Errors" or logs link, or check `stderr.log` in the application root.
- **Login works but nothing loads / white screen:** usually a wrong Application URL or the
  app is pointed at the wrong folder — double check Step 2.
- **Changes to `.env` not taking effect:** restart the app from the Node.js App page —
  environment variables are only read on startup.
