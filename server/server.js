const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');

// Fix DNS SRV query issue with MongoDB Atlas on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sdf_lms';

// --- Serverless MongoDB Connection Pattern ---
const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      return;
    }
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

connectDB();

// Ensure DB is connected before handling any requests
app.use(async (req, res, next) => {
  await connectDB();
  next();
});
// ---------------------------------------------

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Uploads Directory (AWS / Server File Storage)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Dynamic SEO Sitemap XML Endpoint
app.get('/sitemap.xml', async (req, res) => {
  try {
    const Course = require('./models/Course');
    const courses = await Course.find({}, 'slug _id updatedAt createdAt title');

    const baseUrl = 'https://swamydwija.org';
    const staticPages = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/courses`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
      { loc: `${baseUrl}/contact`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/terms`, priority: '0.5', changefreq: 'yearly' },
      { loc: `${baseUrl}/privacy`, priority: '0.5', changefreq: 'yearly' },
      { loc: `${baseUrl}/refund-policy`, priority: '0.5', changefreq: 'yearly' },
      { loc: `${baseUrl}/login`, priority: '0.6', changefreq: 'monthly' },
      { loc: `${baseUrl}/register`, priority: '0.6', changefreq: 'monthly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static URLs
    staticPages.forEach(page => {
      xml += `  <url>\n`;
      xml += `    <loc>${page.loc}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Dynamic Course URLs
    courses.forEach(course => {
      const courseIdOrSlug = course.slug || course._id;
      const lastMod = course.updatedAt ? new Date(course.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/courses/${courseIdOrSlug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', require('./routes/userManagementRoutes'));
app.use('/api/admin/instructors', require('./routes/instructorManagementRoutes'));
app.use('/api/admin/moderators', require('./routes/moderatorManagementRoutes'));
app.use('/api/instructor', require('./routes/instructorPortalRoutes'));
app.use('/api/moderator', require('./routes/moderatorPortalRoutes'));
app.use('/api/zoom', require('./routes/zoomWebhookRoutes'));
app.use('/api/live-classes', require('./routes/liveClassRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Only listen if not in Vercel production environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for Vercel serverless functions
module.exports = app;
