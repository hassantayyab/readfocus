/**
 * Consolidated Auth API Routes
 * Handles: /api/auth?action=register|login|logout|verify
 */

import db from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION';
const JWT_EXPIRY = '30d';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'register':
        return await handleRegister(req, res);
      case 'login':
        return await handleLogin(req, res);
      case 'logout':
        return await handleLogout(req, res);
      case 'verify':
        return await handleVerifyToken(req, res);
      default:
        return res.status(400).json({ success: false, error: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Register handler
async function handleRegister(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email format' });
  }

  // Validate password strength
  if (password.length < 8) {
    return res
      .status(400)
      .json({ success: false, error: 'Password must be at least 8 characters long' });
  }

  // Check if user already exists
  const existingUserResult = await db.users.findByEmail(email.toLowerCase());

  if (existingUserResult.success && existingUserResult.user) {
    return res.status(400).json({ success: false, error: 'Email already registered' });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const createResult = await db.users.create({
    email: email.toLowerCase(),
    passwordHash,
  });

  if (!createResult.success) {
    return res.status(500).json({ success: false, error: 'Failed to create user' });
  }

  const user = createResult.user;

  // Generate JWT token
  const token = jwt.sign({ userId: user.id, email: user.email, isPremium: false }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });

  // Store token hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.tokens.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      email: user.email,
      isPremium: false,
    },
  });
}

// Login handler
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  // Find user
  const userResult = await db.users.findByEmail(email.toLowerCase());

  if (!userResult.success || !userResult.user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const user = userResult.user;

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  // Check subscription status
  const subscriptionResult = await db.subscriptions.hasActiveSubscription(user.id);
  const isPremium = subscriptionResult.success && subscriptionResult.hasSubscription;

  // Generate JWT token
  const token = jwt.sign({ userId: user.id, email: user.email, isPremium }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });

  // Store token hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.tokens.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      isPremium,
    },
  });
}

// Logout handler
async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  // Hash the token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Revoke the token
  await db.tokens.revoke(tokenHash);

  return res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
}

// Verify token handler
async function handleVerifyToken(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      requiresAuth: true,
    });
  }

  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET);

    // Hash the token for lookup
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token is still valid in database
    const tokenResult = await db.tokens.verify(tokenHash);

    if (!tokenResult.success || !tokenResult.valid) {
      return res.status(401).json({
        success: false,
        error: 'Token is invalid or has been revoked',
        requiresAuth: true,
      });
    }

    // Get updated subscription status
    const subscriptionResult = await db.subscriptions.hasActiveSubscription(decoded.userId);
    const isPremium = subscriptionResult.success && subscriptionResult.hasSubscription;

    return res.status(200).json({
      success: true,
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        isPremium,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
        requiresAuth: true,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        requiresAuth: true,
      });
    }

    throw error;
  }
}
