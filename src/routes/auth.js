// Auth routes for Batloung Farm Distribution System
import bcrypt from 'bcrypt';
import express from 'express';
import { query, queryOne, transaction } from '../database/connection.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await queryOne(
      'SELECT id, email, password_hash, full_name, role, vendor_id, is_active FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        vendorId: user.vendor_id
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register (admin only)
router.post('/register', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can create users' });
  }

  const { email, password, fullName, role, vendorId } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ error: 'Email, password, full name, and role are required' });
  }

  if (!['ADMIN', 'VENDOR'].includes(role)) {
    return res.status(400).json({ error: 'Role must be ADMIN or VENDOR' });
  }

  try {
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (role === 'VENDOR' && vendorId) {
      const vendor = await queryOne('SELECT id FROM vendors WHERE id = $1', [vendorId]);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role, vendor_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [email, passwordHash, fullName, role, vendorId || null]
    );

    const newUser = await queryOne(
      'SELECT id, email, full_name, role, vendor_id FROM users WHERE id = $1',
      [result.rows[0].id]
    );

    res.status(201).json({ user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.full_name,
      role: req.user.role,
      vendorId: req.user.vendor_id
    }
  });
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    const user = await queryOne('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const users = await query(
      'SELECT id, email, full_name, role, vendor_id, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Toggle user active status (admin only)
router.put('/users/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { isActive } = req.body;

  if (id == req.user.id) {
    return res.status(400).json({ error: 'Cannot deactivate your own account' });
  }

  try {
    await query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, id]);
    res.json({ message: 'User status updated' });
  } catch (err) {
    console.error('Update user status error:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

export default router;