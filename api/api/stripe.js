/**
 * Consolidated Stripe API Routes
 * Handles: /api/stripe?action=checkout|webhook|portal|check
 */

import db from './db.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Stripe from 'stripe';

// Helper to read raw body for webhook verification
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Disable body parsing for webhook endpoint
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Set CORS headers (except for webhook)
  const { action } = req.query;

  if (action !== 'webhook') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }

  try {
    switch (action) {
      case 'checkout':
        return await handleCreateCheckout(req, res);
      case 'webhook':
        return await handleWebhook(req, res);
      case 'portal':
        return await handlePortal(req, res);
      case 'check':
        return await handleCheckSubscription(req, res);
      default:
        return res.status(400).json({ success: false, error: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error('Stripe API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Verify authentication helper
async function verifyAuth(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      requiresAuth: true,
    });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenResult = await db.tokens.verify(tokenHash);

    if (!tokenResult.success || !tokenResult.valid) {
      res.status(401).json({
        success: false,
        error: 'Token is invalid or has been revoked',
        requiresAuth: true,
      });
      return null;
    }

    return decoded.userId;
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      requiresAuth: true,
    });
    return null;
  }
}

// Create checkout session handler
async function handleCreateCheckout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const { planId } = req.body;

  if (!planId || (planId !== 'monthly' && planId !== 'annual')) {
    return res.status(400).json({
      success: false,
      error: 'Valid plan ID is required (monthly or annual)',
    });
  }

  // Get user info
  const userResult = await db.users.findById(userId);
  if (!userResult.success || !userResult.user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  const user = userResult.user;

  // Determine price ID
  const priceId =
    planId === 'monthly'
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_ANNUAL;

  if (!priceId) {
    return res.status(500).json({
      success: false,
      error: 'Stripe price ID not configured',
    });
  }

  // Create checkout session
  // IMPORTANT: Update LANDING_PAGE_URL with your actual landing page URL
  const LANDING_PAGE_URL = process.env.LANDING_PAGE_URL || 'https://YOUR-LANDING-PAGE.vercel.app';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${LANDING_PAGE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${LANDING_PAGE_URL}/payment/canceled`,
    metadata: {
      user_id: userId,
      plan_id: planId,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        plan_id: planId,
      },
    },
  });

  return res.status(200).json({
    success: true,
    sessionId: session.id,
    url: session.url,
  });
}

// Webhook handler
async function handleWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).json({ success: false, error: 'Webhook not configured' });
  }

  // Read raw body as buffer for Stripe webhook verification
  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('Failed to read raw body:', err.message);
    return res.status(400).json({ success: false, error: 'Failed to read request body' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ success: false, error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
}

// Customer portal handler
async function handlePortal(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  // Get user's subscription
  const subscriptionResult = await db.subscriptions.getByUserId(userId);

  if (!subscriptionResult.success || !subscriptionResult.subscription) {
    return res.status(404).json({
      success: false,
      error: 'No active subscription found',
    });
  }

  const subscription = subscriptionResult.subscription;

  if (!subscription.stripe_customer_id) {
    return res.status(400).json({
      success: false,
      error: 'No Stripe customer ID found',
    });
  }

  // Create portal session
  const LANDING_PAGE_URL = process.env.LANDING_PAGE_URL || 'https://YOUR-LANDING-PAGE.vercel.app';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${LANDING_PAGE_URL}`,
  });

  return res.status(200).json({
    success: true,
    url: portalSession.url,
  });
}

// Check subscription handler
async function handleCheckSubscription(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const subscriptionResult = await db.subscriptions.getByUserId(userId);

  if (!subscriptionResult.success || !subscriptionResult.subscription) {
    return res.status(200).json({
      success: true,
      hasSubscription: false,
      isPremium: false,
    });
  }

  const subscription = subscriptionResult.subscription;
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  return res.status(200).json({
    success: true,
    hasSubscription: isActive,
    isPremium: isActive,
    subscription: {
      status: subscription.status,
      planId: subscription.plan_id,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

// Webhook helpers
async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;

  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  // If there's a subscription ID, fetch it and create/update the DB entry
  if (session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      // Create/update subscription in DB
      const result = await db.subscriptions.upsert({
        userId,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        planId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      if (!result.success) {
        console.error('Database upsert failed:', result.error);
      }
    } catch (error) {
      console.error('Error creating subscription from checkout:', error);
    }
  }
}

async function handleSubscriptionUpdate(subscription) {
  const userId = subscription.metadata.user_id;
  const planId = subscription.metadata.plan_id;

  await db.subscriptions.upsert({
    userId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    planId,
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  console.log('Subscription updated:', { userId, planId, status: subscription.status });
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.user_id;

  await db.subscriptions.upsert({
    userId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    status: 'canceled',
    planId: subscription.metadata.plan_id,
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: true,
  });

  console.log('Subscription deleted:', { userId, subscriptionId: subscription.id });
}

async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded:', { invoiceId: invoice.id, amount: invoice.amount_paid });
}

async function handlePaymentFailed(invoice) {
  console.log('Payment failed:', { invoiceId: invoice.id, customerId: invoice.customer });
}
