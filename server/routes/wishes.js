// server/routes/wishes.js
const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');

const WishSchema = new mongoose.Schema({
  name:      String,
  roll:      String,
  treat:     String,
  msg:       String,
  createdAt: { type: Date, default: Date.now }
});
const Wish = mongoose.model('Wish', WishSchema);

// POST — submit wish
router.post('/', async (req, res) => {
  try {
    const { name, roll, treat, msg } = req.body;
    if (!name || !msg) return res.status(400).json({ error: 'Name and message required' });
    const wish = await Wish.create({ name, roll, treat, msg });
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

module.exports = router;