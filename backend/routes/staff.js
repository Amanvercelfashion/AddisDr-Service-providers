const express = require('express');
const router = express.Router();
const multer = require('multer');
const { query, queryOne, requireBusiness } = require('../db');
const { uploadFile, deleteFile } = require('../storage');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowed.includes(file.originalname?.toLowerCase().match(/\.\w+$/)?.[0])) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

router.get('/', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const members = await query(
      'SELECT * FROM staff WHERE business_id = $1 AND visible = 1 ORDER BY sort_order ASC, id ASC',
      [biz.id]
    );
    res.json(members);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admin', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const members = await query(
      'SELECT * FROM staff WHERE business_id = $1 ORDER BY sort_order ASC, id ASC',
      [biz.id]
    );
    res.json(members);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const { name, role, bio, sort_order, visible } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Staff name is required.' });

    const photo_url = req.file ? await uploadFile(req.file) : '';

    const member = await queryOne(
      `INSERT INTO staff (business_id, name, role, bio, photo_url, sort_order, visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [biz.id, name.trim(), role || '', bio || '', photo_url,
       sort_order ? Number(sort_order) : 0,
       visible === '0' || visible === false ? 0 : 1]
    );
    res.status(201).json(member);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const member = await queryOne(
      'SELECT * FROM staff WHERE id = $1 AND business_id = $2',
      [req.params.id, biz.id]
    );
    if (!member) return res.status(404).json({ error: 'Staff member not found.' });

    const { name, role, bio, sort_order, visible } = req.body;
    let photo_url = member.photo_url;

    if (req.file) {
      await deleteFile(member.photo_url);
      photo_url = await uploadFile(req.file);
    }

    await queryOne(
      `UPDATE staff SET name = $1, role = $2, bio = $3, photo_url = $4, sort_order = $5, visible = $6 WHERE id = $7`,
      [
        name !== undefined ? name.trim() : member.name,
        role !== undefined ? role : member.role,
        bio !== undefined ? bio : member.bio,
        photo_url,
        sort_order !== undefined ? Number(sort_order) : member.sort_order,
        visible !== undefined ? (visible === '0' || visible === false || visible === 0 ? 0 : 1) : member.visible,
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const member = await queryOne(
      'SELECT * FROM staff WHERE id = $1 AND business_id = $2',
      [req.params.id, biz.id]
    );
    if (!member) return res.status(404).json({ error: 'Staff member not found.' });

    await deleteFile(member.photo_url);
    await queryOne('DELETE FROM staff WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
