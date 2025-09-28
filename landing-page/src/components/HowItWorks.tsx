'use client';
import Button from '@/components/ui/button';
import { motion } from 'framer-motion';

const HowItWorks = () => {
  const steps = [
    {
      step: '01',
      title: 'Install & Setup',
      description: 'Add Kuiqlee to Chrome and ready to use instantly',
      details: ['Install from Chrome Web Store', 'Ready to use instantly'],
    },
    {
      step: '02',
      title: 'Browse & Click',
      description: 'Navigate to any webpage and click the Start button',
      details: ['Works on any text content', 'One-click activation'],
    },
    {
      step: '03',
      title: 'AI Analysis',
      description: 'AI analyzes content and generates intelligent summaries',
      details: ['Advanced AI processing', 'Context-aware analysis', 'Educational focus'],
    },
    {
      step: '04',
      title: 'Instant Results',
      description: 'Get 5 different summary formats in under 10 seconds',
      details: [
        'Quick overview',
        'Detailed analysis',
        'Key concepts',
        'Action items',
        'ELI15 explanations',
      ],
    },
  ];

  return (
    <>
      <section id='how-it-works' className='py-24 bg-orange-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='text-center mb-20'
          >
            <h2 className='text-4xl lg:text-5xl font-bold mb-6 text-gray-900'>
              How Kuiqlee <span className='text-orange-500'>Works</span>
            </h2>
            <p className='text-xl max-w-3xl mx-auto text-gray-900'>
              Get started in minutes and transform your reading experience forever
            </p>
          </motion.div>

          <div className='grid lg:grid-cols-4 gap-8 mb-20'>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className='relative'
              >
                {index < steps.length - 1 && (
                  <div className='hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-orange-200 z-0 transform -translate-y-1/2'></div>
                )}

                <motion.div className='relative bg-white rounded-3xl p-8 transition-all duration-300 border border-gray-200 z-10'>
                  <div className='text-orange-200 font-bold text-6xl mb-4'>{step.step}</div>

                  <h3 className='text-xl font-bold mb-4 text-gray-900'>{step.title}</h3>
                  <p className='mb-6 leading-relaxed text-gray-900'>{step.description}</p>

                  <ul className='space-y-3'>
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className='flex items-center text-sm text-gray-900'>
                        <div className='w-2 h-2 rounded-full mr-3 bg-orange-500'></div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className='py-24 bg-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className='text-center mb-12'>
              <h3 className='text-3xl lg:text-4xl font-bold mb-6 text-white'>See It In Action</h3>
              <p className='text-xl max-w-2xl mx-auto text-gray-300'>
                Watch how Kuiqlee transforms a complex research article into multiple digestible
                summary formats
              </p>
            </div>

            <div className='grid lg:grid-cols-2 gap-12 items-center'>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <h4 className='text-xl font-semibold mb-6 flex items-center text-white'>
                  <span className='w-8 h-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-sm font-bold mr-3'>
                    1
                  </span>
                  Before: Dense Research Article
                </h4>
                <div className='bg-gray-100 rounded-2xl p-6 space-y-4'>
                  <div className='text-sm text-gray-500 font-mono'>research-paper.pdf</div>
                  <div className='space-y-3'>
                    <div className='h-3 bg-gray-300 rounded w-full'></div>
                    <div className='h-3 bg-gray-300 rounded w-5/6'></div>
                    <div className='h-3 bg-gray-300 rounded w-full'></div>
                    <div className='h-3 bg-gray-300 rounded w-4/5'></div>
                    <div className='h-3 bg-gray-300 rounded w-full'></div>
                    <div className='h-3 bg-gray-300 rounded w-3/4'></div>
                    <div className='h-3 bg-gray-300 rounded w-full'></div>
                    <div className='h-3 bg-gray-300 rounded w-5/6'></div>
                  </div>
                  <div className='text-sm italic font-medium text-gray-400'>
                    ⏱️ 20 minutes reading time
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h4 className='text-xl font-semibold mb-6 flex items-center text-white'>
                  <span className='w-8 h-8 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-sm font-bold mr-3'>
                    2
                  </span>
                  After: AI-Generated Summaries
                </h4>
                <div className='bg-white rounded-2xl p-6 border border-gray-200'>
                  <div className='flex items-center space-x-3 mb-4'>
                    <div className='w-6 h-6 rounded-lg flex items-center justify-center bg-orange-500'>
                      <span className='text-white text-xs font-bold'>K</span>
                    </div>
                    <span className='text-sm font-semibold text-white'>Kuiqlee Summary</span>
                  </div>

                  <div className='space-y-4'>
                    <div className='bg-white rounded-xl p-4'>
                      <div className='text-xs font-semibold mb-2 text-orange-500'>
                        QUICK SUMMARY
                      </div>
                      <div className='space-y-2'>
                        <div
                          className='h-2 rounded w-full'
                          style={{ backgroundColor: 'rgba(249, 115, 22, 0.3)' }}
                        ></div>
                        <div
                          className='h-2 rounded w-4/5'
                          style={{ backgroundColor: 'rgba(249, 115, 22, 0.3)' }}
                        ></div>
                      </div>
                    </div>

                    <div className='bg-white rounded-xl p-4'>
                      <div className='text-xs font-semibold mb-2' style={{ color: '#8b5cf6' }}>
                        KEY CONCEPTS
                      </div>
                      <div className='space-y-2'>
                        <div
                          className='h-2 rounded w-3/4'
                          style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)' }}
                        ></div>
                        <div
                          className='h-2 rounded w-5/6'
                          style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)' }}
                        ></div>
                      </div>
                    </div>

                    <div className='bg-white rounded-xl p-4'>
                      <div className='text-xs font-semibold mb-2' style={{ color: '#10b981' }}>
                        ACTION ITEMS
                      </div>
                      <div className='space-y-2'>
                        <div
                          className='h-2 rounded w-2/3'
                          style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)' }}
                        ></div>
                        <div
                          className='h-2 rounded w-3/4'
                          style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)' }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className='text-sm italic mt-4 font-medium text-gray-400'>
                    ⚡ 2 minutes reading time • 90% time saved
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className='text-center mt-12'
            >
              <Button variant='primary' size='lg' className='text-white bg-orange-500'>
                Try It Now
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HowItWorks;
