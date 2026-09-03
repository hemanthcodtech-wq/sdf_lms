const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no token' });
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized as an admin' });
  }
};

const instructor = (req, res, next) => {
  if (req.user && (req.user.role === 'instructor' || req.user.role === 'admin')) {
    return next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized as an instructor' });
  }
};

const moderator = (req, res, next) => {
  if (req.user && (req.user.role === 'moderator' || req.user.role === 'admin')) {
    return next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized as a moderator' });
  }
};

module.exports = { protect, admin, instructor, moderator };

