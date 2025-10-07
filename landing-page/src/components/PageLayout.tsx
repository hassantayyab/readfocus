'use client';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

const PageLayout = ({ children, title, description, className }: PageLayoutProps) => {
  return (
    <div className='min-h-screen bg-background'>
      <Header />
      <main
        className={cn('w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16', className)}
      >
        <div className='mb-6 sm:mb-8'>
          <h1 className='text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4'>
            {title}
          </h1>
          {description && <p className='text-base sm:text-lg text-gray-600'>{description}</p>}
        </div>
        <div className='w-full'>{children}</div>
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;
