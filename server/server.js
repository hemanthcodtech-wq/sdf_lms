const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', require('./routes/userManagementRoutes'));

// Error Handling Middleware for "no timeout lateness error"
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sdf_lms';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Only listen if not in Vercel production environment
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

// Export the app for Vercel serverless functions
module.exports = app;
