let app;
try {
  app = require('../backend/server');
} catch (err) {
  module.exports = (req, res) => {
    res.status(500).json({ error: err.message, stack: err.stack?.split('\n').slice(0, 6).join(' | ') });
  };
}
if (app) module.exports = app;
