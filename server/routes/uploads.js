// server/routes/uploads.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// ── Storage helpers ──────────────────────────
function makeStorage(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../uploads', folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // sanitise original name
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, Date.now() + '_' + safe);
    }
  });
}

const galleryUpload = multer({ storage: makeStorage('gallery'), limits: { fileSize: 10 * 1024 * 1024 } });
const videoUpload   = multer({ storage: makeStorage('video'),   limits: { fileSize: 500 * 1024 * 1024 } });
const heroUpload    = multer({ storage: makeStorage('hero'),    limits: { fileSize: 10 * 1024 * 1024 } });

// ── Auth middleware ───────────────────────────
function adminOnly(req, res, next) {
  if (req.headers['x-admin-pass'] === process.env.ADMIN_PASSWORD) return next();
  res.status(403).json({ error: 'Forbidden' });
}

// ═══════════════════════════════════════════
//  GALLERY
// ═══════════════════════════════════════════

// GET all gallery photos
router.get('/gallery', (req, res) => {
  const dir = path.join(__dirname, '../uploads/gallery');
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .sort()
    .map(f => ({ filename: f, url: `/uploads/gallery/${f}` }));
  res.json(files);
});

// POST upload gallery photos (admin)
router.post('/gallery', adminOnly, galleryUpload.array('photos', 20), (req, res) => {
  const files = req.files.map(f => ({ filename: f.filename, url: `/uploads/gallery/${f.filename}` }));
  res.json(files);
});

// DELETE single gallery photo (admin)
router.delete('/gallery/:filename', adminOnly, (req, res) => {
  const filePath = path.join(__dirname, '../uploads/gallery', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  fs.unlinkSync(filePath);
  res.json({ deleted: req.params.filename });
});

// DELETE all gallery photos (admin)
router.delete('/gallery', adminOnly, (req, res) => {
  const dir = path.join(__dirname, '../uploads/gallery');
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(f => fs.unlinkSync(path.join(dir, f)));
  }
  res.json({ cleared: true });
});

// ═══════════════════════════════════════════
//  VIDEO
// ═══════════════════════════════════════════

// GET current video
router.get('/video', (req, res) => {
  const dir = path.join(__dirname, '../uploads/video');
  if (!fs.existsSync(dir)) return res.json(null);
  const files = fs.readdirSync(dir).filter(f => /\.(mp4|mov|webm|avi|mkv)$/i.test(f));
  if (!files.length) return res.json(null);
  // Return the most recent
  const latest = files.sort().pop();
  res.json({ filename: latest, url: `/uploads/video/${latest}` });
});

// POST upload video (admin)
router.post('/video', adminOnly, videoUpload.single('video'), (req, res) => {
  // Delete old videos to keep only the latest
  const dir = path.join(__dirname, '../uploads/video');
  fs.readdirSync(dir)
    .filter(f => f !== req.file.filename)
    .forEach(f => {
      try { fs.unlinkSync(path.join(dir, f)); } catch {}
    });
  res.json({ filename: req.file.filename, url: `/uploads/video/${req.file.filename}` });
});

// DELETE video (admin)
router.delete('/video', adminOnly, (req, res) => {
  const dir = path.join(__dirname, '../uploads/video');
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(f => {
      try { fs.unlinkSync(path.join(dir, f)); } catch {}
    });
  }
  res.json({ deleted: true });
});

// ═══════════════════════════════════════════
//  HERO PHOTOS
// ═══════════════════════════════════════════

// GET both hero photos
router.get('/hero', (req, res) => {
  const dir = path.join(__dirname, '../uploads/hero');
  if (!fs.existsSync(dir)) return res.json({});
  const files = fs.readdirSync(dir);
  const result = {};
  [1, 2].forEach(n => {
    // Find file whose name contains _photo{n}_ or ends with _{n}.ext
    const match = files
      .filter(f => f.includes(`_photo${n}`) || new RegExp(`_${n}\\.[a-z]+$`, 'i').test(f))
      .sort()
      .pop();
    if (match) result[n] = { filename: match, url: `/uploads/hero/${match}` };
  });
  res.json(result);
});

// POST upload hero photo (admin)
router.post('/hero/:num', adminOnly, heroUpload.single('photo'), (req, res) => {
  const num = req.params.num;
  // Rename file to include slot number for easy lookup
  const dir      = path.join(__dirname, '../uploads/hero');
  const oldPath  = req.file.path;
  const ext      = path.extname(req.file.originalname) || '.jpg';
  const newName  = `${Date.now()}_photo${num}${ext}`;
  const newPath  = path.join(dir, newName);

  // Delete old hero photo for this slot
  fs.readdirSync(dir)
    .filter(f => f.includes(`_photo${num}`))
    .forEach(f => { try { fs.unlinkSync(path.join(dir, f)); } catch {} });

  fs.renameSync(oldPath, newPath);
  res.json({ num, filename: newName, url: `/uploads/hero/${newName}` });
});

// DELETE hero photo slot (admin)
router.delete('/hero/:num', adminOnly, (req, res) => {
  const num = req.params.num;
  const dir = path.join(__dirname, '../uploads/hero');
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir)
      .filter(f => f.includes(`_photo${num}`))
      .forEach(f => { try { fs.unlinkSync(path.join(dir, f)); } catch {} });
  }
  res.json({ deleted: num });
});

module.exports = router;