// Simple token-based protection for admin-only routes
// Frontend must send:  Authorization: Bearer <ADMIN_SECRET>

const adminAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (token !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Invalid admin token.',
    });
  }

  next();
};

module.exports = adminAuth;
