require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const REQUIRED_ENV = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required environment variables:\n  ${missing.join('\n  ')}`);
  if (!process.env.VERCEL) process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes('*') || !origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const reservationLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 10, message: { error: 'Too many requests. Try again later.' } });

app.use('/api', apiLimiter);

app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/business', require('./routes/business'));
app.use('/api/service-categories', require('./routes/serviceCategories'));
app.use('/api/services', require('./routes/services'));
app.use('/api/work-hours', require('./routes/workHours'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/reservations', reservationLimiter, require('./routes/reservations'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/analytics', require('./routes/analytics'));

app.get('/api/debug', (req, res) => {
  const fsPaths = [
    { label: '__dirname', p: __dirname },
    { label: 'cwd', p: process.cwd() },
  ];
  const result = { req: { url: req.url, originalUrl: req.originalUrl, path: req.path } };
  fsPaths.forEach(({ label, p }) => {
    try {
      const exists = fs.existsSync(p);
      result[label] = exists;
      if (exists && fs.statSync(p).isDirectory()) {
        result[label + ' (files)'] = fs.readdirSync(p);
      }
    } catch (e) { result[label + ' (error)'] = e.message; }
  });
  res.json(result);
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Not allowed by CORS') return res.status(403).json({ error: 'CORS not allowed' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 10MB).' });
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\nServices SaaS API running on http://localhost:${PORT}`);
    console.log(`Super Admin: http://localhost:${PORT}/api/superadmin`);
    console.log(`Uploads: http://localhost:${PORT}/uploads\n`);
  });
}

module.exports = app;
