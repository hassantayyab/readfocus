import { APP_CONFIG } from '@/lib/config';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  keywords: ['reading', 'education', 'focus', 'student', 'comprehension'],
  authors: [{ name: APP_CONFIG.author }],
  openGraph: {
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50`}>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">{APP_CONFIG.name}</h1>
                <div className="rounded-full bg-gray-100 px-4 py-2 text-sm leading-relaxed text-gray-500">
                  Transform your reading experience
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-gray-200 bg-white">
            <div className="container mx-auto px-6 py-8 text-center">
              <div className="mb-2 text-gray-600">
                <p>&copy; 2024 {APP_CONFIG.name}. Built with focus in mind.</p>
              </div>
              <div className="text-sm leading-relaxed text-gray-500">
                Helping students read better, one chunk at a time.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
