/**
 * CRASH SMP — server.js
 * Server Node.js/Express minimal pentru servirea site-ului static
 * și expunerea unui endpoint REST /api/staff.
 *
 * Pornire: node server.js  (sau: npm start)
 */

'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Securitate minimă ── */
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

/* ── Fișiere statice cu cache scurt în dev ── */
app.use(express.static(path.join(__dirname), {
  etag:   true,
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  index:  'index.html',
}));

/* ── API: GET /api/staff ── */
app.get('/api/staff', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'staff.json');
  fs.readFile(filePath, 'utf8', (err, raw) => {
    if (err) {
      console.error('[/api/staff] Eroare la citirea fișierului:', err.message);
      return res.status(500).json({ error: 'Nu s-au putut încărca datele staff.' });
    }
    try {
      const data = JSON.parse(raw);
      res.json(data);
    } catch (parseErr) {
      console.error('[/api/staff] JSON invalid:', parseErr.message);
      res.status(500).json({ error: 'Date staff corupte.' });
    }
  });
});

/* ── Fallback SPA — orice altă rută servește index.html ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ── Pornire server ── */
app.listen(PORT, () => {
  console.log(`\n💥  CRASH SMP — server pornit!`);
  console.log(`🌐  http://localhost:${PORT}\n`);
});
