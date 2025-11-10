const jwt = require('jsonwebtoken');
require('dotenv').config();
// --- FIX: Destructure Author from your models file ---
const { Author } = require('../models/blog'); // Adjust path as needed

// --- UPDATED: protectAdmin ---
// This middleware now checks for role: 'admin' in the token.
// Use this for routes ONLY an admin can access.
const protectAdmin = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 1. Check the role
      if (decoded.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized, admin access required' });
      }

      // 2. Attach admin info to the request
      req.admin = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      console.log(`Admin token verified for: ${req.admin.email}`);
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.warn('No token found in request.');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// --- UPDATED: protectAuthor ---
// This middleware now checks for role: 'author' in the token.
// Use this for routes ONLY an author can access.
const protectAuthor = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 1. Check the role
      if (decoded.role !== 'author') {
        return res.status(403).json({ message: 'Not authorized, author access required' });
      }

      // 2. Get author from the ID in the token
      req.author = await Author.findById(decoded.id).select('-password');

      if (!req.author) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      console.log(`Author token verified for: ${req.author.email}`);
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.warn('No token found in request.');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};


// --- 🌟 NEW: General Auth Middleware 🌟 ---
// Use this for routes BOTH admins and authors can access.
// It checks for ANY valid token and attaches info to req.user
const checkAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to req.user based on role
      if (decoded.role === 'admin') {
        // For admin, the token payload is enough
        req.user = decoded; 
        console.log(`Auth check: Admin ${decoded.email}`);
        next();
      } else if (decoded.role === 'author') {
        // For author, we need to find them in the DB
        const author = await Author.findById(decoded.id).select('-password');
        if (!author) {
          return res.status(401).json({ message: 'Author not found' });
        }
        
        // Convert to plain object and add role for consistent access in controllers
        req.user = author.toObject(); 
        req.user.role = 'author'; // Add role property
        
        console.log(`Auth check: Author ${req.user.email}`);
        next();
      } else {
        return res.status(401).json({ message: 'Invalid token role' });
      }
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};


// --- UPDATED EXPORTS ---
// Now export all three functions
module.exports = { protectAdmin, protectAuthor, checkAuth };
