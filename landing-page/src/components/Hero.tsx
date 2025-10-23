'use client';
import Button from '@/components/ui/button';
import { fadeInUp, slideInRight, staggerContainer, staggerItem } from '@/lib/animations';
import { CHROME_EXTENSION_URL, DEMO_VIDEO_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Image from 'next/image';

const Hero = () => {
  return (
    <section className='relative min-h-[90vh] w-full overflow-hidden bg-background'>
      {/* Grid Background */}
      <div
        className={cn(
          'absolute inset-0',
          '[background-size:40px_40px]',
          '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
        )}
      />
      {/* Radial gradient overlay for faded look */}
      <div className='pointer-events-none absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] bg-background'></div>

      <div className='relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 lg:pb-20'>
        <div className='grid lg:grid-cols-2 gap-8 lg:gap-16 items-center'>
          <motion.div
            className='text-center lg:text-left'
            variants={staggerContainer}
            initial='initial'
            animate='animate'
          >
            <motion.div
              variants={staggerItem}
              className='inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-orange-200'
            >
              ✨ AI-Powered Content Summarization
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 sm:mb-6 text-gray-900'
            >
              Understand <span className='text-orange-500'>instantly</span>
              <br /> with AI.
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className='text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0 text-gray-900'
            >
              Transform any webpage into digestible, intelligent summaries with AI-powered content
              analysis. Save time and understand more.
            </motion.p>

            <motion.div
              variants={staggerItem}
              className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-12'
            >
              <Button
                variant='primary'
                size='lg'
                className='text-sm sm:text-base lg:text-lg'
                href={CHROME_EXTENSION_URL}
              >
                Add to Chrome - Free
              </Button>
              <Button
                variant='outline'
                size='lg'
                className='text-sm sm:text-base lg:text-lg'
                href={DEMO_VIDEO_URL}
              >
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            {...slideInRight}
            transition={{ duration: 0.8, delay: 0.2 }}
            className='relative mt-8 lg:mt-0'
          >
            <div className='relative'>
              <div className='bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 overflow-hidden p-1'>
                <div className='bg-white rounded-[10px] sm:rounded-[14px] border border-gray-100 overflow-hidden'>
                  <div className='bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b border-gray-200'>
                    <div className='flex items-center space-x-2 sm:space-x-3 min-w-0'>
                      <div className='flex space-x-1 sm:space-x-1.5'>
                        <div className='w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full'></div>
                        <div className='w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full'></div>
                        <div className='w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full'></div>
                      </div>
                      <div className='bg-white rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-gray-600 text-xs sm:text-sm border border-gray-200 truncate'>
                        https://example.com/article
                      </div>
                    </div>
                    <Button
                      variant='primary'
                      size='sm'
                      className='text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap'
                    >
                      📚 Summarize
                    </Button>
                  </div>

                  <div className='p-4 sm:p-6 bg-white relative'>
                    <div className='space-y-3 sm:space-y-4 mb-4 sm:mb-6'>
                      <div className='h-2 sm:h-3 bg-gray-200 rounded w-4/5'></div>
                      <div className='h-2 sm:h-3 bg-gray-200 rounded w-full'></div>
                      <div className='h-2 sm:h-3 bg-gray-200 rounded w-3/4'></div>
                    </div>

                    <motion.div
                      {...fadeInUp}
                      transition={{ duration: 0.6, delay: 1 }}
                      className='bg-background rounded-xl sm:rounded-2xl border border-orange-200 p-3 sm:p-4'
                    >
                      <div className='flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3'>
                        <Image
                          src='/logo.png'
                          alt='Kuiqlee Logo'
                          width={32}
                          height={32}
                          className='w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0'
                        />
                        <span className='font-semibold text-sm sm:text-base text-gray-900'>
                          AI Summary
                        </span>
                      </div>
                      <div className='space-y-2'>
                        <div className='h-1.5 sm:h-2 rounded bg-orange-200 w-full'></div>
                        <div className='h-1.5 sm:h-2 rounded bg-orange-200 w-4/5'></div>
                        <div className='h-1.5 sm:h-2 rounded bg-orange-200 w-3/4'></div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
