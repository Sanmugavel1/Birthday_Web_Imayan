// server/routes/anon.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

const AnonSchema = new mongoose.Schema({
  msg:       { type: String, required: true, maxlength: 600 },
  likes:     { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const Anon = mongoose.model('Anon', AnonSchema);

// Auth middleware
function adminOnly(req, res, next) {
  if (req.headers['x-admin-pass'] === process.env.ADMIN_PASSWORD) return next();
  res.status(403).json({ error: 'Forbidden' });
}

// POST — submit anonymous message
router.post('/', async (req, res) => {
  try {
    const { msg } = req.body;
    if (!msg || !msg.trim()) return res.status(400).json({ error: 'Message required' });
    const anon = await Anon.create({ msg: msg.trim() });
    res.json(anon);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET — all anon messages (newest first)
router.get('/', async (req, res) => {
  try {
    const msgs = await Anon.find().sort({ createdAt: -1 });
    res.json(msgs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET — top liked anon message
router.get('/top', async (req, res) => {
  try {
    const top = await Anon.findOne({ likes: { $gte: 1 } }).sort({ likes: -1 });
    res.json(top || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH — like a message (public, once per device via client)
router.patch('/:id/like', async (req, res) => {
  try {
    const updated = await Anon.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE single anon message (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const deleted = await Anon.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE all anon messages (admin only)
router.delete('/', adminOnly, async (req, res) => {
  try {
    await Anon.deleteMany({});
    res.json({ cleared: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;