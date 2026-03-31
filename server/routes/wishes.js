// server/routes/wishes.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

const WishSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  roll:      String,
  treat:     String,
  msg:       { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Wish = mongoose.model('Wish', WishSchema);

function adminOnly(req, res, next) {
  if (req.headers['x-admin-pass'] === process.env.ADMIN_PASSWORD) return next();
  res.status(403).json({ error: 'Forbidden' });
}

// POST — submit wish
router.post('/', async (req, res) => {
  try {
    const { name, roll, treat, msg } = req.body;
    if (!name || !msg) return res.status(400).json({ error: 'Name and message required' });
    const wish = await Wish.create({ name: name.trim(), roll, treat, msg: msg.trim() });
    res.json(wish);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET — all wishes (newest first)
router.get('/', async (req, res) => {
  try {
    const wishes = await Wish.find().sort({ createdAt: -1 });
    res.json(wishes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE single wish (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const deleted = await Wish.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE all wishes (admin only)
router.delete('/', adminOnly, async (req, res) => {
  try {
    await Wish.deleteMany({});
    res.json({ cleared: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;