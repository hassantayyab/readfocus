import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kuiqlee - AI-Powered Content Summarization | Chrome Extension',
  description:
    'Transform any webpage into digestible, intelligent summaries with AI-powered content analysis. Get instant summaries of articles, research papers, and web content with Kuiqlee.',
  keywords: [
    'AI summarization',
    'content analysis',
    'chrome extension',
    'research tool',
    'productivity',
    'AI assistant',
    'text summarization',
    'academic research',
    'reading tool',
  ],
  authors: [{ name: 'Kuiqlee Team' }],
  creator: 'Kuiqlee',
  publisher: 'Kuiqlee',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kuiqlee.com',
    siteName: 'Kuiqlee',
    title: 'Kuiqlee - AI-Powered Content Summarization',
    description:
      'Transform any webpage into digestible, intelligent summaries with AI-powered content analysis.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kuiqlee - AI-Powered Content Summarization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kuiqlee - AI-Powered Content Summarization',
    description:
      'Transform any webpage into digestible, intelligent summaries with AI-powered content analysis.',
    images: ['/og-image.png'],
    creator: '@kuiqlee',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang='en' className='scroll-smooth'>
      <head>
        <link rel='icon' href='/favicon.ico' />
        <link rel='apple-touch-icon' sizes='180x180' href='/apple-touch-icon.png' />
        <link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
        <link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />
        <link rel='manifest' href='/site.webmanifest' />
      </head>
      <body className={`${inter.className} antialiased bg-background`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
