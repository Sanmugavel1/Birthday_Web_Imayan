// server/routes/uploads.js
// ══════════════════════════════════════════════════════════════
//  UPLOADS — Base64 storage in MongoDB (NO disk, NO multer)
//  Same pattern as portfolio's profileImage storage.
//  Works perfectly on Render free tier — no paid disk needed.
// ══════════════════════════════════════════════════════════════

const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

// ── Auth middleware ───────────────────────────────────────────
function adminOnly(req, res, next) {
  if (req.headers['x-admin-pass'] === process.env.ADMIN_PASSWORD) return next();
  res.status(403).json({ error: 'Forbidden' });
}

// ══════════════════════════════════════════════════════════════
//  MONGOOSE SCHEMAS
// ══════════════════════════════════════════════════════════════

// Gallery — array of base64 image strings with IDs
const GallerySchema = new mongoose.Schema({
  data:      { type: String, required: true }, // base64 data URL  e.g. "data:image/jpeg;base64,..."
  filename:  { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Gallery = mongoose.model('Gallery', GallerySchema);

// Video — single document (we overwrite it each time)
const VideoSchema = new mongoose.Schema({
  data:      { type: String, required: true }, // base64 data URL
  filename:  { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Video = mongoose.model('Video', VideoSchema);

// HeroPhoto — slot 1 and slot 2 stored separately
const HeroSchema = new mongoose.Schema({
  slot:      { type: Number, required: true, unique: true }, // 1 or 2
  data:      { type: String, required: true }, // base64 data URL
  filename:  { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Hero = mongoose.model('Hero', HeroSchema);

// ══════════════════════════════════════════════════════════════
//  GALLERY ROUTES
// ══════════════════════════════════════════════════════════════

// GET all gallery photos
router.get('/gallery', async (req, res) => {
  try {
    const photos = await Gallery.find().sort({ createdAt: 1 });
    // Return id + base64 data URL (frontend uses data directly as img src)
    res.json(photos.map(p => ({
      _id:      p._id,
      filename: p.filename,
      url:      p.data   // base64 data URL acts as the "url"
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST upload gallery photos (admin) — receives base64 array
// Frontend sends: { photos: [ { data: "data:image/jpeg;base64,...", filename: "pic.jpg" }, ... ] }
router.post('/gallery', adminOnly, async (req, res) => {
  try {
    const { photos } = req.body;
    if (!photos || !Array.isArray(photos) || !photos.length) {
      return res.status(400).json({ error: 'No photos provided' });
    }
    const saved = [];
    for (const photo of photos) {
      if (!photo.data) continue;
      const doc = await Gallery.create({ data: photo.data, filename: photo.filename || '' });
      saved.push({ _id: doc._id, filename: doc.filename, url: doc.data });
    }
    res.json(saved);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE single gallery photo (admin)
router.delete('/gallery/:id', adminOnly, async (req, res) => {
  try {
    const deleted = await Gallery.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE all gallery photos (admin)
router.delete('/gallery', adminOnly, async (req, res) => {
  try {
    await Gallery.deleteMany({});
    res.json({ cleared: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════
//  VIDEO ROUTES
// ══════════════════════════════════════════════════════════════

// GET current video
router.get('/video', async (req, res) => {
  try {
    const video = await Video.findOne().sort({ createdAt: -1 });
    if (!video) return res.json(null);
    res.json({ _id: video._id, filename: video.filename, url: video.data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST upload video (admin)
// Frontend sends: { data: "data:video/mp4;base64,...", filename: "birthday.mp4" }
router.post('/video', adminOnly, async (req, res) => {
  try {
    const { data, filename } = req.body;
    if (!data) return res.status(400).json({ error: 'No video data provided' });

    // Delete old video(s) first — keep only latest
    await Video.deleteMany({});
    const video = await Video.create({ data, filename: filename || '' });
    res.json({ _id: video._id, filename: video.filename, url: video.data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE video (admin)
router.delete('/video', adminOnly, async (req, res) => {
  try {
    await Video.deleteMany({});
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════
//  HERO PHOTO ROUTES
// ══════════════════════════════════════════════════════════════

// GET both hero photos
router.get('/hero', async (req, res) => {
  try {
    const heroes = await Hero.find({ slot: { $in: [1, 2] } });
    const result = {};
    heroes.forEach(h => {
      result[h.slot] = { _id: h._id, filename: h.filename, url: h.data };
    });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST upload hero photo (admin)
// Frontend sends: { data: "data:image/jpeg;base64,...", filename: "hero1.jpg" }
router.post('/hero/:num', adminOnly, async (req, res) => {
  try {
    const num = parseInt(req.params.num);
    if (num !== 1 && num !== 2) return res.status(400).json({ error: 'Slot must be 1 or 2' });
    const { data, filename } = req.body;
    if (!data) return res.status(400).json({ error: 'No image data provided' });

    // Upsert — replace existing slot or create new
    const hero = await Hero.findOneAndUpdate(
      { slot: num },
      { data, filename: filename || '', createdAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ num, _id: hero._id, filename: hero.filename, url: hero.data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE hero photo slot (admin)
router.delete('/hero/:num', adminOnly, async (req, res) => {
  try {
    const num = parseInt(req.params.num);
    await Hero.deleteOne({ slot: num });
    res.json({ deleted: num });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;