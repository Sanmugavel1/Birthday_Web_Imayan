require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

// ── Safety check — fail fast if critical env vars are missing ──
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not set in your .env file!');
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD is not set in your .env file! Admin actions will all return 403.');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/wishes',  require('./routes/wishes'));
app.use('/api/anon',    require('./routes/anon'));
app.use('/api/quiz',    require('./routes/quiz'));
app.use('/api/uploads', require('./routes/uploads'));

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// MongoDB + Server
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('✅ MongoDB connected');
  console.log(`🔑 Admin password loaded: ${process.env.ADMIN_PASSWORD ? 'YES ✅' : 'MISSING ❌'}`);

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ DB Error:', err);
  process.exit(1);
});