/**
 * Consolidated Usage API Routes
 * Handles: /api/usage?action=check|increment|history
 */

import db from './db.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION';
const FREE_TIER_LIMIT = 3;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication for all usage endpoints
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      requiresAuth: true,
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);

    // Verify token is still valid in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenResult = await db.tokens.verify(tokenHash);

    if (!tokenResult.success || !tokenResult.valid) {
      return res.status(401).json({
        success: false,
        error: 'Token is invalid or has been revoked',
        requiresAuth: true,
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      requiresAuth: true,
    });
  }

  const userId = decoded.userId;
  const { action } = req.query;

  try {
    switch (action) {
      case 'check':
        return await handleCheck(req, res, userId);
      case 'increment':
        return await handleIncrement(req, res, userId);
      case 'history':
        return await handleHistory(req, res, userId);
      default:
        return res.status(400).json({ success: false, error: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error('Usage API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Check usage handler
async function handleCheck(req, res, userId) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check if user has active subscription (premium users have unlimited usage)
  const subscriptionResult = await db.subscriptions.hasActiveSubscription(userId);
  const isPremium = subscriptionResult.success && subscriptionResult.hasSubscription;

  if (isPremium) {
    return res.status(200).json({
      success: true,
      isPremium: true,
      unlimited: true,
      used: 0,
      remaining: Infinity,
      limit: Infinity,
      message: 'Premium user - unlimited access',
    });
  }

  // Get usage count for free user
  const usageResult = await db.usage.getCount(userId);

  if (!usageResult.success) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get usage information',
    });
  }

  const used = usageResult.count;
  const remaining = Math.max(0, FREE_TIER_LIMIT - used);
  const domains = usageResult.domains || [];

  return res.status(200).json({
    success: true,
    isPremium: false,
    used,
    remaining,
    limit: FREE_TIER_LIMIT,
    domains,
    message:
      remaining > 0
        ? `${remaining} summary credits remaining`
        : 'Free tier limit reached. Upgrade to Premium for unlimited access.',
  });
}

// Increment usage handler
async function handleIncrement(req, res, userId) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { domain, url } = req.body;

  if (!domain) {
    return res.status(400).json({
      success: false,
      error: 'Domain is required',
    });
  }

  // Check if user has active subscription
  const subscriptionResult = await db.subscriptions.hasActiveSubscription(userId);
  const isPremium = subscriptionResult.success && subscriptionResult.hasSubscription;

  if (isPremium) {
    return res.status(200).json({
      success: true,
      isPremium: true,
      message: 'Premium user - usage not tracked',
    });
  }

  // Check if domain already used
  const hasDomainResult = await db.usage.hasDomain({ userId, domain });

  if (hasDomainResult.success && hasDomainResult.exists) {
    return res.status(200).json({
      success: true,
      alreadyUsed: true,
      message: 'Domain already used - no additional usage counted',
    });
  }

  // Log usage
  const logResult = await db.usage.log({ userId, domain, url });

  if (!logResult.success) {
    return res.status(500).json({
      success: false,
      error: 'Failed to log usage',
    });
  }

  // Get updated usage count
  const usageResult = await db.usage.getCount(userId);
  const used = usageResult.success ? usageResult.count : 0;
  const remaining = Math.max(0, FREE_TIER_LIMIT - used);

  return res.status(200).json({
    success: true,
    used,
    remaining,
    limit: FREE_TIER_LIMIT,
    message: remaining > 0 ? `${remaining} summaries remaining` : 'Free tier limit reached',
  });
}

// Get history handler
async function handleHistory(req, res, userId) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const historyResult = await db.usage.getHistory(userId);

  if (!historyResult.success) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get usage history',
    });
  }

  return res.status(200).json({
    success: true,
    history: historyResult.history || [],
    count: historyResult.count || 0,
  });
}
