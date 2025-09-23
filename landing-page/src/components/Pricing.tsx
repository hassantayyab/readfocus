'use client';
import Button from '@/components/ui/button';
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
    <section id='pricing' className='py-24' style={{ backgroundColor: '#fcfbfa' }}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className='text-center mb-20'
        >
          <h2 className='text-4xl lg:text-5xl font-bold mb-6' style={{ color: '#0d1221' }}>
            Simple, <span style={{ color: '#f75c30' }}>Monthly Pricing</span>
          </h2>
          <p className='text-xl max-w-3xl mx-auto' style={{ color: '#0d1221' }}>
            Get unlimited AI-powered summaries with a simple monthly subscription.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className='max-w-lg mx-auto mb-20 mt-8'
        >
          <div className='bg-white rounded-3xl border border-gray-200 overflow-hidden relative'>
            <div className='p-8 lg:p-10 text-center'>
              <div className='mb-8'>
                <div className='text-6xl lg:text-7xl font-bold mb-2' style={{ color: '#0d1221' }}>
                  $4.99
                </div>
                <div className='text-xl font-medium' style={{ color: '#0d1221' }}>
                  Per Month
                </div>
                <div className='text-sm mt-2' style={{ color: '#0d1221' }}>
                  Cancel anytime • No hidden fees
                </div>
              </div>

              <div className='space-y-4 mb-8'>
                {features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                    className='flex items-center justify-center space-x-3'
                  >
                    <div
                      className='w-5 h-5 rounded-full flex items-center justify-center'
                      style={{ backgroundColor: '#f75c30' }}
                    >
                      <span className='text-white text-xs'>✓</span>
                    </div>
                    <span className='font-medium' style={{ color: '#0d1221' }}>
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </div>

              <Button variant='primary' size='lg' className='w-full mb-4'>
                Add to Chrome - Free
              </Button>

              <p className='text-sm font-medium' style={{ color: '#0d1221' }}>
                Secure payment
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className='rounded-3xl p-8 lg:p-12 border border-gray-200'
          style={{ backgroundColor: '#fcfbfa' }}
        >
          <h3
            className='text-3xl lg:text-4xl font-bold mb-12 text-center'
            style={{ color: '#0d1221' }}
          >
            Frequently Asked Questions
          </h3>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'>
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                viewport={{ once: true }}
                className='bg-gray-50 rounded-2xl p-6 transition-all duration-300 border border-gray-100'
              >
                <h4 className='font-bold mb-4 text-lg' style={{ color: '#0d1221' }}>
                  {faq.question}
                </h4>
                <p className='leading-relaxed' style={{ color: '#0d1221' }}>
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
