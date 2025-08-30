'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  trend,
}) => {
  const variantStyles = {
    default: 'from-gray-50 to-gray-100 border-gray-200',
    success: 'from-green-50 to-green-100 border-green-200',
    warning: 'from-orange-50 to-orange-100 border-orange-200',
    info: 'from-blue-50 to-blue-100 border-blue-200',
  };

  const iconColors = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-orange-600',
    info: 'text-blue-600',
  };

  return (
    <div
      className={`bg-gradient-to-br ${variantStyles[variant]} rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3 flex items-center space-x-3">
            <div className={`text-2xl ${iconColors[variant]}`}>{icon}</div>
            <h3 className="text-sm font-medium tracking-wide text-gray-600 uppercase">{title}</h3>
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        {trend && (
          <div
            className={`flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium ${
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            <span className="text-xs">{trend.isPositive ? '↗' : '↘'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
