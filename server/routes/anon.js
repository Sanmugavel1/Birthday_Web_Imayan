// server/routes/anon.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

const AnonSchema = new mongoose.Schema({
  msg:       String,
  likes:     { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const Anon = mongoose.model('Anon', AnonSchema);

// POST — submit anonymous message
router.post('/', async (req, res) => {
  try {
    const { msg } = req.body;
    if (!msg) return res.status(400).json({ error: 'Message required' });
    const anon = await Anon.create({ msg });
    res.json(anon);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET — all anon messages sorted by newest
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

// PATCH — like a message
router.patch('/:id/like', async (req, res) => {
  try {
    const updated = await Anon.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;