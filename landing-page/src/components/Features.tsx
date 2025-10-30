'use client';
import {
  fadeInUp,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from '@/lib/animations';
import { motion } from 'framer-motion';
import { Database, FileText, GraduationCap, Shield, Sparkles, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: 'AI-Powered Intelligence',
      description:
        'Advanced AI provides high-quality, educational summaries that understand context and nuance.',
      link: '#',
      icon: <Sparkles className='w-6 h-6' />,
    },
    {
      title: 'Instant Summarization',
      description:
        'Get comprehensive summaries in under 10 seconds. One click transforms any webpage into digestible insights.',
      link: '#',
      icon: <Zap className='w-6 h-6' />,
    },
    {
      title: 'Multiple Summary Formats',
      description:
        'Quick overview, detailed analysis, key points, action items, and ELI15 explanations for different needs.',
      link: '#',
      icon: <FileText className='w-6 h-6' />,
    },
    {
      title: 'Persistent Storage',
      description:
        'Generate once, access forever. All summaries are saved locally for instant recall and offline access.',
      link: '#',
      icon: <Database className='w-6 h-6' />,
    },
    {
      title: 'Educational Focus',
      description:
        'Designed for students, researchers, and professionals with academic-quality analysis and concept explanations.',
      link: '#',
      icon: <GraduationCap className='w-6 h-6' />,
    },
    {
      title: 'Privacy First',
      description:
        'No data collection, no tracking. Your reading habits and summaries stay completely private and secure.',
      link: '#',
      icon: <Shield className='w-6 h-6' />,
    },
  ];

  return (
    <section id='features' className='pb-12 sm:pb-16 lg:pb-24 pt-8 sm:pt-12 lg:pt-16 bg-background'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          {...fadeInUp}
          whileInView='animate'
          viewport={viewportOnce}
          className='text-center mb-12 sm:mb-16 lg:mb-20'
        >
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900'>
            Powerful Features for <span className='text-orange-500'>Smarter Reading</span>
          </h2>
          <p className='text-base sm:text-lg lg:text-xl max-w-3xl mx-auto text-gray-900 px-4'>
            Transform information overload into knowledge advantage with cutting-edge AI technology
          </p>
        </motion.div>

        <motion.div
          className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 lg:mb-20'
          variants={staggerContainer}
          whileInView='animate'
          viewport={viewportOnce}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className='group relative bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 transition-all duration-300'
            >
              <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6'>
                <div className='w-12 h-12 sm:w-14 sm:h-14 bg-background rounded-xl sm:rounded-2xl flex items-center justify-center border border-orange-100 text-orange-500 shrink-0'>
                  {feature.icon}
                </div>
                <h3 className='text-xl sm:text-2xl font-bold text-gray-900'>{feature.title}</h3>
              </div>
              <p className='leading-relaxed text-base sm:text-lg text-gray-700'>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          {...fadeInUp}
          whileInView='animate'
          viewport={viewportOnce}
          className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-12 border border-gray-200'
        >
          <div className='grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-start lg:items-center'>
            <motion.div {...slideInLeft} whileInView='animate' viewport={viewportOnce}>
              <h3 className='text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-900'>
                <span className='text-orange-500'>5</span> Different Summary Types
              </h3>
              <p className='mb-4 sm:mb-6 lg:mb-8 text-base lg:text-lg text-gray-700'>
                From quick overviews to detailed analysis, get exactly the level of detail you need
                for any situation.
              </p>
              <motion.div
                className='space-y-2 sm:space-y-3'
                variants={staggerContainer}
                whileInView='animate'
                viewport={viewportOnce}
              >
                {[
                  { label: 'TLDR', desc: 'Essential points in 2-3 sentences' },
                  { label: 'Detailed', desc: 'Comprehensive analysis with insights' },
                  { label: 'ELI15', desc: 'Complex concepts in simple terms' },
                  { label: 'Concepts', desc: 'Key terms and definitions explained' },
                  { label: 'Actions', desc: 'Practical steps and takeaways' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    variants={staggerItem}
                    className='flex items-start sm:items-center space-x-2 sm:space-x-3'
                  >
                    <div className='w-4 h-4 sm:w-5 sm:h-5 rounded-lg flex items-center justify-center bg-orange-500 flex-shrink-0 mt-0.5 sm:mt-0'>
                      <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full'></div>
                    </div>
                    <span className='text-xs sm:text-sm lg:text-base text-gray-700'>
                      <strong className='text-gray-900'>{item.label}:</strong> {item.desc}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              {...slideInRight}
              whileInView='animate'
              viewport={viewportOnce}
              className='relative mt-6 lg:mt-0'
            >
              <div className='bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 overflow-hidden'>
                <div className='flex border-b border-gray-200 overflow-x-auto scrollbar-hide'>
                  <div className='px-2 sm:px-3 lg:px-4 xl:px-6 py-2 sm:py-2.5 lg:py-3 font-medium text-[10px] sm:text-xs lg:text-sm text-white bg-orange-500/90 whitespace-nowrap flex-shrink-0'>
                    TLDR
                  </div>
                  <div className='px-2 sm:px-3 lg:px-4 xl:px-6 py-2 sm:py-2.5 lg:py-3 text-gray-600 font-medium text-[10px] sm:text-xs lg:text-sm whitespace-nowrap flex-shrink-0'>
                    Detailed
                  </div>
                  <div className='px-2 sm:px-3 lg:px-4 xl:px-6 py-2 sm:py-2.5 lg:py-3 text-gray-600 font-medium text-[10px] sm:text-xs lg:text-sm whitespace-nowrap flex-shrink-0'>
                    ELI15
                  </div>
                  <div className='px-2 sm:px-3 lg:px-4 xl:px-6 py-2 sm:py-2.5 lg:py-3 text-gray-600 font-medium text-[10px] sm:text-xs lg:text-sm whitespace-nowrap flex-shrink-0'>
                    Concepts
                  </div>
                  <div className='px-2 sm:px-3 lg:px-4 xl:px-6 py-2 sm:py-2.5 lg:py-3 text-gray-600 font-medium text-[10px] sm:text-xs lg:text-sm whitespace-nowrap flex-shrink-0'>
                    Actions
                  </div>
                </div>
                <div className='p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3'>
                  <div className='h-1.5 sm:h-2 lg:h-3 rounded-full bg-orange-200 w-full'></div>
                  <div className='h-1.5 sm:h-2 lg:h-3 rounded-full bg-orange-200 w-4/5'></div>
                  <div className='h-1.5 sm:h-2 lg:h-3 rounded-full bg-orange-200 w-3/4'></div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
