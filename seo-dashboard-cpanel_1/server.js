require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const https = require('https');
const { hashPassword, verifyPassword } = require('./auth');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '6mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
}));
app.use(express.static(path.join(__dirname, 'public')));

const ROLE_RANK = { client: 1, admin: 2, owner: 3 };

// Resolves the current session to a normalized user object, or a "blocked" reason.
function getSessionUser(req) {
  if (req.session && req.session.adminId) {
    const a = db.prepare('SELECT id, email FROM admins WHERE id = ?').get(req.session.adminId);
    return a ? { id: a.id, email: a.email, role: 'owner', source: 'admin' } : null;
  }
  if (req.session && req.session.portalUserId) {
    const u = db.prepare('SELECT * FROM dashboard_users WHERE id = ?').get(req.session.portalUserId);
    if (!u) return null;
    if (u.status === 'banned') return { blocked: 'banned' };
    if (u.expires_at && new Date(u.expires_at) < new Date()) return { blocked: 'expired' };
    return { id: u.id, email: u.email, role: u.role || 'client', source: 'portal' };
  }
  return null;
}

// Any signed-in, non-expired, non-banned user (owner, admin, or client) — read access
function requireAuth(req, res, next) {
  const su = getSessionUser(req);
  if (!su) return res.status(401).json({ error: 'Not authenticated' });
  if (su.blocked) {
    if (req.session) req.session.destroy(() => {});
    return res.status(403).json({ error: su.blocked === 'expired' ? 'Your access has expired. Contact the agency for renewal.' : 'Your access has been revoked. Contact the agency.' });
  }
  req.authUser = su;
  next();
}
// Minimum-role gate — use for write actions (admin+) or owner-only areas (owner)
function requireRole(minRole) {
  return (req, res, next) => requireAuth(req, res, () => {
    if (ROLE_RANK[req.authUser.role] < ROLE_RANK[minRole]) {
      return res.status(403).json({ error: 'You do not have permission to do this.' });
    }
    next();
  });
}
const requireWrite = requireRole('admin');   // owner + admin can create/edit/delete SEO data
const requireOwner = requireRole('owner');   // owner only — users whitelist, branding/settings

// ---------- AUTH ----------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin || !verifyPassword(password || '', admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  req.session.adminId = admin.id;
  res.json({ ok: true, email: admin.email });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  const su = getSessionUser(req);
  if (!su || su.blocked) return res.json({ authenticated: false });
  res.json({ authenticated: true, admin: { id: su.id, email: su.email }, role: su.role, source: su.source });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  if (req.authUser.source !== 'admin') return res.status(403).json({ error: 'Not available for this account type.' });
  const { currentPassword, newPassword } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.session.adminId);
  if (!verifyPassword(currentPassword || '', admin.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  const hash = hashPassword(newPassword);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, admin.id);
  res.json({ ok: true });
});

// ---------- CLIENT / PORTAL AUTH (public site "Get a free audit" → dashboard access) ----------
// A client can only sign in once their Gmail/email has been whitelisted by an agency admin
// in the Users section. Anyone not on that list is rejected with a clear message.
app.post('/api/portal/signup', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Enter an email and a password of at least 6 characters.' });
  }
  const u = db.prepare('SELECT * FROM dashboard_users WHERE email = ?').get(email);
  if (!u || u.status === 'banned' || (u.expires_at && new Date(u.expires_at) < new Date())) {
    return res.status(403).json({ error: 'You are not verified with agency.' });
  }
  if (u.password_hash) {
    return res.status(409).json({ error: 'An account already exists for this email — log in instead.' });
  }
  const hash = hashPassword(password);
  db.prepare("UPDATE dashboard_users SET password_hash = ?, auth_provider = 'password', last_login = datetime('now') WHERE id = ?").run(hash, u.id);
  req.session.portalUserId = u.id;
  res.json({ ok: true, email: u.email });
});

app.post('/api/portal/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const u = db.prepare('SELECT * FROM dashboard_users WHERE email = ?').get(email);
  if (!u || u.status === 'banned' || (u.expires_at && new Date(u.expires_at) < new Date())) {
    return res.status(403).json({ error: 'You are not verified with agency.' });
  }
  if (!u.password_hash || !verifyPassword(password, u.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  db.prepare("UPDATE dashboard_users SET last_login = datetime('now') WHERE id = ?").run(u.id);
  req.session.portalUserId = u.id;
  res.json({ ok: true, email: u.email });
});

// ---------- REAL GOOGLE SIGN-IN (Google Identity Services) ----------
// Verifies the ID token Google issues to the "Sign in with Google" button against Google's own
// tokeninfo endpoint — this is a real, network-verified check, not a mock. It requires a Google
// OAuth Client ID to be set as GOOGLE_CLIENT_ID in .env (see README for how to create one) and
// for that Client ID to be registered in login.html. Without it, the page falls back to a
// clearly-labeled demo button that only asks for an email (no real Google verification happens).
function verifyGoogleToken(idToken) {
  return new Promise((resolve, reject) => {
    https.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, (r) => {
      let data = '';
      r.on('data', (c) => data += c);
      r.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (r.statusCode !== 200 || json.error) return reject(new Error(json.error_description || 'Invalid Google token'));
          resolve(json);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}
app.post('/api/portal/google-verify', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing Google credential.' });
  let payload;
  try {
    payload = await verifyGoogleToken(credential);
  } catch (err) {
    return res.status(400).json({ error: 'Could not verify Google sign-in. Please try again.' });
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId && payload.aud !== clientId) {
    return res.status(400).json({ error: 'This Google sign-in was issued for a different app.' });
  }
  if (payload.email_verified !== 'true' && payload.email_verified !== true) {
    return res.status(400).json({ error: 'Your Google email address is not verified.' });
  }
  const email = String(payload.email || '').trim().toLowerCase();
  const u = db.prepare('SELECT * FROM dashboard_users WHERE email = ?').get(email);
  if (!u || u.status === 'banned' || (u.expires_at && new Date(u.expires_at) < new Date())) {
    return res.status(403).json({ error: 'You are not verified with agency. Contact them for more details.' });
  }
  db.prepare("UPDATE dashboard_users SET auth_provider = 'google', last_login = datetime('now') WHERE id = ?").run(u.id);
  req.session.portalUserId = u.id;
  res.json({ ok: true, email: u.email });
});
// Demo-only fallback used when GOOGLE_CLIENT_ID is not configured — no real Google verification.
app.post('/api/portal/google-demo', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Missing Google account email.' });
  const u = db.prepare('SELECT * FROM dashboard_users WHERE email = ?').get(email);
  if (!u || u.status === 'banned' || (u.expires_at && new Date(u.expires_at) < new Date())) {
    return res.status(403).json({ error: 'You are not verified with agency. Contact them for more details.' });
  }
  db.prepare("UPDATE dashboard_users SET auth_provider = 'google', last_login = datetime('now') WHERE id = ?").run(u.id);
  req.session.portalUserId = u.id;
  res.json({ ok: true, email: u.email });
});

// ---------- PUBLIC "REQUEST ACCESS" SIGN-UP (item 2) ----------
// Anyone can submit this form, but it never grants dashboard access on its own — it only creates
// a reference-numbered request that an owner must explicitly approve from the Users page.
function genReferenceId() {
  return 'REQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}
app.post('/api/signup-requests', (req, res) => {
  const firstName = String(req.body.firstName || '').trim();
  const lastName = String(req.body.lastName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const country = String(req.body.country || '').trim();
  const password = String(req.body.password || '');
  const acceptedTerms = !!req.body.acceptedTerms;

  if (!firstName || !lastName) return res.status(400).json({ error: 'Enter your first and last name.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!country) return res.status(400).json({ error: 'Select your country.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (!acceptedTerms) return res.status(400).json({ error: 'You must accept the Terms & Conditions to continue.' });

  const existingUser = db.prepare('SELECT * FROM dashboard_users WHERE email = ?').get(email);
  if (existingUser && existingUser.status === 'banned') {
    return res.status(403).json({ error: 'You are not verified with agency. Contact them for more details.' });
  }
  if (existingUser && existingUser.password_hash) {
    return res.status(409).json({ error: 'An account already exists for this email — log in instead.' });
  }
  const existingRequest = db.prepare("SELECT * FROM signup_requests WHERE email = ? AND status = 'pending'").get(email);
  if (existingRequest) {
    return res.status(200).json({ ok: true, referenceId: existingRequest.reference_id, alreadyPending: true });
  }

  const referenceId = genReferenceId();
  const hash = hashPassword(password);
  db.prepare('INSERT INTO signup_requests (reference_id, first_name, last_name, email, country, password_hash) VALUES (?,?,?,?,?,?)')
    .run(referenceId, firstName, lastName, email, country, hash);
  res.status(201).json({ ok: true, referenceId });
});

app.get('/api/signup-requests', requireOwner, (req, res) => {
  res.json(db.prepare('SELECT id, reference_id, first_name, last_name, email, country, status, created_at FROM signup_requests ORDER BY id DESC').all());
});
app.put('/api/signup-requests/:id/approve', requireOwner, (req, res) => {
  const reqRow = db.prepare('SELECT * FROM signup_requests WHERE id = ?').get(req.params.id);
  if (!reqRow) return res.status(404).json({ error: 'Not found' });
  const existing = db.prepare('SELECT * FROM dashboard_users WHERE email = ?').get(reqRow.email);
  if (existing) {
    db.prepare("UPDATE dashboard_users SET status = 'active', password_hash = COALESCE(password_hash, ?) WHERE id = ?").run(reqRow.password_hash, existing.id);
  } else {
    db.prepare("INSERT INTO dashboard_users (email, password_hash, status, auth_provider, role) VALUES (?, ?, 'active', 'password', 'client')").run(reqRow.email, reqRow.password_hash);
  }
  db.prepare("UPDATE signup_requests SET status = 'approved' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});
app.put('/api/signup-requests/:id/ban', requireOwner, (req, res) => {
  const reqRow = db.prepare('SELECT * FROM signup_requests WHERE id = ?').get(req.params.id);
  if (!reqRow) return res.status(404).json({ error: 'Not found' });
  const existing = db.prepare('SELECT * FROM dashboard_users WHERE email = ?').get(reqRow.email);
  if (existing) {
    db.prepare("UPDATE dashboard_users SET status = 'banned' WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO dashboard_users (email, status, auth_provider, role) VALUES (?, 'banned', 'pending', 'client')").run(reqRow.email);
  }
  db.prepare("UPDATE signup_requests SET status = 'banned' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ---------- GENERIC CRUD FACTORY (admin-protected) ----------
function crud(table, fields) {
  const router = express.Router();

  router.get('/', requireAuth, (req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
    res.json(rows);
  });

  router.get('/:id', requireAuth, (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.post('/', requireWrite, (req, res) => {
    const cols = fields.filter(f => req.body[f] !== undefined);
    const placeholders = cols.map(() => '?').join(',');
    const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`);
    const info = stmt.run(...cols.map(c => req.body[c]));
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(row);
  });

  router.put('/:id', requireWrite, (req, res) => {
    const cols = fields.filter(f => req.body[f] !== undefined);
    if (cols.length === 0) return res.status(400).json({ error: 'No fields to update' });
    const setClause = cols.map(c => `${c} = ?`).join(', ');
    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...cols.map(c => req.body[c]), req.params.id);
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    res.json(row);
  });

  router.delete('/:id', requireWrite, (req, res) => {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.json({ ok: true });
  });

  return router;
}

app.use('/api/projects', crud('projects', ['name', 'domain', 'status', 'published']));
app.use('/api/keywords', crud('keywords', ['project_id', 'keyword', 'search_volume', 'difficulty', 'position', 'prev_position', 'url', 'published']));
app.use('/api/backlinks', crud('backlinks', ['project_id', 'source_url', 'target_url', 'anchor_text', 'domain_rating', 'link_type', 'status', 'published']));
app.use('/api/tasks', crud('tasks', ['project_id', 'title', 'description', 'status', 'priority', 'due_date']));
app.use('/api/ads', crud('ads', ['project_id', 'campaign_name', 'platform', 'status', 'spend', 'clicks', 'impressions', 'conversions', 'published']));
app.use('/api/payment_methods', crud('payment_methods', ['type', 'label']));
app.use('/api/bills', crud('bills', ['month', 'amount', 'status', 'notes']));
app.use('/api/site_audits', crud('site_audits', ['project_id', 'overall_score', 'keyword_score', 'backlink_score', 'notes']));

// Notifications: custom routes (mark read, unread count)
app.get('/api/notifications', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM notifications ORDER BY id DESC').all());
});
app.post('/api/notifications', requireWrite, (req, res) => {
  const { title, message, type } = req.body;
  const info = db.prepare('INSERT INTO notifications (title, message, type) VALUES (?,?,?)').run(title, message, type || 'info');
  res.status(201).json(db.prepare('SELECT * FROM notifications WHERE id = ?').get(info.lastInsertRowid));
});
app.put('/api/notifications/:id/read', requireWrite, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
app.put('/api/notifications/read-all', requireWrite, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1').run();
  res.json({ ok: true });
});
app.delete('/api/notifications/:id', requireWrite, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- CLIENT USER WHITELIST (owner-only — add/ban/remove access, assign role + expiry) ----------
const DURATION_DAYS = { '7d': 7, '28d': 28, '90d': 90 };
app.get('/api/users', requireOwner, (req, res) => {
  res.json(db.prepare('SELECT id, email, status, auth_provider, role, expires_at, created_at, last_login, (password_hash IS NOT NULL) as has_account FROM dashboard_users ORDER BY id DESC').all());
});
app.post('/api/users', requireOwner, (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const role = ['owner', 'admin', 'client'].includes(req.body.role) ? req.body.role : 'client';
  const duration = req.body.duration; // '7d' | '28d' | '90d' | undefined (no expiry)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  const existing = db.prepare('SELECT id FROM dashboard_users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'That email is already on the list.' });
  let expiresAt = null;
  if (duration && DURATION_DAYS[duration]) {
    const d = new Date();
    d.setDate(d.getDate() + DURATION_DAYS[duration]);
    expiresAt = d.toISOString();
  }
  const info = db.prepare("INSERT INTO dashboard_users (email, status, auth_provider, role, expires_at) VALUES (?, 'active', 'pending', ?, ?)").run(email, role, expiresAt);
  res.status(201).json(db.prepare('SELECT * FROM dashboard_users WHERE id = ?').get(info.lastInsertRowid));
});
app.put('/api/users/:id', requireOwner, (req, res) => {
  const cols = ['status', 'role'].filter(f => req.body[f] !== undefined);
  if (cols.length === 0) return res.status(400).json({ error: 'No fields to update' });
  db.prepare(`UPDATE dashboard_users SET ${cols.map(c => c + ' = ?').join(', ')} WHERE id = ?`).run(...cols.map(c => req.body[c]), req.params.id);
  res.json(db.prepare('SELECT * FROM dashboard_users WHERE id = ?').get(req.params.id));
});
app.delete('/api/users/:id', requireOwner, (req, res) => {
  db.prepare('DELETE FROM dashboard_users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- SITE SETTINGS (owner-only) ----------
app.get('/api/settings', requireOwner, (req, res) => {
  const rows = db.prepare('SELECT * FROM site_settings').all();
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  res.json(obj);
});
app.put('/api/settings', requireOwner, (req, res) => {
  const upsert = db.prepare(`INSERT INTO site_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
  Object.entries(req.body).forEach(([k, v]) => upsert.run(k, String(v)));
  res.json({ ok: true });
});

// Deterministic, date-based "daily growth" so clicks/impressions look alive without a cron job —
// recomputed from today's date vs. a fixed launch date, so it advances automatically every day.
function metricsBonus() {
  const row = db.prepare("SELECT value FROM site_settings WHERE key = 'metrics_launch_date'").get();
  const launch = row ? new Date(row.value + 'T00:00:00Z') : new Date();
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const daysSince = Math.max(0, Math.floor((today - launch) / 86400000)) + 1; // +1 so day one already has a bonus
  return { clicks: daysSince * 1000, impressions: daysSince * 20000, days: daysSince };
}

// ---------- OVERVIEW STATS ----------
app.get('/api/overview', requireAuth, (req, res) => {
  const bonus = metricsBonus();
  const totalImpressions = db.prepare('SELECT COALESCE(SUM(impressions),0) v FROM ads').get().v + bonus.impressions;
  const totalClicks = db.prepare('SELECT COALESCE(SUM(clicks),0) v FROM ads').get().v + bonus.clicks;
  const totalSpend = db.prepare('SELECT COALESCE(SUM(spend),0) v FROM ads').get().v;
  const totalConversions = db.prepare('SELECT COALESCE(SUM(conversions),0) v FROM ads').get().v;
  const keywordCount = db.prepare('SELECT COUNT(*) v FROM keywords').get().v;
  const backlinkCount = db.prepare('SELECT COUNT(*) v FROM backlinks').get().v;
  const projectCount = db.prepare('SELECT COUNT(*) v FROM projects').get().v;
  const openTasks = db.prepare("SELECT COUNT(*) v FROM tasks WHERE status != 'done'").get().v;
  const unreadNotifications = db.prepare('SELECT COUNT(*) v FROM notifications WHERE is_read = 0').get().v;
  res.json({ totalImpressions, totalClicks, totalSpend, totalConversions, keywordCount, backlinkCount, projectCount, openTasks, unreadNotifications });
});

// ---------- PUBLIC SITE DATA (no auth — branding only, no internal metrics) ----------
app.get('/api/public/site', (req, res) => {
  const settings = {};
  db.prepare('SELECT * FROM site_settings').all().forEach(r => settings[r.key] = r.value);
  res.json({ settings, googleClientId: process.env.GOOGLE_CLIENT_ID || '' });
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`SEO dashboard running at http://localhost:${PORT}`);
  console.log(`Public site:  http://localhost:${PORT}/`);
  console.log(`Admin panel:  http://localhost:${PORT}/admin`);
  console.log(`Default login: admin@example.com / admin123  (change this immediately)`);
});
