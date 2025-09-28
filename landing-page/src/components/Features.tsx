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
    <section id='features' className='pb-24 pt-16 bg-orange-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          {...fadeInUp}
          whileInView='animate'
          viewport={viewportOnce}
          className='text-center mb-20'
        >
          <h2 className='text-4xl lg:text-5xl font-bold mb-6 text-gray-900'>
            Powerful Features for <span className='text-orange-500'>Smarter Reading</span>
          </h2>
          <p className='text-xl max-w-3xl mx-auto text-gray-900'>
            Transform information overload into knowledge advantage with cutting-edge AI technology
          </p>
        </motion.div>

        <motion.div
          className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20'
          variants={staggerContainer}
          whileInView='animate'
          viewport={viewportOnce}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className='group relative bg-white border border-gray-200 rounded-2xl p-10 transition-all duration-300'
            >
              <div className='flex items-center space-x-4 mb-6'>
                <div className='w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 text-orange-500 shrink-0'>
                  {feature.icon}
                </div>
                <h3 className='text-2xl font-bold text-gray-900'>{feature.title}</h3>
              </div>
              <p className='leading-relaxed text-lg text-gray-700'>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          {...fadeInUp}
          whileInView='animate'
          viewport={viewportOnce}
          className='bg-white rounded-2xl p-8 lg:p-12 border border-gray-200'
        >
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            <motion.div {...slideInLeft} whileInView='animate' viewport={viewportOnce}>
              <h3 className='text-4xl lg:text-5xl font-bold mb-6 text-gray-900'>
                <span className='text-orange-500'>5</span> Different Summary Types
              </h3>
              <p className='mb-8 text-xl text-gray-700'>
                From quick overviews to detailed analysis, get exactly the level of detail you need
                for any situation.
              </p>
              <motion.div
                className='space-y-4'
                variants={staggerContainer}
                whileInView='animate'
                viewport={viewportOnce}
              >
                {[
                  { label: 'Summary', desc: 'Essential points in 2-3 sentences' },
                  { label: 'Detailed', desc: 'Comprehensive analysis with insights' },
                  { label: 'ELI15', desc: 'Complex concepts in simple terms' },
                  { label: 'Concepts', desc: 'Key terms and definitions explained' },
                  { label: 'Actions', desc: 'Practical steps and takeaways' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    variants={staggerItem}
                    className='flex items-center space-x-4'
                  >
                    <div className='w-5 h-5 rounded-lg flex items-center justify-center bg-orange-500'>
                      <div className='w-2 h-2 bg-white rounded-full'></div>
                    </div>
                    <span className='text-lg text-gray-700'>
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
              className='relative'
            >
              <div className='bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden'>
                <div className='flex border-b border-gray-200'>
                  <div className='px-6 py-4 font-medium text-sm text-white bg-orange-500/90'>
                    Summary
                  </div>
                  <div className='px-6 py-4 text-gray-600 font-medium text-base'>Detailed</div>
                  <div className='px-6 py-4 text-gray-600 font-medium text-base'>ELI15</div>
                  <div className='px-6 py-4 text-gray-600 font-medium text-base'>Concepts</div>
                  <div className='px-6 py-4 text-gray-600 font-medium text-base'>Actions</div>
                </div>
                <div className='p-6 space-y-4'>
                  <div className='h-3 rounded-full bg-orange-200 w-full'></div>
                  <div className='h-3 rounded-full bg-orange-200 w-4/5'></div>
                  <div className='h-3 rounded-full bg-orange-200 w-3/4'></div>
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
