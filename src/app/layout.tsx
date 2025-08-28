import { APP_CONFIG } from '@/lib/config';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  authors: [{ name: APP_CONFIG.author }],
  keywords: ['reading', 'education', 'focus', 'student', 'comprehension', 'ADD', 'ADHD'],
  openGraph: {
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className={`${inter.className} min-h-screen`}>
        <div className='flex flex-col min-h-screen'>
          <header className='bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40'>
            <div className='container mx-auto px-6 py-4'>
              <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                  {APP_CONFIG.name}
                </h1>
                <div className='text-sm text-gray-500'>
                  Transform your reading experience
                </div>
              </div>
            </div>
          </header>

          <main className='flex-1'>{children}</main>

          <footer className='bg-white border-t border-gray-200'>
            <div className='container mx-auto px-6 py-8 text-center'>
              <div className='text-gray-600 mb-2'>
                <p>&copy; 2024 {APP_CONFIG.name}. Built with focus in mind.</p>
              </div>
              <div className='text-sm text-gray-400'>
                Helping students read better, one chunk at a time.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
