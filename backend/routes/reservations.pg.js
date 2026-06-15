/**
 * reservations.pg.js — PostgreSQL async version
 * Rename to reservations.js when switching to Supabase.
 */
const express = require('express');
const router  = express.Router();
const { query, queryOne, requireBusiness } = require('../db');

router.post('/', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const user_agent = (req.headers['user-agent'] || '').slice(0, 255);
    const ip_address = (req.ip || req.connection?.remoteAddress || '').slice(0, 64);
    await queryOne(
      'INSERT INTO reservations (business_id, user_agent, ip_address) VALUES ($1, $2, $3)',
      [biz.id, user_agent, ip_address]
    );
    res.status(201).json({ success: true, phone: biz.phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const [total, today, thisWeek, thisMonth] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM reservations WHERE business_id = $1', [biz.id]),
      queryOne("SELECT COUNT(*) as count FROM reservations WHERE business_id = $1 AND DATE(clicked_at) = CURRENT_DATE", [biz.id]),
      queryOne("SELECT COUNT(*) as count FROM reservations WHERE business_id = $1 AND clicked_at >= NOW() - INTERVAL '7 days'", [biz.id]),
      queryOne("SELECT COUNT(*) as count FROM reservations WHERE business_id = $1 AND clicked_at >= DATE_TRUNC('month', NOW())", [biz.id]),
    ]);

    const daily = await query(
      `SELECT DATE(clicked_at) as day, COUNT(*) as count
       FROM reservations
       WHERE business_id = $1 AND clicked_at >= NOW() - INTERVAL '30 days'
       GROUP BY day ORDER BY day ASC`,
      [biz.id]
    );

    res.json({
      total:      parseInt(total.count),
      today:      parseInt(today.count),
      this_week:  parseInt(thisWeek.count),
      this_month: parseInt(thisMonth.count),
      daily_chart: daily,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
