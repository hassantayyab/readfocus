'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaymentCanceledPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 md:p-12 text-center">
        {/* Canceled Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100">
          <svg
            className="w-12 h-12 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Canceled Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Payment Canceled
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Your payment was canceled. No charges were made to your account.
        </p>

        {/* What's Next Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 text-left">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
              i
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What can you do now?</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Continue using Kuiqlee with the free tier (3 summaries)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Try upgrading again when you&apos;re ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Contact support if you need help</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Auto-close notice */}
        <p className="text-sm text-gray-500 mb-6">
          This tab will close automatically in <span className="font-semibold text-gray-700">{countdown}</span> seconds
        </p>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Close This Tab
          </button>

          <Link
            href="/"
            className="block w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-lg border-2 border-gray-300 transition-all duration-200"
          >
            Learn More About Kuiqlee
          </Link>
        </div>

        {/* Support link */}
        <p className="text-xs text-gray-500 mt-6">
          Questions?{' '}
          <a
            href="mailto:support@kuiqlee.com"
            className="text-sky-600 hover:text-sky-700 underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
