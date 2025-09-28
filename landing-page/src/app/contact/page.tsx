import PageLayout from '@/components/PageLayout';
import Button from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - Kuiqlee',
  description:
    'Get in touch with the Kuiqlee team for support, feedback, or partnership inquiries.',
};

const ContactPage = () => {
  return (
    <PageLayout
      title='Contact Us'
      description="We'd love to hear from you. Get in touch with our team."
      className='px-24'
    >
      <div className='space-y-8'>
        <div className='bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-8'>
          <h3 className='text-2xl font-semibold text-gray-900 mb-6'>Send us a message</h3>
          <form className='space-y-6'>
            <div>
              <label htmlFor='name' className='block text-sm font-semibold text-gray-800 mb-2'>
                Name
              </label>
              <input
                type='text'
                id='name'
                name='name'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all'
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
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all'
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
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all'
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
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all resize-none'
                placeholder='Tell us how we can help you...'
              ></textarea>
            </div>
            <Button
              type='submit'
              variant='primary'
              size='lg'
              className='w-full bg-orange-600 hover:bg-orange-700'
            >
              Send Message
            </Button>
          </form>
        </div>
        <div>
          <div className='bg-white border border-gray-200 rounded-xl p-6'>
            <div className='flex items-start space-x-4'>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                <svg className='w-6 h-6 text-orange-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' />
                </svg>
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
                      href='mailto:hello@kuiqlee.com'
                      className='text-orange-600 hover:text-orange-700'
                    >
                      hello@kuiqlee.com
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

export default ContactPage;
