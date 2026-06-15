const express = require('express');
const router  = express.Router();
const { query, queryOne, getBusinessId } = require('../db');

router.get('/', async (req, res) => {
  try {
    const bizId = getBusinessId(req);
    if (!bizId) return res.status(400).json({ error: 'business_id required' });
    const biz = await queryOne('SELECT * FROM businesses WHERE id = $1', [bizId]);
    if (!biz || biz.status === 'disabled')
      return res.status(404).json({ error: 'Business not found or inactive' });
    const { admin_password, ...publicData } = biz;
    res.json(publicData);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-subdomain/:subdomain', async (req, res) => {
  try {
    const biz = await queryOne(
      `SELECT id, name, subdomain, logo_url, hero_image_url, tagline, about, phone, address, map_url,
              color_primary, color_secondary, color_tertiary, staff_display, gallery_display, status
       FROM businesses WHERE subdomain = $1`,
      [req.params.subdomain]
    );
    if (!biz) return res.status(404).json({ error: 'Business not found' });
    if (biz.status === 'disabled') return res.status(403).json({ error: 'Business is inactive' });
    res.json(biz);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/directory', async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, name, subdomain, logo_url, tagline, status FROM businesses WHERE status = 'active' ORDER BY name ASC"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
