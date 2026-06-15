const express = require('express');
const router = express.Router();
const { query, queryOne, requireBusiness } = require('../db');

router.get('/overview', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const [totalServices, visibleServices, totalStaff, totalFeedback, pendingFeedback] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM services WHERE business_id = $1', [biz.id]),
      queryOne('SELECT COUNT(*) as count FROM services WHERE business_id = $1 AND visible = 1', [biz.id]),
      queryOne('SELECT COUNT(*) as count FROM staff WHERE business_id = $1', [biz.id]),
      queryOne('SELECT COUNT(*) as count FROM feedback WHERE business_id = $1', [biz.id]),
      queryOne('SELECT COUNT(*) as count FROM feedback WHERE business_id = $1 AND approved = 0', [biz.id]),
    ]);

    const [reservationTotal, reservationToday, reservationThisWeek, reservationLastWeek] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM reservations WHERE business_id = $1', [biz.id]),
      queryOne("SELECT COUNT(*) as count FROM reservations WHERE business_id = $1 AND DATE(clicked_at) = CURRENT_DATE", [biz.id]),
      queryOne("SELECT COUNT(*) as count FROM reservations WHERE business_id = $1 AND clicked_at >= NOW() - INTERVAL '7 days'", [biz.id]),
      queryOne("SELECT COUNT(*) as count FROM reservations WHERE business_id = $1 AND clicked_at >= NOW() - INTERVAL '14 days' AND clicked_at < NOW() - INTERVAL '7 days'", [biz.id]),
    ]);

    const thisCount = parseInt(reservationThisWeek.count) || 0;
    const lastCount = parseInt(reservationLastWeek.count) || 0;
    let growth = 0;
    if (lastCount > 0) growth = Math.round(((thisCount - lastCount) / lastCount) * 100);
    else if (thisCount > 0) growth = 100;

    res.json({
      services: { total: parseInt(totalServices.count), visible: parseInt(visibleServices.count) },
      staff: { total: parseInt(totalStaff.count) },
      feedback: { total: parseInt(totalFeedback.count), pending: parseInt(pendingFeedback.count) },
      reservations: {
        total: parseInt(reservationTotal.count),
        today: parseInt(reservationToday.count),
        this_week: thisCount,
        last_week: lastCount,
        growth_percent: growth
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/reservation-chart', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const days = await query(
      `SELECT DATE(clicked_at) as day, COUNT(*) as count
       FROM reservations
       WHERE business_id = $1 AND clicked_at >= NOW() - INTERVAL '30 days'
       GROUP BY day ORDER BY day ASC`,
      [biz.id]
    );

    res.json(days);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
