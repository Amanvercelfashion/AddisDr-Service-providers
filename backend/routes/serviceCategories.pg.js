/**
 * serviceCategories.pg.js — PostgreSQL async version
 * Rename to serviceCategories.js when switching to Supabase.
 */
const express = require('express');
const router  = express.Router();
const { query, queryOne, requireBusiness } = require('../db');

router.get('/', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const cats = await query(
      'SELECT * FROM service_categories WHERE business_id = $1 ORDER BY sort_order ASC, name ASC',
      [biz.id]
    );
    res.json(cats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const { name, sort_order } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Category name is required.' });
    const row = await queryOne(
      'INSERT INTO service_categories (business_id, name, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [biz.id, name.trim(), sort_order || 0]
    );
    res.status(201).json(row);
  } catch (err) {
    if (err.message.includes('unique') || err.code === '23505')
      return res.status(409).json({ error: 'Category already exists.' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const { name, sort_order } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Category name is required.' });
    const cat = await queryOne(
      'SELECT * FROM service_categories WHERE id = $1 AND business_id = $2',
      [req.params.id, biz.id]
    );
    if (!cat) return res.status(404).json({ error: 'Category not found.' });
    await queryOne(
      'UPDATE service_categories SET name = $1, sort_order = $2 WHERE id = $3',
      [name.trim(), sort_order ?? cat.sort_order, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Category name already exists.' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const cat = await queryOne(
      'SELECT * FROM service_categories WHERE id = $1 AND business_id = $2',
      [req.params.id, biz.id]
    );
    if (!cat) return res.status(404).json({ error: 'Category not found.' });
    const [{ cnt }] = await query(
      'SELECT COUNT(*) as cnt FROM services WHERE category_id = $1 AND business_id = $2',
      [req.params.id, biz.id]
    );
    if (parseInt(cnt) > 0)
      return res.status(409).json({ error: 'Cannot delete: category is used by services.' });
    await queryOne('DELETE FROM service_categories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
