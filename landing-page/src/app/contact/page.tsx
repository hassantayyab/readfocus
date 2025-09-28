import { Metadata } from 'next';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us - Kuiqlee',
  description:
    'Get in touch with the Kuiqlee team for support, feedback, or partnership inquiries.',
};

const ContactPage = () => {
  return <ContactForm />;
};

export default ContactPage;