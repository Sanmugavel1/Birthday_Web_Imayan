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

// POST — save score
router.post('/', async (req, res) => {
  try {
    const { name, roll, score, total } = req.body;
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

module.exports = router;