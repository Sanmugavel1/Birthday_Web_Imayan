// server/routes/uploads.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Storage config
function makeStorage(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../uploads', folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '_' + file.originalname);
    }
  });
}

const galleryUpload = multer({ storage: makeStorage('gallery') });
const videoUpload   = multer({ storage: makeStorage('video') });
const heroUpload    = multer({ storage: makeStorage('hero') });

// Admin password check middleware
function adminOnly(req, res, next) {
  if (req.headers['x-admin-pass'] === process.env.ADMIN_PASSWORD) return next();
  res.status(403).json({ error: 'Forbidden' });
}

// POST gallery photos
router.post('/gallery', adminOnly, galleryUpload.array('photos'), (req, res) => {
  const urls = req.files.map(f => `/uploads/gallery/${f.filename}`);
  res.json({ urls });
});

// GET gallery photos
router.get('/gallery', (req, res) => {
  const dir = path.join(__dirname, '../uploads/gallery');
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir).map(f => `/uploads/gallery/${f}`);
  res.json(files);
});

// POST video
router.post('/video', adminOnly, videoUpload.single('video'), (req, res) => {
  res.json({ url: `/uploads/video/${req.file.filename}` });
});

// GET video
router.get('/video', (req, res) => {
  const dir = path.join(__dirname, '../uploads/video');
  if (!fs.existsSync(dir)) return res.json(null);
  const files = fs.readdirSync(dir);
  if (!files.length) return res.json(null);
  res.json({ url: `/uploads/video/${files[0]}` });
});

// POST hero photo (1 or 2)
router.post('/hero/:num', adminOnly, heroUpload.single('photo'), (req, res) => {
  res.json({ url: `/uploads/hero/${req.file.filename}`, num: req.params.num });
});

// GET hero photos
router.get('/hero', (req, res) => {
  const dir = path.join(__dirname, '../uploads/hero');
  if (!fs.existsSync(dir)) return res.json({});
  const files = fs.readdirSync(dir);
  // Return latest photo1 and photo2
  const result = {};
  [1, 2].forEach(n => {
    const match = files.filter(f => f.includes(`_photo${n}`) || f.endsWith(`_${n}`)).pop();
    if (match) result[n] = `/uploads/hero/${match}`;
  });
  res.json(result);
});

module.exports = router;