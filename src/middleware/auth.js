// Authentication middleware for Batloung Farm Distribution System
import jwt from 'jsonwebtoken';
import { queryOne } from '../database/connection.js';

const JWT_SECRET = process.env.JWT_SECRET || 'batloung-farm-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, vendorId: user.vendor_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await queryOne(
      'SELECT id, email, full_name, role, vendor_id, is_active FROM users WHERE id = $1 AND is_active = TRUE',
      [decoded.id]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch (err) {
    // Token invalid, continue without user
  }
  next();
}