'use client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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
  ...props
}: ButtonProps) => {
  const baseClasses =
    'font-semibold transition-all cursor-pointer border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black';

  const variants = {
    primary: 'text-white hover:shadow-xl' + ` bg-[#28222c] hover:bg-[#1f1a22]`,
    secondary:
      'text-white border border-gray-600 hover:border-gray-500' +
      ` bg-[#28222c] hover:bg-[#1f1a22]`,
    outline:
      'border-2 border-gray-600 hover:border-[#f75c30] bg-transparent hover:bg-orange-50' +
      ` text-[#0d1221] hover:text-[#f75c30]`,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-2 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-lg',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        disabled && disabledClasses,
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      type={type}
      style={style}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
