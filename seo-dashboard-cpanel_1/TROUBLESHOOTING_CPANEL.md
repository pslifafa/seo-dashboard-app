# "Site can't be reached" on cPanel — troubleshooting

This message means the browser couldn't connect at all — usually not a bug in the app
itself, but one of these setup steps. Go through them in order.

## 1. Are you visiting the right URL?

cPanel's Node.js App tool assigns a specific **Application URL** — a domain or a
domain + subfolder (e.g. `yoursite.com/seo-app`), which might be *different* from your
main domain. Go to cPanel → **Setup Node.js App** and check the exact "Application URL"
listed for this app. Visit that exact address, not just your bare domain.

## 2. Is the app actually running?

On the **Setup Node.js App** page, your app should show a status of **"Running"** with
a green indicator. If it says stopped, crashed, or nothing at all:
- Click **Restart**.
- If it immediately stops again, click into the app and look for a **log file** link
  (often `stderr.log` in the application root, viewable in File Manager). That log will
  usually say exactly why it crashed on startup.

## 3. Did NPM Install actually finish successfully?

Open the app in **Setup Node.js App** and click **Run NPM Install** again, and watch
the output panel until it finishes. If you see red error text, that's the actual
problem — copy that error and we can fix it. Common ones:
- `gyp ERR!` / `python not found` → your host is missing build tools for the
  `better-sqlite3` native module. Contact hosting support and ask them to enable a C++
  build environment for Node apps.
- `EACCES` / permission errors → the app root folder has wrong permissions; try
  re-uploading into a fresh folder.

## 4. Is the Application Root correct — and NOT inside public_html?

Double-check in **Setup Node.js App** that "Application root" points to the exact
folder where you extracted the zip (the one containing `server.js` directly, not a
nested `seo-app/seo-app/` folder from double-extracting). A common mistake: extracting
the zip creates a subfolder, and the app root ends up pointing one level too high or
too low.

## 5. Domain/DNS still propagating?

If you just pointed a new subdomain at this app, DNS changes can take up to a few
hours. Try accessing via your host's temporary/IP-based URL if cPanel shows one, to
rule this out.

## 6. Firewall or "Under Construction" page

Some hosts show a placeholder "Under Construction" or default page until you manually
disable it — check if your hosting account has any staging/maintenance mode enabled
for that domain.

## Still stuck?

Tell me exactly what you see in:
- The Node.js App page's status (Running/Stopped/Crashed)
- The error output from "Run NPM Install"
- The exact Application URL it shows

...and I can tell you precisely what's wrong instead of guessing.
