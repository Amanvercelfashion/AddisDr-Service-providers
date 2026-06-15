const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

async function queryOne(text, params) {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
}

function getBusinessId(req) {
  const id = req.headers['x-business-id'] || req.query.business_id || req.body?.business_id;
  return id ? parseInt(id, 10) : null;
}

async function requireBusiness(req, res) {
  const id = getBusinessId(req);
  if (!id) {
    res.status(400).json({ error: 'business_id is required' });
    return null;
  }
  const biz = await queryOne(
    "SELECT * FROM businesses WHERE id = $1 AND status = 'active'", [id]
  );
  if (!biz) {
    res.status(404).json({ error: 'Business not found or inactive' });
    return null;
  }
  return biz;
}

module.exports = { pool, query, queryOne, getBusinessId, requireBusiness };
