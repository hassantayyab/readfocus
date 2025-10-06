'use client';
import Button from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Header = () => {
  const router = useRouter();
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className='backdrop-blur-xl sticky top-0 z-50'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <Link className='flex items-center space-x-2 cursor-pointer' href='/'>
            <div className='w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500'>
              <span className='text-white font-bold text-sm'>K</span>
            </div>
            <span className='text-xl font-bold text-gray-900'>Kuiqlee</span>
          </Link>

          <nav className='hidden md:flex items-center space-x-4 lg:space-x-8'>
            <a
              href='#features'
              className='transition-colors font-medium text-sm lg:text-base text-gray-700 hover:text-orange-600'
            >
              Features
            </a>
            <a
              href='#how-it-works'
              className='transition-colors font-medium text-sm lg:text-base text-gray-700 hover:text-orange-600'
            >
              How it Works
            </a>
            <a
              href='#pricing'
              className='transition-colors font-medium text-sm lg:text-base text-gray-700 hover:text-orange-600'
            >
              Pricing
            </a>
          </nav>

          <div className='flex items-center space-x-2 sm:space-x-4'>
            <Button variant='primary' size='md' className='text-sm sm:text-base px-3 sm:px-4'>
              Add to Chrome
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
