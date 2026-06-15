const { Pool } = require('pg');

let _pool = null;

function getPool() {
  if (_pool) return _pool;
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  _pool.on('error', err => {
    console.error('Unexpected pool error:', err.message);
  });
  return _pool;
}

async function query(text, params) {
  try {
    const res = await getPool().query(text, params);
    return res.rows;
  } catch (err) {
    throw new Error(`Database query error: ${err.message}`);
  }
}

async function queryOne(text, params) {
  try {
    const res = await getPool().query(text, params);
    return res.rows[0] || null;
  } catch (err) {
    throw new Error(`Database query error: ${err.message}`);
  }
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

module.exports = { query, queryOne, getBusinessId, requireBusiness };
