import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';

const severityColors = {
  critical: '#ff4444',
  high: '#ff8800',
  medium: '#ffbb33',
  low: '#00C851',
  info: '#33b5e5'
};

function StatisticsPanel({ stats = {}, findings = [] }) {
  // Prepare chart data
  const severityData = [
    { name: 'Critical', value: stats.critical || 0, fill: severityColors.critical },
    { name: 'High', value: stats.high || 0, fill: severityColors.high },
    { name: 'Medium', value: stats.medium || 0, fill: severityColors.medium },
    { name: 'Low', value: stats.low || 0, fill: severityColors.low },
    { name: 'Info', value: stats.info || 0, fill: severityColors.info },
  ];

  // Category data
  const categoryData = stats.by_category 
    ? Object.entries(stats.by_category).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    : [];

  // Tool data
  const toolData = stats.by_tool
    ? Object.entries(stats.by_tool).map(([name, value]) => ({ name, value }))
    : [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#141424] border border-cyber-accent/40 rounded-lg p-3 text-xs font-mono">
          <p className="font-bold text-cyber-textMain">{payload[0].name || label}</p>
          <p className="text-cyber-accent mt-1">
            {payload[0].value} findings
          </p>
        </div>
      );
    }
    return null;
  };

  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mt-6">
        <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest mb-4">📈 Metrics Charts</div>
        <p className="text-center text-gray-500 py-12 text-sm">
          No data available. Start a scan to see statistics.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mt-6">
      <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest mb-6">📈 Metrics Analytics</div>
      
      {/* Summary grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] text-center">
          <div className="text-2xl font-extrabold text-cyber-accent">
            {stats.total || 0}
          </div>
          <div className="text-[10px] text-cyber-textMuted uppercase font-semibold mt-1">Total Issues</div>
        </div>
        
        <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] text-center">
          <div className="text-2xl font-extrabold text-red-500">
            {stats.critical || 0}
          </div>
          <div className="text-[10px] text-cyber-textMuted uppercase font-semibold mt-1">Criticals</div>
        </div>
        
        <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] text-center">
          <div className="text-2xl font-extrabold text-orange-400">
            {(stats.high || 0) + (stats.critical || 0)}
          </div>
          <div className="text-[10px] text-cyber-textMuted uppercase font-semibold mt-1">High Priority</div>
        </div>
        
        <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] text-center">
          <div className="text-2xl font-extrabold text-cyan-400">
            {Object.keys(stats.by_tool || {}).length}
          </div>
          <div className="text-[10px] text-cyber-textMuted uppercase font-semibold mt-1">Modules Run</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Severity bar chart */}
        {severityData.some(d => d.value > 0) && (
          <div className="bg-black/20 p-4 rounded-lg border border-white/[0.02]">
            <h4 className="text-xs font-bold text-cyber-textMuted uppercase tracking-widest mb-4">Issues by Severity</h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="value" name="Findings" radius={[4, 4, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Findings by category */}
        {categoryData.length > 0 && (
          <div className="bg-black/20 p-4 rounded-lg border border-white/[0.02]">
            <h4 className="text-xs font-bold text-cyber-textMuted uppercase tracking-widest mb-4">Issues by Category</h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#666" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" stroke="#666" width={110} tick={{ fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="value" fill="#e94560" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Findings by tool */}
      {toolData.length > 0 && (
        <div className="mt-8 bg-black/20 p-4 rounded-lg border border-white/[0.02]">
          <h4 className="text-xs font-bold text-cyber-textMuted uppercase tracking-widest mb-4">Issues by Tool Module</h4>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 10 }} />
                <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" fill="#33b5e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticsPanel;