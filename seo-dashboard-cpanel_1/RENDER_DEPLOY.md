# Deploying to Render (Netlify alternative)

Netlify cannot run this app — it only hosts static files and short-lived serverless
functions, and this app is a full Express server with a SQLite file it writes to and
live login sessions. Render is a much closer match to what you're expecting from
Netlify: connect it, and it just runs — no manual server config.

## Important: free-tier storage caveat

Render's **free** web service plan has an ephemeral filesystem — every time the app
redeploys or restarts (including after ~15 min of inactivity on the free tier), any
files it wrote while running are wiped, **including `data.sqlite`**. That means on the
free tier, your projects/keywords/users/etc. can reset unexpectedly.

If you want your data to actually stick around for free, cPanel (regular hosting file
system — nothing ephemeral) is the better fit for this app. If you want to use Render
long-term, add their **persistent Disk** add-on (a few dollars/month) and mount it at
`/opt/render/project/src` so `data.sqlite` survives restarts. I'm not going to pretend
the free tier solves this — it doesn't.

## Steps

1. Push this folder to a GitHub repo (Render deploys from a git repo, not a zip upload).
2. Go to https://dashboard.render.com → **New** → **Web Service** → connect your repo.
3. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or paid, if you want the persistent disk option)
4. Add environment variables (Render dashboard → Environment):
   - `SESSION_SECRET` → copy the value from this project's `.env`
   - `GOOGLE_CLIENT_ID` → optional, leave blank unless you've set up real Google Sign-In
   - Don't set `PORT` — Render injects it automatically, same as cPanel.
5. Click **Create Web Service**. First deploy takes a couple of minutes.
6. Your app is live at `https://your-service-name.onrender.com` — that's your public
   site, `/admin` is the dashboard, `/login` is client sign-in.

## If you want data to persist

Render dashboard → your service → **Disks** → **Add Disk** → mount path
`/opt/render/project/src/data` — then in `db.js`, the SQLite path would need to point
into that folder instead of the project root. Tell me if you go this route and I'll
make that change for you.
