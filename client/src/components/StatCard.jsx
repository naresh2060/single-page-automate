import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({ title, value, trend, trendUp = true, subtitle, icon: Icon, color = '#1877F2' }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div 
          className="stat-card-icon-box"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>
      
      <div className="stat-card-value">
        {value}
      </div>

      <div className="stat-card-footer">
        {trend && (
          <span className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </span>
        )}
        <span>{subtitle}</span>
      </div>
    </div>
  );
};
