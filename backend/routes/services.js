const express = require('express');
const router = express.Router();
const multer = require('multer');
const { query, queryOne, requireBusiness } = require('../db');
const { uploadFile, deleteFile } = require('../storage');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (allowed.includes(file.originalname?.toLowerCase().match(/\.\w+$/)?.[0])) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

async function attachImages(services) {
  if (!services || services.length === 0) return services;
  const ids = services.map(s => s.id);
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const images = await query(
    `SELECT * FROM service_images WHERE service_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
    ids
  );
  const imgMap = {};
  images.forEach(img => {
    if (!imgMap[img.service_id]) imgMap[img.service_id] = [];
    imgMap[img.service_id].push(img);
  });
  return services.map(s => ({ ...s, images: imgMap[s.id] || [] }));
}

router.get('/', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const { category, search } = req.query;
    let sql = `
      SELECT s.*, sc.name as category_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE s.business_id = $1 AND s.visible = 1
    `;
    const params = [biz.id];
    let idx = 2;

    if (category && category !== 'all') {
      sql += ` AND sc.name = $${idx++}`;
      params.push(category);
    }
    if (search?.trim()) {
      const likeVal = `%${search.trim()}%`;
      sql += ` AND (s.name ILIKE $${idx} OR s.description ILIKE $${idx + 1})`;
      params.push(likeVal, likeVal);
    }
    sql += ' ORDER BY s.created_at DESC';

    const services = await query(sql, params);
    res.json(await attachImages(services));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admin', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const services = await query(`
      SELECT s.*, sc.name as category_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE s.business_id = $1
      ORDER BY s.created_at DESC
    `, [biz.id]);

    res.json(await attachImages(services));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const service = await queryOne(`
      SELECT s.*, sc.name as category_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE s.id = $1 AND s.business_id = $2
    `, [req.params.id, biz.id]);

    if (!service) return res.status(404).json({ error: 'Service not found.' });

    const images = await query(
      'SELECT * FROM service_images WHERE service_id = $1 ORDER BY sort_order ASC, id ASC',
      [req.params.id]
    );

    res.json({ ...service, images });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const { name, description, price, duration, time_windows, category_id, visible, show_gallery } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Service name is required.' });
    if (price === undefined || isNaN(Number(price))) return res.status(400).json({ error: 'Valid price is required.' });

    const service = await queryOne(`
      INSERT INTO services (business_id, name, description, price, duration, time_windows, category_id, visible, show_gallery)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [
      biz.id,
      name.trim(),
      description || '',
      Number(price),
      duration || '',
      time_windows || '',
      category_id ? Number(category_id) : null,
      visible === '0' || visible === false ? 0 : 1,
      show_gallery === '0' || show_gallery === false ? 0 : 1
    ]);

    const serviceId = service.id;

    if (req.files?.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const imageUrl = await uploadFile(req.files[i]);
        await queryOne(
          'INSERT INTO service_images (service_id, image_url, sort_order) VALUES ($1, $2, $3)',
          [serviceId, imageUrl, i]
        );
      }
    }

    const images = await query(
      'SELECT * FROM service_images WHERE service_id = $1 ORDER BY sort_order ASC',
      [serviceId]
    );
    res.status(201).json({ ...service, images });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const service = await queryOne(
      'SELECT * FROM services WHERE id = $1 AND business_id = $2',
      [req.params.id, biz.id]
    );
    if (!service) return res.status(404).json({ error: 'Service not found.' });

    const { name, description, price, duration, time_windows, category_id, visible, show_gallery } = req.body;

    await queryOne(`
      UPDATE services SET
        name = $1, description = $2, price = $3, duration = $4,
        time_windows = $5, category_id = $6, visible = $7, show_gallery = $8
      WHERE id = $9
    `, [
      name !== undefined ? name.trim() : service.name,
      description !== undefined ? description : service.description,
      price !== undefined ? Number(price) : service.price,
      duration !== undefined ? duration : service.duration,
      time_windows !== undefined ? time_windows : service.time_windows,
      category_id !== undefined ? (category_id ? Number(category_id) : null) : service.category_id,
      visible !== undefined ? (visible === '0' || visible === false || visible === 0 ? 0 : 1) : service.visible,
      show_gallery !== undefined ? (show_gallery === '0' || show_gallery === false || show_gallery === 0 ? 0 : 1) : service.show_gallery,
      req.params.id
    ]);

    if (req.files?.length > 0) {
      const maxOrder = await queryOne(
        'SELECT COALESCE(MAX(sort_order), -1) as m FROM service_images WHERE service_id = $1',
        [req.params.id]
      );
      let nextOrder = parseInt(maxOrder.m) + 1;
      for (const file of req.files) {
        const imageUrl = await uploadFile(file);
        await queryOne(
          'INSERT INTO service_images (service_id, image_url, sort_order) VALUES ($1, $2, $3)',
          [req.params.id, imageUrl, nextOrder++]
        );
      }
    }

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/visibility', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const service = await queryOne(
      'SELECT * FROM services WHERE id = $1 AND business_id = $2',
      [req.params.id, biz.id]
    );
    if (!service) return res.status(404).json({ error: 'Service not found.' });

    const newVisible = service.visible === 1 ? 0 : 1;
    await queryOne('UPDATE services SET visible = $1 WHERE id = $2', [newVisible, req.params.id]);
    res.json({ success: true, visible: newVisible });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const service = await queryOne(
      'SELECT * FROM services WHERE id = $1 AND business_id = $2',
      [req.params.id, biz.id]
    );
    if (!service) return res.status(404).json({ error: 'Service not found.' });

    const images = await query(
      'SELECT * FROM service_images WHERE service_id = $1', [req.params.id]
    );
    for (const img of images) {
      await deleteFile(img.image_url);
    }

    await queryOne('DELETE FROM services WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/images/:imgId', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;

    const service = await queryOne(
      'SELECT * FROM services WHERE id = $1 AND business_id = $2',
      [req.params.id, biz.id]
    );
    if (!service) return res.status(404).json({ error: 'Service not found.' });

    const img = await queryOne(
      'SELECT * FROM service_images WHERE id = $1 AND service_id = $2',
      [req.params.imgId, req.params.id]
    );
    if (!img) return res.status(404).json({ error: 'Image not found.' });

    await deleteFile(img.image_url);
    await queryOne('DELETE FROM service_images WHERE id = $1', [req.params.imgId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
