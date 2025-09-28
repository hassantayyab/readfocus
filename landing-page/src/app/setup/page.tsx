import { Metadata } from "next";
import PageLayout from "@/components/PageLayout";

export const metadata: Metadata = {
  title: "Setup Guide - Kuiqlee",
  description: "Complete guide to install, configure, and use Kuiqlee Chrome extension.",
};

const SetupPage = () => {
  return (
    <PageLayout
      title="Setup Guide"
      description="Everything you need to know to get started with Kuiqlee"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Installation</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Step 1: Install from Chrome Web Store</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Open Chrome browser</li>
                <li>Visit the Chrome Web Store</li>
                <li>Search for "Kuiqlee"</li>
                <li>Click "Add to Chrome"</li>
                <li>Confirm installation by clicking "Add extension"</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Step 2: Pin the Extension</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Click the extensions icon (puzzle piece) in Chrome toolbar</li>
                <li>Find Kuiqlee in the list</li>
                <li>Click the pin icon to keep it visible</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Step 3: First Use</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Navigate to any webpage with content</li>
                <li>Click the Kuiqlee icon in your toolbar</li>
                <li>The extension will analyze the page automatically</li>
                <li>View your AI-generated summary</li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Use Kuiqlee</h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              Kuiqlee transforms any webpage into digestible, intelligent summaries using advanced AI technology.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Instant Summaries</h4>
                <p className="text-gray-700">Get key insights from any webpage in seconds with AI-powered analysis.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Smart Analysis</h4>
                <p className="text-gray-700">The AI understands context and extracts the most important information.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Multiple Content Types</h4>
                <p className="text-gray-700">Works with articles, research papers, blogs, and more content types.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Extension Controls</h2>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Summarize</h4>
              <p className="text-gray-700">Generate AI summary of current page</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Adjust Length</h4>
              <p className="text-gray-700">Control summary detail level - from quick overviews to comprehensive analyses</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Save Summary</h4>
              <p className="text-gray-700">Store summaries for later reference</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Export</h4>
              <p className="text-gray-700">Download summaries in various formats</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Auto-Summarize</h4>
              <p className="text-gray-700">Enable automatic summarization when you visit compatible pages.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Keyboard Shortcuts</h4>
              <p className="text-gray-700">Set up custom keyboard shortcuts for quick access to summarization features.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Extension not appearing?</h4>
              <p className="text-gray-700">Make sure you've pinned the extension and that it's enabled in your extensions management page.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">No summary generated?</h4>
              <p className="text-gray-700">Some pages may not have enough content to summarize. Try refreshing the page or checking your internet connection.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Need more help?</h4>
              <p className="text-gray-700">Visit our FAQ page or contact our support team for additional assistance.</p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default SetupPage;