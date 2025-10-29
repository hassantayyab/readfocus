'use client';
import Button from '@/components/ui/button';
import { slideInRight, staggerContainer, staggerItem } from '@/lib/animations';
import { CHROME_EXTENSION_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
        <div className='grid lg:grid-cols-2 gap-8 items-center'>
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
            </motion.div>
          </motion.div>

          <motion.div
            {...slideInRight}
            transition={{ duration: 0.8, delay: 0.2 }}
            className='relative mt-8 lg:mt-0'
          >
            <div className='relative'>
              <div className='bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden p-2'>
                <div className='relative w-full' style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className='absolute top-0 left-0 w-full h-full rounded-lg'
                    src='https://www.youtube.com/embed/BGnxcVVI2FU?controls=0&modestbranding=1&rel=0&showinfo=0&fs=0&iv_load_policy=3&autohide=1&loop=1&playlist=BGnxcVVI2FU'
                    title='Kuiqlee Demo Video'
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                  ></iframe>
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
