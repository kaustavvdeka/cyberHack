import React, { useState, useEffect } from 'react';
import SeverityBadge from './SeverityBadge';

function RemediationChecklist({ findings = [] }) {
  const [checkedIds, setCheckedIds] = useState([]);

  // Reset checked list when findings change
  useEffect(() => {
    setCheckedIds([]);
  }, [findings]);

  if (findings.length === 0) {
    return (
      <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mt-6">
        <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest mb-4">🛡️ Remediation Plan</div>
        <p className="text-center text-gray-500 py-12 text-sm">
          No vulnerabilities found. Remediation list is empty.
        </p>
      </div>
    );
  }

  const toggleCheck = (id) => {
    if (checkedIds.includes(id)) {
      setCheckedIds(checkedIds.filter(item => item !== id));
    } else {
      setCheckedIds([...checkedIds, id]);
    }
  };

  const percentage = Math.round((checkedIds.length / findings.length) * 100) || 0;

  return (
    <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mt-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-cyber-cardBorder/40">
        <div>
          <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest mb-1">🛡️ Remediation Checklist</div>
          <p className="text-xs text-gray-500">Track implementation progress of security recommendations.</p>
        </div>
        
        {/* Progress gauge */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:w-36 bg-gray-950 h-2 rounded-full overflow-hidden border border-white/[0.03]">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500" 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-green-400 whitespace-nowrap">
            {percentage}% Fixed ({checkedIds.length}/{findings.length})
          </span>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="flex flex-col gap-3">
        {findings.map((finding) => {
          const isChecked = checkedIds.includes(finding.id);
          return (
            <div 
              key={finding.id}
              onClick={() => toggleCheck(finding.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer select-none transition-all duration-300 ${
                isChecked 
                  ? 'bg-green-950/10 border-green-500/30 opacity-70' 
                  : 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.03] hover:border-cyber-accent/40'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {}} // handled by div click
                className="mt-1 rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 accent-green-500 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase ${isChecked ? 'text-green-500 line-through' : 'text-cyber-textMain'}`}>
                    {finding.title}
                  </span>
                  <SeverityBadge severity={finding.severity} size="small" />
                  <span className="text-[9px] bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded text-gray-500 font-mono">
                    {finding.tool}
                  </span>
                </div>
                <p className={`text-xs ${isChecked ? 'text-gray-600 line-through' : 'text-cyber-textMuted'} leading-relaxed mb-2`}>
                  {finding.description}
                </p>
                <div className={`p-2.5 rounded-lg border text-xs font-mono leading-relaxed ${
                  isChecked 
                    ? 'bg-green-950/5 border-green-500/10 text-green-600/70' 
                    : 'bg-green-950/10 border-green-500/20 text-green-400'
                }`}>
                  <strong className="text-[10px] font-bold uppercase tracking-wider block mb-1">Recommendation:</strong>
                  {finding.recommendation}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RemediationChecklist;
