const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'freshradar-secret';

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const emailHeader = req.headers['x-user-email'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.userEmail = decoded.email;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } else if (emailHeader) {
    req.userEmail = emailHeader;
    req.user = { email: emailHeader };
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};
