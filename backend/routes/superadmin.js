const express = require('express');
const router = express.Router();
const multer = require('multer');
const { query, queryOne } = require('../db');
const { uploadFile, deleteFile } = require('../storage');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    if (allowed.includes(file.originalname?.toLowerCase().match(/\.\w+$/)?.[0])) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

const uploadFields = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'hero', maxCount: 1 }
]);

async function requireSuperAdmin(req, res, next) {
  const token = req.headers['x-super-admin'];
  if (!token) return res.status(401).json({ error: 'Super admin auth required' });

  const [username, password] = token.split(':');
  const admin = await queryOne(
    'SELECT * FROM super_admins WHERE username = $1 AND password_hash = $2',
    [username, password]
  );

  if (!admin) return res.status(403).json({ error: 'Invalid super admin credentials' });
  req.superAdmin = admin;
  next();
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const admin = await queryOne(
      'SELECT id, username FROM super_admins WHERE username = $1 AND password_hash = $2',
      [username, password]
    );

    if (!admin) return res.status(403).json({ error: 'Invalid credentials' });
    res.json({ success: true, token: `${username}:${password}`, admin: { id: admin.id, username: admin.username } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/businesses', requireSuperAdmin, async (req, res) => {
  try {
    const businesses = await query(`
      SELECT b.*,
        (SELECT COUNT(*) FROM services WHERE business_id = b.id) as service_count,
        (SELECT COUNT(*) FROM reservations WHERE business_id = b.id) as reservation_count
      FROM businesses b
      ORDER BY b.created_at DESC
    `);

    const safe = businesses.map(({ admin_password, ...rest }) => rest);
    res.json(safe);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/businesses/:id', requireSuperAdmin, async (req, res) => {
  try {
    const biz = await queryOne('SELECT * FROM businesses WHERE id = $1', [req.params.id]);
    if (!biz) return res.status(404).json({ error: 'Business not found' });
    res.json(biz);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/businesses', requireSuperAdmin, uploadFields, async (req, res) => {
  try {
    const {
      name, subdomain, tagline, about, phone, address, map_url,
      status, color_primary, color_secondary, color_tertiary,
      staff_display, gallery_display
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Business name is required' });
    if (!subdomain?.trim()) return res.status(400).json({ error: 'Subdomain is required' });
    if (!/^[a-z0-9-]+$/.test(subdomain.trim())) {
      return res.status(400).json({ error: 'Subdomain may only contain lowercase letters, numbers, and hyphens' });
    }
    if (!phone?.trim()) return res.status(400).json({ error: 'Phone number is required for Reserve Now feature' });

    const logo_url = req.files?.logo ? await uploadFile(req.files.logo[0]) : '';
    const hero_image_url = req.files?.hero ? await uploadFile(req.files.hero[0]) : '';

    const created = await queryOne(`
      INSERT INTO businesses (
        name, subdomain, logo_url, hero_image_url, tagline, about, phone, address, map_url,
        status, color_primary, color_secondary, color_tertiary, staff_display, gallery_display
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      name.trim(), subdomain.trim().toLowerCase(),
      logo_url, hero_image_url,
      tagline || '', about || '', phone.trim(), address || '', map_url || '',
      status === 'disabled' ? 'disabled' : 'active',
      color_primary || '#2563eb',
      color_secondary || '#7c3aed',
      color_tertiary || '#0891b2',
      staff_display === '0' ? 0 : 1,
      gallery_display === '0' ? 0 : 1
    ]);

    res.status(201).json(created);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Subdomain already taken' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/businesses/:id', requireSuperAdmin, uploadFields, async (req, res) => {
  try {
    const biz = await queryOne('SELECT * FROM businesses WHERE id = $1', [req.params.id]);
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    const {
      name, subdomain, tagline, about, phone, address, map_url,
      status, color_primary, color_secondary, color_tertiary,
      staff_display, gallery_display
    } = req.body;

    let logo_url = biz.logo_url;
    if (req.files?.logo) {
      await deleteFile(biz.logo_url);
      logo_url = await uploadFile(req.files.logo[0]);
    }

    let hero_image_url = biz.hero_image_url || '';
    if (req.files?.hero) {
      await deleteFile(biz.hero_image_url);
      hero_image_url = await uploadFile(req.files.hero[0]);
    }

    if (subdomain && !/^[a-z0-9-]+$/.test(subdomain.trim())) {
      return res.status(400).json({ error: 'Invalid subdomain format' });
    }

    await queryOne(`
      UPDATE businesses SET
        name = $1, subdomain = $2, logo_url = $3, hero_image_url = $4,
        tagline = $5, about = $6, phone = $7, address = $8, map_url = $9,
        status = $10, color_primary = $11, color_secondary = $12, color_tertiary = $13,
        staff_display = $14, gallery_display = $15,
        updated_at = NOW()
      WHERE id = $16
    `, [
      name !== undefined ? name.trim() : biz.name,
      subdomain !== undefined ? subdomain.trim().toLowerCase() : biz.subdomain,
      logo_url, hero_image_url,
      tagline !== undefined ? tagline : biz.tagline,
      about !== undefined ? about : biz.about,
      phone !== undefined ? phone : biz.phone,
      address !== undefined ? address : biz.address,
      map_url !== undefined ? map_url : (biz.map_url || ''),
      status !== undefined ? status : biz.status,
      color_primary !== undefined ? color_primary : (biz.color_primary || '#2563eb'),
      color_secondary !== undefined ? color_secondary : (biz.color_secondary || '#7c3aed'),
      color_tertiary !== undefined ? color_tertiary : (biz.color_tertiary || '#0891b2'),
      staff_display !== undefined ? (staff_display === '0' || staff_display === false || staff_display === 0 ? 0 : 1) : (biz.staff_display ?? 1),
      gallery_display !== undefined ? (gallery_display === '0' || gallery_display === false || gallery_display === 0 ? 0 : 1) : (biz.gallery_display ?? 1),
      req.params.id
    ]);

    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Subdomain already taken' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/businesses/:id/status', requireSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or disabled' });
    }
    const biz = await queryOne('SELECT id FROM businesses WHERE id = $1', [req.params.id]);
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    await queryOne(
      'UPDATE businesses SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, req.params.id]
    );
    res.json({ success: true, status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/businesses/:id', requireSuperAdmin, async (req, res) => {
  try {
    const biz = await queryOne('SELECT * FROM businesses WHERE id = $1', [req.params.id]);
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    await Promise.all([
      deleteFile(biz.logo_url),
      deleteFile(biz.hero_image_url),
    ]);

    await queryOne('DELETE FROM businesses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/businesses/:id/admin-password', requireSuperAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password?.trim()) return res.status(400).json({ error: 'Password is required' });
    if (password.trim().length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

    const biz = await queryOne('SELECT id FROM businesses WHERE id = $1', [req.params.id]);
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    await queryOne(
      'UPDATE businesses SET admin_password = $1, updated_at = NOW() WHERE id = $2',
      [password.trim(), req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/admin-login', async (req, res) => {
  try {
    const { business_id, password } = req.body;
    if (!business_id || !password) return res.status(400).json({ error: 'business_id and password required' });

    const biz = await queryOne(
      "SELECT id, name, subdomain, logo_url, hero_image_url, tagline, phone, status, admin_password FROM businesses WHERE id = $1",
      [business_id]
    );

    if (!biz) return res.status(404).json({ error: 'Business not found' });
    if (biz.status === 'disabled') return res.status(403).json({ error: 'Business is inactive' });
    if (!biz.admin_password) return res.status(403).json({ error: 'Admin access not configured. Contact your platform administrator.' });
    if (biz.admin_password !== password.trim()) return res.status(403).json({ error: 'Incorrect password' });

    const { admin_password, ...safe } = biz;
    res.json({ success: true, business: safe });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats', requireSuperAdmin, async (req, res) => {
  try {
    const [totalBusinesses, activeBusinesses, totalReservations, totalServices, recentBusinesses] = await Promise.all([
      queryOne('SELECT COUNT(*) as c FROM businesses'),
      queryOne("SELECT COUNT(*) as c FROM businesses WHERE status = 'active'"),
      queryOne('SELECT COUNT(*) as c FROM reservations'),
      queryOne('SELECT COUNT(*) as c FROM services'),
      query(
        'SELECT id, name, subdomain, status, created_at FROM businesses ORDER BY created_at DESC LIMIT 5'
      ),
    ]);

    res.json({
      total_businesses:  parseInt(totalBusinesses.c),
      active_businesses: parseInt(activeBusinesses.c),
      total_reservations: parseInt(totalReservations.c),
      total_services:    parseInt(totalServices.c),
      recent_businesses: recentBusinesses,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
