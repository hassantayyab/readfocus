import PageLayout from '@/components/PageLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - Kuiqlee',
  description: 'Frequently asked questions about Kuiqlee AI-powered content summarization.',
};

const FAQPage = () => {
  const faqs = [
    {
      question: 'What is Kuiqlee?',
      answer:
        'Kuiqlee is a Chrome extension that uses artificial intelligence to automatically summarize web content. It helps you quickly understand the key points of articles, research papers, and other online content without having to read everything in full.',
    },
    {
      question: 'How accurate are the summaries?',
      answer:
        'Our AI technology is highly sophisticated and provides accurate, contextually relevant summaries. However, we always recommend reading the full content for critical decisions or detailed understanding.',
    },
    {
      question: 'What types of content can Kuiqlee summarize?',
      answer:
        'Kuiqlee works with most text-based web content including news articles, blog posts, research papers, documentation, and long-form content. It automatically detects and processes the main content on web pages.',
    },
    {
      question: 'Is Kuiqlee free to use?',
      answer:
        'Kuiqlee offers both free and premium plans. The free plan includes basic summarization features, while premium plans offer advanced features like longer summaries, batch processing, and priority support.',
    },
    {
      question: 'Does Kuiqlee work offline?',
      answer:
        'No, Kuiqlee requires an internet connection to process content through our AI servers. This ensures you always get the most up-to-date and accurate summarization technology.',
    },
    {
      question: 'Is my data secure?',
      answer:
        "Yes, we take privacy seriously. We only process the text content you choose to summarize and don't store personal information. All data transmission is encrypted and secure.",
    },
    {
      question: 'Can I customize the length of summaries?',
      answer:
        'Yes! Kuiqlee allows you to adjust the summary length from brief overviews to more detailed analyses, depending on your needs and preferences.',
    },
    {
      question: 'Does Kuiqlee support other browsers?',
      answer:
        "Currently, Kuiqlee is available as a Chrome extension. We're working on support for other browsers and will announce when they become available.",
    },
    {
      question: 'How do I report bugs or suggest features?',
      answer:
        'You can contact us through our support page or send feedback directly through the extension. We actively review all feedback and regularly update Kuiqlee based on user suggestions.',
    },
    {
      question: 'Can I use Kuiqlee for commercial purposes?',
      answer:
        'Yes, our premium plans include commercial usage rights. Please review our terms of service for specific details about commercial usage and any restrictions.',
    },
  ];

  return (
    <PageLayout
      title='Frequently Asked Questions'
      description='Find answers to common questions about Kuiqlee'
    >
      <div className='space-y-6'>
        {faqs.map((faq, index) => (
          <div key={index} className='bg-white p-6 rounded-lg border border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900 mb-3'>{faq.question}</h3>
            <p className='text-gray-700 leading-relaxed'>{faq.answer}</p>
          </div>
        ))}

        <div className='bg-orange-50 border border-orange-200 p-6 rounded-lg mt-8'>
          <h3 className='text-lg font-semibold text-orange-900 mb-3'>Still have questions?</h3>
          <p className='text-orange-800 mb-4'>
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a
            href='/contact'
            className='inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors'
          >
            Contact Support
          </a>
        </div>
      </div>
    </PageLayout>
  );
};

export default FAQPage;
