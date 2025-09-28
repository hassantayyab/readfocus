'use client';
import Button from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section
      className='relative min-h-[90vh] w-full overflow-hidden bg-orange-50'
    >
      {/* Grid Background */}
      <div
        className={cn(
          'absolute inset-0',
          '[background-size:40px_40px]',
          '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
        )}
      />
      {/* Radial gradient overlay for faded look */}
      <div
        className='pointer-events-none absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] bg-orange-50'
      ></div>

      <div className='relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20'>
        <div className='grid lg:grid-cols-2 gap-16 items-center'>
          <div className='text-center lg:text-left'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className='inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-8 border border-orange-200'
            >
              ✨ AI-Powered Content Summarization
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className='text-5xl md:text-7xl font-bold leading-tight mb-6 text-gray-900'
            >
              Understand <span className="text-orange-500">instantly</span>
              <br /> with AI.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='text-xl mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0 text-gray-900'
            >
              Transform any webpage into digestible, intelligent summaries with AI-powered content
              analysis. Save time and understand more.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12'
            >
              <Button variant='primary' size='lg' className='text-lg'>
                Add to Chrome - Free
              </Button>
              <Button variant='outline' size='lg' className='text-lg'>
                Watch Demo
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className='relative'
          >
            <div className='relative'>
              <motion.div
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className='bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden p-1'
              >
                <div className='bg-white rounded-[20px] border border-gray-100 overflow-hidden'>
                  <div className='bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex space-x-1.5'>
                        <div className='w-3 h-3 bg-red-400 rounded-full'></div>
                        <div className='w-3 h-3 bg-yellow-400 rounded-full'></div>
                        <div className='w-3 h-3 bg-green-400 rounded-full'></div>
                      </div>
                      <div className='bg-white rounded-lg px-3 py-1.5 text-gray-600 text-sm border border-gray-200'>
                        https://example.com/article
                      </div>
                    </div>
                    <Button variant='primary' size='sm' className=''>
                      📚 Summarize
                    </Button>
                  </div>

                  <div className='p-6 bg-white relative'>
                    <div className='space-y-4 mb-6'>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        transition={{ duration: 1, delay: 1 }}
                        className='h-3 bg-gray-200 rounded'
                      ></motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1, delay: 1.2 }}
                        className='h-3 bg-gray-200 rounded'
                      ></motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '70%' }}
                        transition={{ duration: 1, delay: 1.4 }}
                        className='h-3 bg-gray-200 rounded'
                      ></motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 2 }}
                      className='bg-orange-50 rounded-2xl border border-orange-200 p-4'
                    >
                      <div className='flex items-center space-x-3 mb-3'>
                        <div
                          className='w-8 h-8 rounded-xl flex items-center justify-center bg-orange-500'
                        >
                          <span className='text-white text-sm font-bold'>K</span>
                        </div>
                        <span className='font-semibold text-gray-900'>
                          AI Summary
                        </span>
                      </div>
                      <div className='space-y-2'>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 0.8, delay: 2.3 }}
                          className='h-2 rounded bg-orange-200'
                        ></motion.div>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '85%' }}
                          transition={{ duration: 0.8, delay: 2.5 }}
                          className='h-2 rounded bg-orange-200'
                        ></motion.div>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '75%' }}
                          transition={{ duration: 0.8, delay: 2.7 }}
                          className='h-2 rounded bg-orange-200'
                        ></motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
