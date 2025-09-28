import PageLayout from '@/components/PageLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Kuiqlee',
  description: 'Privacy policy and data protection information for Kuiqlee users.',
};

const PrivacyPage = () => {
  return (
    <PageLayout
      title='Privacy Policy'
      description='How we collect, use, and protect your information'
    >
      <div className='space-y-8'>
        <div className='bg-blue-50 border-l-4 border-blue-400 p-4 mb-6'>
          <p className='text-blue-800'>
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>
        </div>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Introduction</h2>
          <p className='text-gray-700 mb-4'>
            At Kuiqlee, we take your privacy seriously. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our Chrome extension and
            related services.
          </p>
          <p className='text-gray-700'>
            By using Kuiqlee, you agree to the collection and use of information in accordance with
            this policy.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Information We Collect</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Content Data</h3>
              <p className='text-gray-700'>
                We temporarily process the text content from web pages you choose to summarize. This
                content is processed by our AI systems to generate summaries and is not permanently
                stored.
              </p>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Usage Information</h3>
              <p className='text-gray-700'>
                We collect anonymous usage statistics such as the number of summaries generated,
                feature usage, and general performance metrics to improve our service.
              </p>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Technical Information</h3>
              <p className='text-gray-700'>
                We may collect technical information such as browser type, extension version, and
                error logs to ensure proper functionality and troubleshoot issues.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>How We Use Your Information</h2>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>To provide AI-powered content summarization services</li>
            <li>To improve the accuracy and performance of our algorithms</li>
            <li>To troubleshoot technical issues and provide customer support</li>
            <li>To analyze usage patterns and develop new features</li>
            <li>To ensure the security and integrity of our services</li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Data Security</h2>
          <p className='text-gray-700 mb-4'>
            We implement appropriate technical and organizational security measures to protect your
            information:
          </p>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>All data transmission is encrypted using industry-standard protocols</li>
            <li>We use secure servers and regularly update our security measures</li>
            <li>Access to user data is strictly limited to authorized personnel</li>
            <li>We regularly audit our security practices and systems</li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Data Retention</h2>
          <p className='text-gray-700'>
            Content you submit for summarization is processed in real-time and is not permanently
            stored on our servers. Anonymous usage statistics may be retained to help us improve our
            services, but this data cannot be linked back to individual users.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Third-Party Services</h2>
          <p className='text-gray-700 mb-4'>
            Kuiqlee may integrate with third-party services for functionality such as:
          </p>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>AI processing services for content summarization</li>
            <li>Analytics services for usage tracking (anonymized)</li>
            <li>Error reporting and performance monitoring</li>
          </ul>
          <p className='text-gray-700 mt-4'>
            These services are bound by their own privacy policies and our data processing
            agreements.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Your Rights</h2>
          <p className='text-gray-700 mb-4'>You have the right to:</p>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>Know what personal information we collect and how it's used</li>
            <li>Request deletion of any personal information we may have</li>
            <li>Opt out of data collection by uninstalling the extension</li>
            <li>Contact us with privacy-related questions or concerns</li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Children's Privacy</h2>
          <p className='text-gray-700'>
            Kuiqlee is not intended for use by children under the age of 13. We do not knowingly
            collect personal information from children under 13. If we become aware that a child
            under 13 has provided us with personal information, we will take steps to delete such
            information.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Changes to This Policy</h2>
          <p className='text-gray-700'>
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the "Last updated" date. You
            are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Contact Us</h2>
          <p className='text-gray-700 mb-4'>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <div className='bg-white p-4 rounded-lg border border-gray-200'>
            <p className='text-gray-700'>
              <strong>Email:</strong> privacy@kuiqlee.com
              <br />
              <strong>Support:</strong>{' '}
              <a href='/contact' className='text-orange-600 hover:text-orange-700'>
                Contact Page
              </a>
            </p>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default PrivacyPage;
