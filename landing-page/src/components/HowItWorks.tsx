'use client';
import Button from '@/components/ui/button';
import {
  fadeInUp,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from '@/lib/animations';
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
      <section id='how-it-works' className='py-12 sm:py-16 lg:py-24 bg-background'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            {...fadeInUp}
            whileInView='animate'
            viewport={viewportOnce}
            className='text-center mb-12 sm:mb-16 lg:mb-20'
          >
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900'>
              How Kuiqlee <span className='text-orange-500'>Works</span>
            </h2>
            <p className='text-base sm:text-lg lg:text-xl max-w-3xl mx-auto text-gray-900 px-4'>
              Get started in minutes and transform your reading experience forever
            </p>
          </motion.div>

          <motion.div
            className='grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 lg:mb-20'
            variants={staggerContainer}
            whileInView='animate'
            viewport={viewportOnce}
          >
            {steps.map((step, index) => (
              <motion.div key={index} variants={staggerItem} className='relative'>
                {index < steps.length - 1 && (
                  <div className='hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-orange-200 z-0 transform -translate-y-1/2'></div>
                )}

                <div className='relative bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 transition-all duration-300 border border-gray-200 z-10'>
                  <div className='text-orange-200 font-bold text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4'>
                    {step.step}
                  </div>

                  <h3 className='text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900'>
                    {step.title}
                  </h3>
                  <p className='mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base text-gray-900'>
                    {step.description}
                  </p>

                  <ul className='space-y-2 sm:space-y-3'>
                    {step.details.map((detail, detailIndex) => (
                      <li
                        key={detailIndex}
                        className='flex items-center text-xs sm:text-sm text-gray-900'
                      >
                        <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-2 sm:mr-3 bg-orange-500 flex-shrink-0'></div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className='py-12 sm:py-16 lg:py-24 bg-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div {...fadeInUp} whileInView='animate' viewport={viewportOnce}>
            <div className='text-center mb-8 sm:mb-10 lg:mb-12'>
              <h3 className='text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white'>
                See It In Action
              </h3>
              <p className='text-base sm:text-lg lg:text-xl max-w-2xl mx-auto text-gray-300 px-4'>
                Watch how Kuiqlee transforms a complex research article into multiple digestible
                summary formats
              </p>
            </div>

            <div className='grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center'>
              <motion.div {...slideInLeft} whileInView='animate' viewport={viewportOnce}>
                <h4 className='text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 flex items-center text-white'>
                  <span className='w-7 h-7 sm:w-8 sm:h-8 bg-red-100 text-red-600 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold mr-2 sm:mr-3 flex-shrink-0'>
                    1
                  </span>
                  Before: Dense Research Article
                </h4>
                <div className='bg-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4'>
                  <div className='text-xs sm:text-sm text-gray-500 font-mono'>
                    research-paper.pdf
                  </div>
                  <div className='space-y-2 sm:space-y-3'>
                    <div className='h-2 sm:h-3 bg-gray-300 rounded w-full'></div>
                    <div className='h-2 sm:h-3 bg-gray-300 rounded w-5/6'></div>
                    <div className='h-2 sm:h-3 bg-gray-300 rounded w-full'></div>
                    <div className='h-2 sm:h-3 bg-gray-300 rounded w-4/5'></div>
                    <div className='h-2 sm:h-3 bg-gray-300 rounded w-full'></div>
                    <div className='h-2 sm:h-3 bg-gray-300 rounded w-3/4'></div>
                    <div className='h-2 sm:h-3 bg-gray-300 rounded w-full'></div>
                    <div className='h-2 sm:h-3 bg-gray-300 rounded w-5/6'></div>
                  </div>
                  <div className='text-xs sm:text-sm italic font-medium text-gray-400'>
                    ⏱️ 20 minutes reading time
                  </div>
                </div>
              </motion.div>

              <motion.div {...slideInRight} whileInView='animate' viewport={viewportOnce}>
                <h4 className='text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 flex items-center text-white'>
                  <span className='w-7 h-7 sm:w-8 sm:h-8 bg-green-100 text-green-600 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold mr-2 sm:mr-3 flex-shrink-0'>
                    2
                  </span>
                  After: AI-Generated Summaries
                </h4>
                <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200'>
                  <div className='flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4'>
                    <div className='w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center bg-orange-500 flex-shrink-0'>
                      <span className='text-white text-xs font-bold'>K</span>
                    </div>
                    <span className='text-xs sm:text-sm font-semibold text-gray-900'>
                      Kuiqlee Summary
                    </span>
                  </div>

                  <div className='space-y-3 sm:space-y-4'>
                    <div className='bg-background rounded-lg sm:rounded-xl p-3 sm:p-4'>
                      <div className='text-xs font-semibold mb-2 text-orange-500'>
                        QUICK SUMMARY
                      </div>
                      <div className='space-y-2'>
                        <div className='h-1.5 sm:h-2 rounded w-full bg-orange-200'></div>
                        <div className='h-1.5 sm:h-2 rounded w-4/5 bg-orange-200'></div>
                      </div>
                    </div>

                    <div className='bg-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4'>
                      <div className='text-xs font-semibold mb-2 text-purple-600'>KEY CONCEPTS</div>
                      <div className='space-y-2'>
                        <div className='h-1.5 sm:h-2 rounded w-3/4 bg-purple-200'></div>
                        <div className='h-1.5 sm:h-2 rounded w-5/6 bg-purple-200'></div>
                      </div>
                    </div>

                    <div className='bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4'>
                      <div className='text-xs font-semibold mb-2 text-green-600'>ACTION ITEMS</div>
                      <div className='space-y-2'>
                        <div className='h-1.5 sm:h-2 rounded w-2/3 bg-green-200'></div>
                        <div className='h-1.5 sm:h-2 rounded w-3/4 bg-green-200'></div>
                      </div>
                    </div>
                  </div>

                  <div className='text-xs sm:text-sm italic mt-3 sm:mt-4 font-medium text-gray-400'>
                    ⚡ 2 minutes reading time • 90% time saved
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              {...fadeInUp}
              whileInView='animate'
              viewport={viewportOnce}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='text-center mt-8 sm:mt-10 lg:mt-12'
            >
              <Button
                variant='primary'
                size='lg'
                className='text-white bg-orange-500 hover:bg-orange-500/90 text-sm sm:text-base'
              >
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
