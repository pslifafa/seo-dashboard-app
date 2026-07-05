const Database = require('better-sqlite3');
const { hashPassword, verifyPassword } = require('./auth');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'active',
  published INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 0,
  position INTEGER,
  prev_position INTEGER,
  url TEXT,
  published INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS backlinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  source_url TEXT NOT NULL,
  target_url TEXT,
  anchor_text TEXT,
  domain_rating INTEGER DEFAULT 0,
  link_type TEXT DEFAULT 'dofollow',
  status TEXT DEFAULT 'live',
  published INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  campaign_name TEXT NOT NULL,
  platform TEXT DEFAULT 'google',
  status TEXT DEFAULT 'active',
  spend REAL DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS dashboard_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  status TEXT DEFAULT 'active',
  auth_provider TEXT DEFAULT 'pending',
  role TEXT DEFAULT 'client',
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS signup_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT,
  password_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT UNIQUE NOT NULL,
  amount REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER UNIQUE NOT NULL,
  overall_score INTEGER,
  keyword_score INTEGER,
  backlink_score INTEGER,
  notes TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(project_id) REFERENCES projects(id)
);
`);

// Safe migration for databases created before role/expires_at existed
try { db.exec("ALTER TABLE dashboard_users ADD COLUMN role TEXT DEFAULT 'client'"); } catch (e) {}
try { db.exec('ALTER TABLE dashboard_users ADD COLUMN expires_at TEXT'); } catch (e) {}

// Seed admin user (default password, must change after first login)
const adminCount = db.prepare('SELECT COUNT(*) c FROM admins').get().c;
if (adminCount === 0) {
  const hash = hashPassword('admin123');
  db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)').run('admin@example.com', hash);
}

// Seed sample data only if empty
const projCount = db.prepare('SELECT COUNT(*) c FROM projects').get().c;
if (projCount === 0) {
  const insertProject = db.prepare('INSERT INTO projects (name, domain, status, published) VALUES (?, ?, ?, 1)');
  const p1 = insertProject.run('Spring Collection 2025', 'springcollection.com', 'active').lastInsertRowid;
  const p2 = insertProject.run('Summer Sale - Retargeting', 'summersale.com', 'active').lastInsertRowid;
  const p3 = insertProject.run('Brand Awareness Q2', 'mybrand.com', 'paused').lastInsertRowid;
  const p4 = insertProject.run('Holiday Promotions', 'holidaydeals.com', 'ended').lastInsertRowid;

  const kw = db.prepare('INSERT INTO keywords (project_id, keyword, search_volume, difficulty, position, prev_position, url, published) VALUES (?,?,?,?,?,?,?,1)');
  kw.run(p1, 'spring fashion 2025', 18100, 42, 3, 5, '/spring-fashion', );
  kw.run(p1, 'seasonal clothing trends', 9400, 35, 7, 6, '/trends');
  kw.run(p2, 'summer sale deals', 33200, 58, 2, 2, '/summer-sale');
  kw.run(p2, 'retargeting ads examples', 2900, 28, 12, 18, '/retargeting');
  kw.run(p3, 'brand awareness campaign', 5400, 47, 9, 9, '/brand-awareness');
  kw.run(p4, 'holiday promo codes', 27600, 51, 4, 4, '/holiday-promos');

  const bl = db.prepare('INSERT INTO backlinks (project_id, source_url, target_url, anchor_text, domain_rating, link_type, status, published) VALUES (?,?,?,?,?,?,?,1)');
  bl.run(p1, 'https://fashionblog.com/spring-trends', 'https://springcollection.com', 'spring fashion guide', 68, 'dofollow', 'live');
  bl.run(p2, 'https://retailnews.com/summer-deals', 'https://summersale.com', 'best summer deals', 74, 'dofollow', 'live');
  bl.run(p3, 'https://marketinghub.com/brand-strategy', 'https://mybrand.com', 'brand awareness tips', 55, 'nofollow', 'live');
  bl.run(p4, 'https://couponsite.com/holiday', 'https://holidaydeals.com', 'holiday discounts', 61, 'dofollow', 'broken');

  const tk = db.prepare('INSERT INTO tasks (project_id, title, description, status, priority, due_date) VALUES (?,?,?,?,?,?)');
  tk.run(p1, 'Optimize meta descriptions', 'Update meta descriptions for top 10 landing pages', 'in_progress', 'high', '2026-07-10');
  tk.run(p2, 'Fix broken backlinks', 'Reach out to webmasters for broken link replacement', 'todo', 'medium', '2026-07-15');
  tk.run(p3, 'Publish Q3 content calendar', 'Draft and approve content for next quarter', 'todo', 'low', '2026-07-20');
  tk.run(p4, 'Archive holiday campaign assets', 'Move completed campaign files to archive', 'done', 'low', '2026-06-25');

  const ad = db.prepare('INSERT INTO ads (project_id, campaign_name, platform, status, spend, clicks, impressions, conversions, published) VALUES (?,?,?,?,?,?,?,?,1)');
  ad.run(p1, 'Spring Collection 2025', 'google', 'active', 3240, 12400, 980000, 410, );
  ad.run(p2, 'Summer Sale - Retargeting', 'meta', 'active', 6100, 21800, 1540000, 760);
  ad.run(p3, 'Brand Awareness Q2', 'google', 'paused', 1800, 6200, 540000, 95);
  ad.run(p4, 'Holiday Promotions', 'meta', 'ended', 11800, 38900, 2670000, 1340);

  const nt = db.prepare('INSERT INTO notifications (title, message, type, is_read) VALUES (?,?,?,0)');
  nt.run('New backlink detected', 'A new dofollow backlink was found pointing to springcollection.com', 'success');
  nt.run('Keyword ranking drop', '"retargeting ads examples" dropped from position 6 to 12', 'warning');
  nt.run('Broken backlink found', 'A backlink from couponsite.com is returning a 404 error', 'error');
  nt.run('Task due soon', '"Fix broken backlinks" is due in 3 days', 'info');
  nt.run('Campaign budget alert', 'Holiday Promotions campaign is at 98% of budget', 'warning');

  db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run('site_title', 'RankPilot');
  db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run('site_tagline', 'A full-service SEO partner that finds the keywords, builds the links, and fixes the technical issues holding your rankings back — so you can focus on running the business.');
  db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run('site_desc', 'Data-driven SEO for businesses that want to be found.');
  db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run('site_logo', '');
  db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run('billing_tax_rate', '5');
  db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run('billing_currency_symbol', '$');
  db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run('billing_company_name', 'RankPilot Inc.');
  db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run('billing_address', '');
  db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run('billing_invoice_note', 'Thank you for your business.');

  const pm = db.prepare('INSERT INTO payment_methods (type, label) VALUES (?,?)');
  pm.run('netbanking', 'NetBanking');
  pm.run('upi', 'UPI');
}

// Always ensure a launch date exists (independent of the sample-data seed block above,
// so it survives even if projects already existed from an earlier version of this app)
if (!db.prepare("SELECT 1 FROM site_settings WHERE key = 'metrics_launch_date'").get()) {
  db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run('metrics_launch_date', new Date().toISOString().slice(0, 10));
}
const billingDefaults = {
  billing_tax_rate: '5',
  billing_currency_symbol: '$',
  billing_company_name: 'RankPilot Inc.',
  billing_address: '',
  billing_invoice_note: 'Thank you for your business.'
};
Object.entries(billingDefaults).forEach(([k, val]) => {
  if (!db.prepare('SELECT 1 FROM site_settings WHERE key = ?').get(k)) {
    db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)').run(k, val);
  }
});

module.exports = db;
