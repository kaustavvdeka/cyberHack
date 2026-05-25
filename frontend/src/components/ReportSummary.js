import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  critical: '#ff4444',
  high: '#ff8800',
  medium: '#ffbb33',
  low: '#00C851',
  info: '#33b5e5',
};

function ReportSummary({ findings = [], stats = {}, riskScore = 0, target = '' }) {
  const chartData = [
    { name: 'Critical', value: stats.critical || 0 },
    { name: 'High', value: stats.high || 0 },
    { name: 'Medium', value: stats.medium || 0 },
    { name: 'Low', value: stats.low || 0 },
    { name: 'Info', value: stats.info || 0 },
  ].filter(item => item.value > 0);

  const handleExport = () => {
    const report = {
      target,
      scanDate: new Date().toISOString(),
      riskScore,
      stats,
      findings: findings.map(f => ({
        severity: f.severity,
        tool: f.tool,
        category: f.category,
        title: f.title,
        description: f.description,
        recommendation: f.recommendation,
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pentest-report-${target.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mt-6">
      <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest mb-6">📊 Report Summary</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Pie Chart Box */}
        <div className="h-[260px] w-full flex items-center justify-center bg-black/25 rounded-lg border border-white/[0.02]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#141424', 
                    border: '1px solid rgba(233, 69, 96, 0.4)',
                    borderRadius: '8px',
                    color: '#e0e0e0',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#a0a0b0' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-600 text-xs font-mono uppercase">Waiting for findings...</div>
          )}
        </div>
        
        {/* Statistics list */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
            <span className="text-xs sm:text-sm text-cyber-textMuted">Total Vulnerabilities</span>
            <span className="text-sm font-extrabold text-cyber-accent">{stats.total || 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
            <span className="text-xs sm:text-sm text-cyber-textMuted">Overall Threat Score</span>
            <span className="text-sm font-extrabold text-orange-400">{riskScore}/100</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
            <span className="text-xs sm:text-sm text-cyber-textMuted">Scan Target Host</span>
            <span className="text-xs sm:text-sm font-bold text-cyan-400 truncate max-w-[160px] sm:max-w-[200px]" title={target}>
              {target}
            </span>
          </div>
          
          {stats.by_category && Object.entries(stats.by_category).length > 0 && (
            <div className="mt-2">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-cyber-accent mb-2">Findings categories</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.by_category).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center p-2 bg-white/[0.01] border border-white/[0.03] rounded-lg text-xs">
                    <span className="text-gray-500 capitalize truncate max-w-[100px]">{category.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-cyber-textMain">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex flex-wrap gap-3">
        <button 
          onClick={handleExport}
          className="bg-gradient-to-r from-cyber-accent to-pink-700 hover:from-cyber-accentHover hover:to-pink-600 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-lg transition duration-200 active:scale-95 shadow-md shadow-cyber-accent/15"
        >
          📥 Quick Export (JSON)
        </button>
      </div>
    </div>
  );
}

export default ReportSummary;