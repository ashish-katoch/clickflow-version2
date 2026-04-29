const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const auth = require('../middleware/auth');

const router = express.Router();

function userResponse(user) {
  return {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    name: user.name || '',
    role: user.role || 'member',
    avatar_url: user.avatar_url || '',
    created_at: user.created_at || '',
  };
}

function createAccessToken(userId, email) {
  return jwt.sign(
    { sub: userId, email, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function createRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setAuthCookies(res, access, refresh) {
  res.cookie('access_token', access, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000, path: '/' });
  res.cookie('refresh_token', refresh, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 604800000, path: '/' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const emailLower = email.toLowerCase().trim();

    const existing = await User.findOne({ email: emailLower });
    if (existing) return res.status(400).json({ detail: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: emailLower, password_hash, name, role: 'member' });

    const access = createAccessToken(user._id.toString(), emailLower);
    const refresh = createRefreshToken(user._id.toString());
    setAuthCookies(res, access, refresh);
    res.json(userResponse(user));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLower = email.toLowerCase().trim();
    const ip = req.ip || 'unknown';
    const identifier = `${ip}:${emailLower}`;

    // Brute force check
    const attempt = await LoginAttempt.findOne({ identifier });
    if (attempt && attempt.count >= 5) {
      if (attempt.locked_until && new Date().toISOString() < attempt.locked_until) {
        return res.status(429).json({ detail: 'Too many failed attempts. Try again in 15 minutes.' });
      }
      await LoginAttempt.deleteOne({ identifier });
    }

    const user = await User.findOne({ email: emailLower });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      const lockTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await LoginAttempt.findOneAndUpdate(
        { identifier },
        { $inc: { count: 1 }, $set: { locked_until: lockTime } },
        { upsert: true }
      );
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    await LoginAttempt.deleteOne({ identifier });
    const access = createAccessToken(user._id.toString(), emailLower);
    const refresh = createRefreshToken(user._id.toString());
    setAuthCookies(res, access, refresh);
    res.json(userResponse(user));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ detail: 'No refresh token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'refresh') return res.status(401).json({ detail: 'Invalid token type' });

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ detail: 'User not found' });

    const access = createAccessToken(user._id.toString(), user.email);
    res.cookie('access_token', access, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000, path: '/' });
    res.json(userResponse(user));
  } catch {
    res.status(401).json({ detail: 'Invalid refresh token' });
  }
});

module.exports = router;
