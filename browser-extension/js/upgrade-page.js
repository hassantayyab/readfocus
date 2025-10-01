/**
 * Upgrade Page Controller
 * Handles pricing display and checkout flow
 */

// Initialize managers
async function init() {
  await authManager.initialize();
  await usageTracker.initialize();

  // Check if user is authenticated
  if (!authManager.isAuthenticated()) {
    // Redirect to auth page
    window.location.href = 'auth.html';
    return;
  }

  // Load pricing from config
  loadPricingFromConfig();

  // Update status card with usage info
  updateStatusCard();

  // Check if already premium
  if (authManager.isPremium()) {
    showAlreadyPremium();
  }
}

// Load pricing from config.js
function loadPricingFromConfig() {
  const monthlyPlan = CONFIG.PLANS.MONTHLY;
  const annualPlan = CONFIG.PLANS.ANNUAL;

  // Update Monthly Plan
  document.getElementById('monthly-price').textContent = `$${monthlyPlan.priceValue}`;
  document.getElementById('monthly-period').textContent = `/${monthlyPlan.interval}`;

  // Update Annual Plan
  document.getElementById('annual-price').textContent = `$${annualPlan.priceValue}`;
  document.getElementById('annual-period').textContent = `/${annualPlan.interval}`;

  // Calculate and update savings
  if (annualPlan.savings) {
    document.getElementById('annual-savings').textContent = annualPlan.savings;
  }

  // Calculate savings percentage
  const monthlyYearlyCost = monthlyPlan.priceValue * 12;
  const savingsPercent = Math.round(
    ((monthlyYearlyCost - annualPlan.priceValue) / monthlyYearlyCost) * 100,
  );
  document.getElementById('annual-savings-percent').textContent = `${savingsPercent}% savings`;
}

function updateStatusCard() {
  const stats = usageTracker.getUsageStats();
  const statusCard = document.getElementById('status-card');
  const statusText = statusCard.querySelector('.status-text');

  if (stats.used >= 3) {
    statusText.innerHTML = `
      <strong>Free Tier Limit Reached</strong>
      <p>You've used all 3 free summaries. Upgrade for unlimited access!</p>
    `;
  } else {
    statusText.innerHTML = `
      <strong>${stats.remaining} Free Summaries Remaining</strong>
      <p>Upgrade now to unlock unlimited AI-powered summaries!</p>
    `;
  }
}

function showAlreadyPremium() {
  document.querySelector('.upgrade-header h1').textContent = 'Already Premium!';
  document.querySelector('.upgrade-header .tagline').textContent = 'You have unlimited access';

  const statusCard = document.getElementById('status-card');
  statusCard.querySelector('.status-icon').textContent = '✨';
  statusCard.querySelector('.status-text').innerHTML = `
    <strong>You're a Premium Member</strong>
    <p>Enjoy unlimited AI summaries and all premium features!</p>
  `;

  document.querySelector('.pricing-container').style.display = 'none';
  document.getElementById('btn-maybe-later').textContent = 'Close';
}

// Plan selection
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn-plan').forEach((button) => {
    button.addEventListener('click', async (e) => {
      const planId = e.target.dataset.planId;
      await startCheckout(planId);
    });
  });

  // Maybe later button
  document.getElementById('btn-maybe-later').addEventListener('click', () => {
    window.close();
  });

  // Initialize on load
  init();
});

async function startCheckout(planId) {
  const loadingOverlay = document.getElementById('loading-overlay');
  loadingOverlay.style.display = 'flex';

  try {
    // Start Stripe checkout
    const result = await stripeManager.startCheckout(planId);

    if (result.success) {
      // Checkout opened in new tab, show message
      setTimeout(() => {
        loadingOverlay.querySelector('p').textContent =
          'Checkout opened in new tab. Complete payment to activate Premium.';
      }, 2000);

      // Hide overlay after 3 seconds
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 5000);
    }
  } catch (error) {
    console.error('Checkout error:', error);
    loadingOverlay.style.display = 'none';
    alert(error.message || 'Failed to start checkout. Please try again or contact support.');
  }
}
