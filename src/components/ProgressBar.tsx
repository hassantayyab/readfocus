'use client';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  label,
  showPercentage = true,
  variant = 'default',
  size = 'md',
}) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  const variantStyles = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    info: 'bg-indigo-500',
  };

  const sizeStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className={`mb-2 flex items-center justify-between ${textSize[size]}`}>
          {label && <span className="font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-gray-500">
              {current.toLocaleString()} / {max.toLocaleString()} ({Math.round(percentage)}%)
            </span>
          )}
        </div>
      )}

      <div className={`w-full overflow-hidden rounded-full bg-gray-200 ${sizeStyles[size]}`}>
        <div
          className={`${variantStyles[variant]} ${sizeStyles[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
