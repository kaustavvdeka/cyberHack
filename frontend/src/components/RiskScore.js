import React from 'react';

function getScoreColor(score) {
  if (score >= 75) return { text: 'text-red-500', bg: 'bg-red-950/20', border: 'border-red-500/50', shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]' };
  if (score >= 50) return { text: 'text-orange-500', bg: 'bg-orange-950/20', border: 'border-orange-500/50', shadow: 'shadow-[0_0_20px_rgba(249,115,22,0.25)]' };
  if (score >= 25) return { text: 'text-yellow-500', bg: 'bg-yellow-950/20', border: 'border-yellow-500/50', shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.25)]' };
  if (score > 0) return { text: 'text-green-500', bg: 'bg-green-950/20', border: 'border-green-500/50', shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.25)]' };
  return { text: 'text-blue-400', bg: 'bg-blue-950/20', border: 'border-blue-500/30', shadow: 'shadow-none' };
}

function getRiskLabel(score) {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  if (score > 0) return 'LOW';
  return 'NONE';
}

function RiskScore({ score = 0, stats = {}, isScanning }) {
  const { text, bg, border, shadow } = getScoreColor(score);
  const riskLabel = getRiskLabel(score);

  return (
    <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 flex flex-col justify-between items-center text-center h-full">
      <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest mb-4">Risk Assessment</div>
      
      {isScanning ? (
        <div className="flex flex-col items-center justify-center my-6">
          <div className="w-28 h-28 rounded-full flex items-center justify-center border-4 border-cyber-accent/50 bg-cyber-accent/10 shadow-[0_0_15px_rgba(233,69,96,0.3)] animate-pulse">
            <span className="text-cyber-accent text-xs font-bold tracking-widest blink">SCANNING</span>
          </div>
          <div className="text-cyber-accent font-bold text-xs uppercase tracking-widest mt-4">
            Evaluating Threats...
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center my-6">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 ${border} ${bg} ${shadow} transition-all duration-1000`}>
            <span className={`text-4xl font-extrabold ${text}`}>{score || 0}</span>
          </div>
          
          <div className={`text-xs font-bold uppercase tracking-widest mt-4 ${text}`}>
            {riskLabel} Threat Severity
          </div>
        </div>
      )}

      {stats && Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          <div className="p-2 rounded-lg bg-red-950/20 border border-red-500/10">
            <div className="text-red-500 font-extrabold text-sm sm:text-base">{stats.critical || 0}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-semibold">Critical</div>
          </div>
          <div className="p-2 rounded-lg bg-orange-950/20 border border-orange-500/10">
            <div className="text-orange-500 font-extrabold text-sm sm:text-base">{stats.high || 0}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-semibold">High</div>
          </div>
          <div className="p-2 rounded-lg bg-yellow-950/20 border border-yellow-500/10">
            <div className="text-yellow-500 font-extrabold text-sm sm:text-base">{stats.medium || 0}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-semibold">Medium</div>
          </div>
          <div className="p-2 rounded-lg bg-green-950/20 border border-green-500/10">
            <div className="text-green-500 font-extrabold text-sm sm:text-base">{stats.low || 0}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-semibold">Low</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-950/20 border border-blue-500/10">
            <div className="text-blue-500 font-extrabold text-sm sm:text-base">{stats.info || 0}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-semibold">Info</div>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="text-cyber-textMain font-extrabold text-sm sm:text-base">{stats.total || 0}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-semibold">Total</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskScore;