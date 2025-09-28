import PageLayout from '@/components/PageLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Kuiqlee',
  description: 'Terms of service and usage agreement for Kuiqlee AI-powered content summarization.',
};

const TermsPage = () => {
  return (
    <PageLayout
      title='Terms of Service'
      description='Terms and conditions for using Kuiqlee services'
    >
      <div className='space-y-8'>
        <div className='bg-blue-50 border-l-4 border-blue-400 p-4 mb-6'>
          <p className='text-blue-800'>
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>
        </div>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Acceptance of Terms</h2>
          <p className='text-gray-700 mb-4'>
            By installing, accessing, or using the Kuiqlee Chrome extension ("Service"), you agree
            to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do
            not use our Service.
          </p>
          <p className='text-gray-700'>
            These Terms apply to all users of the Service, including individuals and organizations.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Description of Service</h2>
          <p className='text-gray-700 mb-4'>
            Kuiqlee is an AI-powered content summarization tool that helps users quickly understand
            and digest web content. The Service uses artificial intelligence to analyze and
            summarize text content from web pages.
          </p>
          <p className='text-gray-700'>
            We reserve the right to modify, suspend, or discontinue the Service at any time with or
            without notice.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>User Responsibilities</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Acceptable Use</h3>
              <p className='text-gray-700 mb-2'>
                You agree to use the Service only for lawful purposes and in accordance with these
                Terms. You must not:
              </p>
              <ul className='list-disc list-inside space-y-1 text-gray-700 ml-4'>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to reverse engineer, decompile, or disassemble the Service</li>
                <li>Use the Service to process copyrighted content without proper authorization</li>
                <li>Interfere with or disrupt the Service or its servers</li>
                <li>Attempt to gain unauthorized access to our systems</li>
              </ul>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Content Responsibility</h3>
              <p className='text-gray-700'>
                You are solely responsible for the content you choose to summarize using our
                Service. Ensure you have the right to process any content you submit to Kuiqlee.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Intellectual Property</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Our Rights</h3>
              <p className='text-gray-700'>
                The Kuiqlee Service, including its software, algorithms, design, and documentation,
                is owned by us and is protected by intellectual property laws. You are granted a
                limited, non-exclusive, non-transferable license to use the Service.
              </p>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Your Content</h3>
              <p className='text-gray-700'>
                You retain ownership of any content you submit to the Service. By using the Service,
                you grant us a temporary license to process your content solely for the purpose of
                providing summarization services.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Subscription and Payments</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Free and Premium Plans</h3>
              <p className='text-gray-700'>
                Kuiqlee offers both free and premium subscription plans. Premium features require a
                paid subscription. Subscription fees are billed in advance and are non-refundable
                except as required by law.
              </p>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Billing</h3>
              <p className='text-gray-700'>
                Premium subscriptions automatically renew unless cancelled. You may cancel your
                subscription at any time through your account settings or by contacting us.
                Cancellation takes effect at the end of your current billing period.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Privacy</h2>
          <p className='text-gray-700'>
            Your privacy is important to us. Our collection and use of personal information is
            governed by our
            <a href='/privacy' className='text-orange-600 hover:text-orange-700'>
              {' '}
              Privacy Policy
            </a>
            , which is incorporated into these Terms by reference.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Disclaimers</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Service Availability</h3>
              <p className='text-gray-700'>
                The Service is provided "as is" and "as available." We do not guarantee that the
                Service will be uninterrupted, secure, or error-free.
              </p>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>AI Accuracy</h3>
              <p className='text-gray-700'>
                While we strive for accuracy, AI-generated summaries may not always be perfect or
                complete. Users should verify important information from original sources.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Limitation of Liability</h2>
          <p className='text-gray-700'>
            To the maximum extent permitted by law, Kuiqlee and its affiliates shall not be liable
            for any indirect, incidental, special, or consequential damages arising from your use of
            the Service. Our total liability shall not exceed the amount paid by you for the Service
            in the twelve months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Termination</h2>
          <p className='text-gray-700'>
            We may terminate or suspend your access to the Service at any time, with or without
            cause or notice. You may terminate your use of the Service at any time by uninstalling
            the extension and cancelling any active subscriptions.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Governing Law</h2>
          <p className='text-gray-700'>
            These Terms are governed by and construed in accordance with the laws of [Your
            Jurisdiction], without regard to its conflict of law provisions. Any legal action or
            proceeding shall be brought exclusively in the courts of [Your Jurisdiction].
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Changes to Terms</h2>
          <p className='text-gray-700'>
            We reserve the right to modify these Terms at any time. We will notify users of material
            changes through the Service or by email. Your continued use of the Service after changes
            become effective constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Contact Information</h2>
          <p className='text-gray-700 mb-4'>
            If you have questions about these Terms of Service, please contact us:
          </p>
          <div className='bg-white p-4 rounded-lg border border-gray-200'>
            <p className='text-gray-700'>
              <strong>Email:</strong> legal@kuiqlee.com
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

export default TermsPage;
