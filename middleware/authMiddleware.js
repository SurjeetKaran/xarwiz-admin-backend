const jwt = require('jsonwebtoken');
require('dotenv').config();

const protectAdmin = (req, res, next) => {
  let token;

  // Check for the token in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // We're not attaching a user to req, as we just need to know
      // if they are an admin. The token itself is proof.
      // In a multi-user system, you'd find the user: req.user = await User.findById(decoded.id)
      console.log('Admin token verified.');
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

module.exports = { protectAdmin };
