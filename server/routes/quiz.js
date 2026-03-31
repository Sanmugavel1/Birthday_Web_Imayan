// server/routes/quiz.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  name:      String,
  roll:      String,
  score:     Number,
  total:     Number,
  createdAt: { type: Date, default: Date.now }
});
const QuizScore = mongoose.model('QuizScore', QuizSchema);

function adminOnly(req, res, next) {
  if (req.headers['x-admin-pass'] === process.env.ADMIN_PASSWORD) return next();
  res.status(403).json({ error: 'Forbidden' });
}

// POST — save quiz score
router.post('/', async (req, res) => {
  try {
    const { name, roll, score, total } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const entry = await QuizScore.create({ name, roll, score, total });
    res.json(entry);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET — all scores sorted highest first
router.get('/', async (req, res) => {
  try {
    const scores = await QuizScore.find().sort({ score: -1, createdAt: 1 });
    res.json(scores);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE single quiz entry (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const deleted = await QuizScore.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE all quiz scores (admin only — reset leaderboard)
router.delete('/', adminOnly, async (req, res) => {
  try {
    await QuizScore.deleteMany({});
    res.json({ cleared: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;