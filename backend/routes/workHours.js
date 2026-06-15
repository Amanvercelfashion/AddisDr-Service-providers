const express = require('express');
const router  = express.Router();
const { query, queryOne, requireBusiness } = require('../db');

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

async function ensureWorkHours(businessId) {
  for (let day = 0; day < 7; day++) {
    await queryOne(
      `INSERT INTO work_hours (business_id, day_of_week, is_open, open_time, close_time)
       VALUES ($1, $2, $3, '09:00', '18:00')
       ON CONFLICT (business_id, day_of_week) DO NOTHING`,
      [businessId, day, day === 0 || day === 6 ? 0 : 1]
    );
  }
}

router.get('/', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    await ensureWorkHours(biz.id);
    const hours = await query(
      'SELECT * FROM work_hours WHERE business_id = $1 ORDER BY day_of_week ASC',
      [biz.id]
    );
    res.json(hours.map(h => ({ ...h, day_name: DAY_NAMES[h.day_of_week] })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const { hours } = req.body;
    if (!Array.isArray(hours)) return res.status(400).json({ error: 'hours array is required' });
    await ensureWorkHours(biz.id);
    for (const h of hours) {
      if (h.day_of_week === undefined || h.day_of_week === null) continue;
      await queryOne(
        `UPDATE work_hours SET is_open = $1, open_time = $2, close_time = $3
         WHERE business_id = $4 AND day_of_week = $5`,
        [h.is_open ? 1 : 0, h.open_time || '09:00', h.close_time || '18:00', biz.id, h.day_of_week]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/current-status', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    await ensureWorkHours(biz.id);

    const now = new Date();
    const dayOfWeek  = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const todayHours = await queryOne(
      'SELECT * FROM work_hours WHERE business_id = $1 AND day_of_week = $2',
      [biz.id, dayOfWeek]
    );

    if (!todayHours || !todayHours.is_open) {
      let nextOpen = null;
      for (let i = 1; i <= 7; i++) {
        const nextDay = (dayOfWeek + i) % 7;
        const nextH = await queryOne(
          'SELECT * FROM work_hours WHERE business_id = $1 AND day_of_week = $2 AND is_open = 1',
          [biz.id, nextDay]
        );
        if (nextH) { nextOpen = { day: DAY_NAMES[nextDay], open_time: nextH.open_time }; break; }
      }
      return res.json({ is_open: false, next_open: nextOpen, phone: biz.phone });
    }

    const isOpen = currentTime >= todayHours.open_time && currentTime < todayHours.close_time;
    res.json({
      is_open: isOpen,
      open_time: todayHours.open_time,
      close_time: todayHours.close_time,
      next_open: isOpen ? null : { day: 'today', open_time: todayHours.open_time },
      phone: biz.phone,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
