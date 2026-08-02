import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsCard = ({ icon, label, value, trend, trendValue }) => {
  const getTrendColor = () => {
    if (!trend) return 'text-gray-400';
    return trend === 'up' ? 'text-emerald-400' : 'text-red-400';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? 'TrendingUp' : 'TrendingDown';
  };

  return (
    <div className="bg-[#111827]/80 backdrop-blur-xl rounded-xl p-5 md:p-6 border border-[#1F2937] hover:border-indigo-500/40 transition-smooth shadow-xl group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-12 h-12 bg-indigo-600/15 border border-indigo-500/30 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-600/25 transition-smooth">
          <Icon name={icon} size={22} color="#818CF8" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 ${getTrendColor()}`}>
            <Icon name={getTrendIcon()} size={14} />
            <span className="text-xs font-semibold">{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl lg:text-4xl font-heading font-bold text-white mb-1.5 tracking-tight">
          {value || '0'}
        </p>
        <p className="text-sm font-medium text-gray-400">{label}</p>
      </div>
    </div>
  );
};

export default StatsCard;