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
      <body
        className={`${inter.className} min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100`}
      >
        <div className='flex flex-col min-h-screen'>
          <header className='bg-white shadow-sm border-b'>
            <div className='container mx-auto px-4 py-4'>
              <h1 className='text-2xl font-bold text-blue-600'>{APP_CONFIG.name}</h1>
            </div>
          </header>

          <main className='flex-1 container mx-auto px-4 py-8'>{children}</main>

          <footer className='bg-gray-50 border-t'>
            <div className='container mx-auto px-4 py-6 text-center text-gray-600'>
              <p>&copy; 2024 {APP_CONFIG.name}. Built with focus in mind.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
