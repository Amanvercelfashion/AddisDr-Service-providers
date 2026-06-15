/**
 * db.pg.js — PostgreSQL version of db.js (for Supabase / production)
 *
 * TO SWITCH TO THIS:
 *   1. npm install pg
 *   2. npm uninstall better-sqlite3
 *   3. Rename this file to db.js (overwrite the SQLite version)
 *   4. Set DATABASE_URL in your environment
 *
 * All route files must be updated to use async/await (see DEPLOYMENT.md §5.3)
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

// ── Query helpers ─────────────────────────────────────────────────────────────

/** Run a query and return all rows */
async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows;
}

/** Run a query and return the first row (or null) */
async function queryOne(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
}

/** Run INSERT ... RETURNING id and return the new id */
async function insertOne(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows[0];
}

// ── Business lookup helpers ───────────────────────────────────────────────────

/** Resolve business_id from request header, query param, or body */
function getBusinessId(req) {
  const id =
    req.headers['x-business-id'] ||
    req.query.business_id ||
    req.body?.business_id;
  return id ? parseInt(id, 10) : null;
}

/** Get active business or send 400/404. Returns business row or null. */
async function requireBusiness(req, res) {
  const id = getBusinessId(req);
  if (!id) {
    res.status(400).json({ error: 'business_id is required' });
    return null;
  }
  const biz = await queryOne(
    "SELECT * FROM businesses WHERE id = $1 AND status = 'active'",
    [id]
  );
  if (!biz) {
    res.status(404).json({ error: 'Business not found or inactive' });
    return null;
  }
  return biz;
}

module.exports = { pool, query, queryOne, insertOne, getBusinessId, requireBusiness };
