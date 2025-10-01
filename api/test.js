/**
 * Simple test endpoint to check environment
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  return res.status(200).json({
    success: true,
    message: 'API is working',
    env: {
      supabaseUrl: !!process.env.SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
      jwtSecret: !!process.env.JWT_SECRET,
      claudeApiKey: !!process.env.CLAUDE_API_KEY,
      stripeKey: !!process.env.STRIPE_SECRET_KEY,
    },
    nodeVersion: process.version
  });
}
