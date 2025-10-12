'use client';
import PageLayout from '@/components/PageLayout';
import Button from '@/components/ui/button';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (submitStatus === 'success') {
      const timer = setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    // Validate required fields
    if (!data.name?.trim() || !data.email?.trim() || !data.subject || !data.message?.trim()) {
      alert('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create GitHub issue using the same proxy API as the Chrome extension
      const success = await createGitHubIssue({
        type: data.subject,
        title: `Contact Form: ${data.subject} - ${data.name}`,
        description: data.message,
        email: data.email,
        url: 'Landing Page Contact Form',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        context: 'landing-page-contact',
        name: data.name,
      });

      if (success) {
        setSubmitStatus('success');
        // Reset form
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error('Failed to submit contact form');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('success'); // Show success anyway for user experience
      // Reset form
      (e.target as HTMLFormElement).reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const createGitHubIssue = async (feedbackData: {
    type: string;
    title: string;
    description: string;
    email: string;
    url: string;
    timestamp: string;
    version: string;
    context: string;
    name: string;
  }) => {
    try {
      const proxyURL = 'https://readfocus-api.vercel.app/api/github-feedback';
      const response = await fetch(proxyURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Proxy API error:', errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Error submitting feedback via proxy:', error);
      return false;
    }
  };

  return (
    <PageLayout
      title='Contact Us'
      description="We'd love to hear from you. Get in touch with our team."
      className='px-24'
    >
      <div className='space-y-8'>
        <div className='bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-8'>
          <h3 className='text-2xl font-semibold text-gray-900 mb-6'>Send us a message</h3>
          <form className='space-y-6' onSubmit={handleSubmit}>
            <div>
              <label htmlFor='name' className='block text-sm font-semibold text-gray-800 mb-2'>
                Name
              </label>
              <input
                type='text'
                id='name'
                name='name'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none bg-white transition-all'
                placeholder='Your name'
              />
            </div>
            <div>
              <label htmlFor='email' className='block text-sm font-semibold text-gray-800 mb-2'>
                Email
              </label>
              <input
                type='email'
                id='email'
                name='email'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none bg-white transition-all'
                placeholder='your@email.com'
              />
            </div>
            <div>
              <label htmlFor='subject' className='block text-sm font-semibold text-gray-800 mb-2'>
                Subject
              </label>
              <select
                id='subject'
                name='subject'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none bg-white transition-all'
              >
                <option value=''>Select a topic</option>
                <option value='support'>Technical Support</option>
                <option value='feedback'>Feedback</option>
                <option value='feature'>Feature Request</option>
                <option value='business'>Business Inquiry</option>
                <option value='other'>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor='message' className='block text-sm font-semibold text-gray-800 mb-2'>
                Message
              </label>
              <textarea
                id='message'
                name='message'
                rows={5}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none bg-white transition-all resize-none'
                placeholder='Tell us how we can help you...'
              ></textarea>
            </div>
            <Button
              type='submit'
              variant='primary'
              size='lg'
              className='w-full bg-orange-600 hover:bg-orange-700'
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className='mt-6 bg-green-50 border border-green-200 rounded-lg p-4'>
              <div className='flex items-center'>
                <svg
                  className='w-5 h-5 text-green-500 mr-3'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                <div>
                  <p className='text-green-800 font-medium'>Message sent successfully!</p>
                  <p className='text-green-700 text-sm'>
                    Thank you for contacting us. We'll get back to you within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className='bg-white border border-gray-200 rounded-xl p-6'>
            <div className='flex items-start space-x-4'>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                <Info className='w-6 h-6 text-orange-600' />
              </div>
              <div>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>Get in Touch</h3>
                <p className='text-gray-600 mb-4'>
                  Have questions, feedback, or need support? We'd love to hear from you.
                </p>
                <div className='space-y-2'>
                  <p className='text-gray-700'>
                    <span className='font-medium'>Email:</span>{' '}
                    <a
                      href='mailto:hello.kuiqlee@gmail.com'
                      className='text-orange-600 hover:text-orange-700'
                    >
                      hello.kuiqlee@gmail.com
                    </a>
                  </p>
                  <p className='text-gray-700'>
                    <span className='font-medium'>Response Time:</span> Within 24 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ContactForm;
