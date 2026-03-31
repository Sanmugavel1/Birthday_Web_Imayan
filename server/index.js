// server/index.js
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded files (images/videos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/wishes',  require('./routes/wishes'));
app.use('/api/anon',    require('./routes/anon'));
app.use('/api/quiz',    require('./routes/quiz'));
app.use('/api/uploads', require('./routes/uploads'));

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
  })
  .catch(err => { console.error('❌ DB Error:', err); process.exit(1); });