'use client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  href?: string;
  target?: string;
  rel?: string;
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button',
  style,
  href,
  target,
  rel,
  ...props
}: ButtonProps) => {
  const baseClasses =
    'font-semibold transition-colors duration-200 cursor-pointer border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black inline-block text-center';

  const variants = {
    primary: 'text-white hover:shadow bg-gray-800 hover:bg-gray-900',
    secondary:
      'text-white border border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-900',
    outline:
      'border-2 border-gray-600 hover:border-orange-500 bg-transparent hover:bg-background text-gray-900 hover:text-orange-500',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-2 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-lg',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';

  const combinedClassName = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    disabled && disabledClasses,
    className,
  );

  // If href is provided, render as a link
  if (href) {
    // External link
    if (href.startsWith('http')) {
      return (
        <a
          href={href}
          target={target || '_blank'}
          rel={rel || 'noopener noreferrer'}
          className={combinedClassName}
          style={style}
          {...props}
        >
          {children}
        </a>
      );
    }
    // Internal link
    return (
      <Link href={href} className={combinedClassName} style={style} {...props}>
        {children}
      </Link>
    );
  }

  // Render as button
  return (
    <button
      className={combinedClassName}
      onClick={onClick}
      disabled={disabled}
      type={type}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
