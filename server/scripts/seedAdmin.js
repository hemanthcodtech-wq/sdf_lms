const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User'); // Adjust path as needed

// Load env vars
dotenv.config({ path: __dirname + '/../.env' });

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@sdf.com';
    const adminPassword = process.env.SUPERADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ emailOrPhone: adminEmail });
    
    if (existingAdmin) {
      console.log('Superadmin already exists!');
      process.exit();
    }

    // Create superadmin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = new User({
      emailOrPhone: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    // Mongoose pre-save hook handles hashing, so we shouldn't hash it here if it's already running the hook.
    // Wait, the User model pre-save hook hashes the password. So we just pass the plain password!
    
    adminUser.password = adminPassword; // Overwrite because pre-save hook will hash it

    await adminUser.save();
    console.log('Superadmin seeded successfully! Email:', adminEmail, 'Password:', adminPassword);
    
    process.exit();
  } catch (error) {
    console.error('Error seeding superadmin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
