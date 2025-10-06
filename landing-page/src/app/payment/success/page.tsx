'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentSuccessContent() {
  const [countdown, setCountdown] = useState(5);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Send message to extension to refresh premium status
    // @ts-expect-error - Chrome extension API
    if (typeof chrome !== 'undefined' && chrome?.runtime?.id) {
      // @ts-expect-error - Chrome extension API
      chrome.runtime.sendMessage(
        { type: 'PREMIUM_STATUS_UPDATED' },
        () => {
          // Ignore errors if extension is not available
          // @ts-expect-error - Chrome extension API
          if (chrome.runtime.lastError) {
            console.log('Extension not available, skip notification');
          }
        }
      );
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-close tab after countdown
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 via-blue-600 to-purple-700 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 md:p-12 text-center">
        {/* Success Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 animate-bounce">
          <svg
            className="w-12 h-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Payment Successful! 🎉
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Welcome to <span className="font-semibold text-sky-600">Kuiqlee Premium</span>!
          You now have unlimited AI-powered summaries.
        </p>

        {/* Session Info (for debugging) */}
        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-gray-500 font-mono break-all">
              Session: {sessionId.substring(0, 20)}...
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 text-left">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
              i
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Your subscription is now active</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>The extension will automatically refresh</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>You can close this tab and start using Kuiqlee</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Auto-close notice */}
        <p className="text-sm text-gray-500 mb-6">
          This tab will close automatically in <span className="font-semibold text-gray-700">{countdown}</span> seconds
        </p>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Close This Tab
        </button>

        {/* Support link */}
        <p className="text-xs text-gray-500 mt-6">
          Need help? Contact us at{' '}
          <a
            href="mailto:support@kuiqlee.com"
            className="text-sky-600 hover:text-sky-700 underline"
          >
            support@kuiqlee.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-sky-500 via-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
