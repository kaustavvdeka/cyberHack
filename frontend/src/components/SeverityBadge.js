import React from 'react';

const severityConfig = {
  critical: {
    colorClasses: 'text-red-400 bg-red-950/40 border-red-500/50',
    icon: '🔴',
    label: 'CRITICAL'
  },
  high: {
    colorClasses: 'text-orange-400 bg-orange-950/40 border-orange-500/50',
    icon: '🟠',
    label: 'HIGH'
  },
  medium: {
    colorClasses: 'text-yellow-400 bg-yellow-950/40 border-yellow-500/50',
    icon: '🟡',
    label: 'MEDIUM'
  },
  low: {
    colorClasses: 'text-green-400 bg-green-950/40 border-green-500/50',
    icon: '🟢',
    label: 'LOW'
  },
  info: {
    colorClasses: 'text-blue-400 bg-blue-950/40 border-blue-500/50',
    icon: '🔵',
    label: 'INFO'
  }
};

function SeverityBadge({ severity = 'info', showIcon = true, showLabel = true, size = 'small' }) {
  const config = severityConfig[severity.toLowerCase()] || severityConfig.info;
  
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-1 text-xs',
    large: 'px-3.5 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wider transition-all duration-300 ${config.colorClasses} ${sizeClasses[size]}`}>
      {showIcon && <span>{config.icon}</span>}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export default SeverityBadge;