const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initDb } = require('./db');
const booksRoutes = require('./routes/books');
const libraryRoutes = require('./routes/library');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/books', booksRoutes);
app.use('/api/library', libraryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Virtual Library API is running smoothly' });
});

// Serve frontend static build in production if available
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    // Only route to index.html if request is not an API call
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API Endpoint not found' });
    }
  });
} else {
  // 404 Handler for API
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Virtual Library Backend running on http://localhost:${PORT}`);
  // Initialize Database and table
  await initDb();
});
