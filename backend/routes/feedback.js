const express = require('express');
const router  = express.Router();
const { query, queryOne, requireBusiness } = require('../db');

router.post('/', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const { name, rating, message } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required.' });
    const r = Number(rating);
    if (isNaN(r) || r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be 1\u20135.' });
    const row = await queryOne(
      'INSERT INTO feedback (business_id, name, rating, message, approved) VALUES ($1,$2,$3,$4,0) RETURNING id',
      [biz.id, name.trim(), r, message.trim()]
    );
    res.status(201).json({ success: true, id: row.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/public', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const rows = await query(
      'SELECT id, name, rating, message, created_at FROM feedback WHERE business_id = $1 AND approved = 1 ORDER BY created_at DESC LIMIT 50',
      [biz.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admin', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const rows = await query(
      'SELECT * FROM feedback WHERE business_id = $1 ORDER BY created_at DESC LIMIT 200',
      [biz.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/approve', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const item = await queryOne(
      'SELECT * FROM feedback WHERE id = $1 AND business_id = $2', [req.params.id, biz.id]
    );
    if (!item) return res.status(404).json({ error: 'Feedback not found.' });
    const newApproved = item.approved === 1 ? 0 : 1;
    await queryOne('UPDATE feedback SET approved = $1 WHERE id = $2', [newApproved, req.params.id]);
    res.json({ success: true, approved: newApproved });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const item = await queryOne(
      'SELECT * FROM feedback WHERE id = $1 AND business_id = $2', [req.params.id, biz.id]
    );
    if (!item) return res.status(404).json({ error: 'Feedback not found.' });
    await queryOne('DELETE FROM feedback WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
