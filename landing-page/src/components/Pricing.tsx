'use client';
import Button from '@/components/ui/button';
import { fadeInUp, staggerContainer, staggerItem, viewportOnce } from '@/lib/animations';
import { motion } from 'framer-motion';

const Pricing = () => {
  const features = [
    'Unlimited summaries',
    '5 summary formats',
    'Persistent local storage',
    'Privacy-first design',
    'No data collection',
    'Regular updates',
  ];

  const faqs = [
    {
      question: 'Why choose Kuiqlee?',
      answer:
        'We believe AI summarization should be accessible to everyone. Get premium AI quality with an affordable monthly subscription.',
    },
    {
      question: 'Is my data secure?',
      answer:
        "Absolutely. Kuiqlee doesn't collect or store any of your data. All processing happens locally and securely.",
    },
    {
      question: 'How many summaries can I create?',
      answer:
        'Unlimited! With your subscription, you can create as many summaries as you want with no restrictions.',
    },
  ];

  return (
    <section id='pricing' className='py-12 sm:py-16 lg:py-24 bg-background'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          {...fadeInUp}
          whileInView='animate'
          viewport={viewportOnce}
          className='text-center mb-12 sm:mb-16 lg:mb-20'
        >
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900'>
            Simple, <span className='text-orange-500'>Monthly Pricing</span>
          </h2>
          <p className='text-base sm:text-lg lg:text-xl max-w-3xl mx-auto text-gray-900 px-4'>
            Get unlimited AI-powered summaries with a simple monthly subscription.
          </p>
        </motion.div>

        <motion.div
          {...fadeInUp}
          whileInView='animate'
          viewport={viewportOnce}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='max-w-lg mx-auto mb-12 sm:mb-16 lg:mb-20 mt-6 sm:mt-8'
        >
          <div className='bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden relative'>
            <div className='p-6 sm:p-8 lg:p-10 text-center'>
              <div className='mb-6 sm:mb-8'>
                <div className='text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-2 text-gray-900'>
                  $4.99
                </div>
                <div className='text-lg sm:text-xl font-medium text-gray-900'>Per Month</div>
                <div className='text-xs sm:text-sm mt-2 text-gray-900'>
                  Cancel anytime • No hidden fees
                </div>
              </div>

              <motion.div
                className='space-y-3 sm:space-y-4 mb-6 sm:mb-8'
                variants={staggerContainer}
                whileInView='animate'
                viewport={viewportOnce}
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    variants={staggerItem}
                    className='flex items-center justify-center space-x-2 sm:space-x-3'
                  >
                    <div className='w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center bg-orange-500 flex-shrink-0'>
                      <span className='text-white text-xs'>✓</span>
                    </div>
                    <span className='font-medium text-sm sm:text-base text-gray-900'>
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              <Button
                variant='primary'
                size='lg'
                className='w-full mb-3 sm:mb-4 text-sm sm:text-base'
              >
                Add to Chrome - Free
              </Button>

              <p className='text-xs sm:text-sm font-medium text-gray-900'>Secure payment</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          {...fadeInUp}
          whileInView='animate'
          viewport={viewportOnce}
          className='rounded-xl sm:rounded-2xl'
        >
          <div>
            <div className='text-center mb-10 sm:mb-12 lg:mb-16'>
              <h3 className='text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-900'>
                Frequently Asked <span className='text-orange-500'>Questions</span>
              </h3>
              <p className='text-base sm:text-lg text-gray-700 max-w-2xl mx-auto px-4'>
                Everything you need to know about Kuiqlee
              </p>
            </div>

            <motion.div
              className='grid md:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto'
              variants={staggerContainer}
              whileInView='animate'
              viewport={viewportOnce}
            >
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  className='bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 transition-all duration-300 border border-gray-200 hover:shadow-lg hover:shadow-orange-100/50 hover:border-orange-200'
                >
                  <div className='flex items-start space-x-3 sm:space-x-4'>
                    <div className='flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center'>
                      <span className='text-white text-xs sm:text-sm font-bold'>?</span>
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-bold mb-2 sm:mb-3 text-base sm:text-lg text-gray-900 transition-colors'>
                        {faq.question}
                      </h4>
                      <p className='leading-relaxed text-gray-700 text-sm sm:text-base'>
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              {...fadeInUp}
              whileInView='animate'
              viewport={viewportOnce}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='text-center mt-8 sm:mt-10 lg:mt-12'
            >
              <div className='bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-white/50 max-w-md mx-auto'>
                <h4 className='font-bold text-gray-900 mb-2 text-base sm:text-lg'>
                  Still have questions?
                </h4>
                <p className='text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4'>
                  We're here to help you get the most out of Kuiqlee
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-orange-600 border-orange-300 hover:bg-background text-xs sm:text-sm'
                >
                  Contact Support
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
