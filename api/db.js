/**
 * Database Helper Module
 * Provides connection and query functions for Supabase PostgreSQL
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Database helper functions
 */
const db = {
  /**
   * User operations
   */
  users: {
    /**
     * Create a new user
     */
    async create({ email, passwordHash }) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([{ email, password_hash: passwordHash }])
          .select()
          .single();

        if (error) throw error;
        return { success: true, user: data };
      } catch (error) {
        console.error('❌ Error creating user:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Find user by email
     */
    async findByEmail(email) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            return { success: true, user: null };
          }
          throw error;
        }

        return { success: true, user: data };
      } catch (error) {
        console.error('❌ Error finding user by email:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Find user by ID
     */
    async findById(userId) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return { success: true, user: null };
          }
          throw error;
        }

        return { success: true, user: data };
      } catch (error) {
        console.error('❌ Error finding user by ID:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Delete user by ID
     */
    async delete(userId) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('❌ Error deleting user:', error);
        return { success: false, error: error.message };
      }
    },
  },

  /**
   * Subscription operations
   */
  subscriptions: {
    /**
     * Create or update subscription
     */
    async upsert({ userId, stripeCustomerId, stripeSubscriptionId, status, planId, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd = false }) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .upsert([{
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            status,
            plan_id: planId,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: cancelAtPeriodEnd,
          }], { onConflict: 'user_id' })
          .select()
          .single();

        if (error) throw error;
        return { success: true, subscription: data };
      } catch (error) {
        console.error('❌ Error upserting subscription:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get subscription by user ID
     */
    async getByUserId(userId) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return { success: true, subscription: null };
          }
          throw error;
        }

        return { success: true, subscription: data };
      } catch (error) {
        console.error('❌ Error getting subscription by user ID:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get subscription by Stripe subscription ID
     */
    async getByStripeSubscriptionId(stripeSubscriptionId) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', stripeSubscriptionId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return { success: true, subscription: null };
          }
          throw error;
        }

        return { success: true, subscription: data };
      } catch (error) {
        console.error('❌ Error getting subscription by Stripe ID:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Check if user has active subscription
     */
    async hasActiveSubscription(userId) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return { success: true, isActive: false };
          }
          throw error;
        }

        return { success: true, isActive: !!data };
      } catch (error) {
        console.error('❌ Error checking active subscription:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Cancel subscription
     */
    async cancel(userId) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled', cancel_at_period_end: true })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return { success: true, subscription: data };
      } catch (error) {
        console.error('❌ Error canceling subscription:', error);
        return { success: false, error: error.message };
      }
    },
  },

  /**
   * Usage tracking operations
   */
  usage: {
    /**
     * Log usage for a domain
     */
    async log({ userId, domain, url }) {
      try {
        const { data, error } = await supabase
          .from('usage_logs')
          .upsert([{ user_id: userId, domain, url }], { onConflict: 'user_id,domain' })
          .select()
          .single();

        if (error) throw error;
        return { success: true, log: data };
      } catch (error) {
        console.error('❌ Error logging usage:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get usage count (unique domains) for user
     */
    async getCount(userId) {
      try {
        const { data, error, count } = await supabase
          .from('usage_logs')
          .select('domain', { count: 'exact' })
          .eq('user_id', userId);

        if (error) throw error;
        return { success: true, count: count || 0, domains: data.map(d => d.domain) };
      } catch (error) {
        console.error('❌ Error getting usage count:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Check if domain is already used by user
     */
    async hasDomain({ userId, domain }) {
      try {
        const { data, error } = await supabase
          .from('usage_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('domain', domain)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return { success: true, exists: false };
          }
          throw error;
        }

        return { success: true, exists: !!data };
      } catch (error) {
        console.error('❌ Error checking domain usage:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get usage history for user
     */
    async getHistory(userId, limit = 50) {
      try {
        const { data, error } = await supabase
          .from('usage_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return { success: true, history: data };
      } catch (error) {
        console.error('❌ Error getting usage history:', error);
        return { success: false, error: error.message };
      }
    },
  },

  /**
   * Auth token operations
   */
  tokens: {
    /**
     * Store token hash
     */
    async create({ userId, tokenHash, expiresAt }) {
      try {
        const { data, error } = await supabase
          .from('auth_tokens')
          .insert([{ user_id: userId, token_hash: tokenHash, expires_at: expiresAt }])
          .select()
          .single();

        if (error) throw error;
        return { success: true, token: data };
      } catch (error) {
        console.error('❌ Error creating token:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Verify token exists and is valid
     */
    async verify(tokenHash) {
      try {
        const { data, error } = await supabase
          .from('auth_tokens')
          .select('*')
          .eq('token_hash', tokenHash)
          .eq('revoked', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return { success: true, valid: false, token: null };
          }
          throw error;
        }

        return { success: true, valid: !!data, token: data };
      } catch (error) {
        console.error('❌ Error verifying token:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Revoke token
     */
    async revoke(tokenHash) {
      try {
        const { error } = await supabase
          .from('auth_tokens')
          .update({ revoked: true })
          .eq('token_hash', tokenHash);

        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('❌ Error revoking token:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Revoke all tokens for user
     */
    async revokeAllForUser(userId) {
      try {
        const { error } = await supabase
          .from('auth_tokens')
          .update({ revoked: true })
          .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('❌ Error revoking all tokens for user:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Clean up expired tokens
     */
    async cleanup() {
      try {
        const { error } = await supabase
          .from('auth_tokens')
          .delete()
          .lt('expires_at', new Date().toISOString());

        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('❌ Error cleaning up tokens:', error);
        return { success: false, error: error.message };
      }
    },
  },
};

export default db;
