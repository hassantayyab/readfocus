'use client';

import { DailyStats } from '@/types';

interface DailyChartProps {
  data: DailyStats[];
  metric: 'readingTime' | 'xpEarned' | 'comprehensionAccuracy' | 'focusScore';
  title: string;
  color?: string;
}

const DailyChart: React.FC<DailyChartProps> = ({ data, metric, title, color = 'bg-blue-500' }) => {
  const maxValue = Math.max(...data.map((d) => d[metric]), 1);

  const formatValue = (value: number) => {
    if (metric === 'readingTime') {
      const minutes = Math.floor(value / 60);
      return `${minutes}m`;
    }
    if (metric === 'comprehensionAccuracy' || metric === 'focusScore') {
      return `${value}%`;
    }
    return value.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <h3 className="mb-6 text-lg font-semibold text-gray-800">{title}</h3>

      <div className="space-y-4">
        {/* Chart */}
        <div className="flex h-32 items-end justify-between space-x-2">
          {data.map((day, index) => {
            const height = maxValue > 0 ? (day[metric] / maxValue) * 100 : 0;
            const isToday = index === data.length - 1;

            return (
              <div key={day.date} className="flex flex-1 flex-col items-center">
                <div className="group relative flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 hover:opacity-80 ${
                      isToday ? 'bg-blue-600' : color
                    } ${day[metric] === 0 ? 'bg-gray-200' : ''}`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {formatValue(day[metric])}
                    </div>
                  </div>
                </div>

                {/* Date label */}
                <div className="mt-2 text-xs font-medium text-gray-500">{formatDate(day.date)}</div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Past 7 days</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className={`h-3 w-3 rounded ${color}`}></div>
              <span>Previous days</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 rounded bg-blue-600"></div>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChart;
