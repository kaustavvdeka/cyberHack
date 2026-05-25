import React from 'react';

const phases = [
  { key: 'starting', label: 'Initializing', icon: '⚡' },
  { key: 'recon', label: 'Reconnaissance', icon: '🔍' },
  { key: 'scanning', label: 'Vulnerability Scan', icon: '🔬' },
  { key: 'attack', label: 'Targeted Attacks', icon: '🎯' },
  { key: 'report', label: 'Report Generation', icon: '📊' },
  { key: 'complete', label: 'Complete', icon: '✅' },
  { key: 'error', label: 'Error', icon: '❌' },
  { key: 'stopped', label: 'Stopped', icon: '⏸️' },
];

function PhaseIndicator({ phase, target }) {
  const currentIndex = phases.findIndex(p => p.key === phase);
  
  const activePipelinePhases = ['starting', 'recon', 'scanning', 'attack', 'report'];
  const stepIndex = activePipelinePhases.indexOf(phase);
  
  let progress = 0;
  if (phase === 'complete') progress = 100;
  else if (phase === 'error' || phase === 'stopped') progress = 100;
  else if (stepIndex >= 0) progress = ((stepIndex + 1) / activePipelinePhases.length) * 100;

  return (
    <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div>
          <span className="text-cyber-textMuted text-xs font-semibold uppercase tracking-wider">Target Host </span>
          <div className="text-cyber-accent font-bold text-base sm:text-lg break-all select-all font-mono">
            {target}
          </div>
        </div>
        {phases[currentIndex] && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyber-accent/10 border border-cyber-accent/20 text-cyber-accent text-xs font-bold uppercase tracking-wider">
            <span className="blink">{phases[currentIndex].icon}</span>
            <span>{phases[currentIndex].label}</span>
          </div>
        )}
      </div>

      {/* Progress bar container */}
      <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-white/[0.03]">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            phase === 'error' 
              ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
              : phase === 'stopped' 
                ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                : 'bg-gradient-to-r from-cyber-accent to-pink-500 shadow-[0_0_12px_rgba(233,69,96,0.6)]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Phase badges list */}
      <div className="flex flex-wrap gap-2 mt-5">
        {phases.map((p, idx) => {
          const isPastOrCurrent = idx <= currentIndex;
          const isActive = p.key === phase;
          
          // Don't render error/stopped badges if we are in normal execution
          if ((p.key === 'error' || p.key === 'stopped') && p.key !== phase) return null;
          
          return (
            <div
              key={p.key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                isActive 
                  ? 'bg-cyber-accent/20 text-cyber-accent border-cyber-accent/60 shadow-[0_0_8px_rgba(233,69,96,0.2)] scale-105' 
                  : isPastOrCurrent
                    ? 'bg-cyber-accent/5 text-cyber-accent/70 border-cyber-accent/20'
                    : 'bg-white/[0.01] text-gray-600 border-white/[0.02]'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PhaseIndicator;