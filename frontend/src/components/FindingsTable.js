import React, { useState } from 'react';
import SeverityBadge from './SeverityBadge';

function FindingsTable({ findings = [] }) {
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const sortedFindings = [...findings].sort((a, b) => {
    const severityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    return severityOrder[b.severity.toLowerCase()] - severityOrder[a.severity.toLowerCase()];
  });

  const handleCopyEvidence = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mt-6">
      <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest mb-4">
        Discovered Findings ({findings.length})
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-white/[0.04] bg-[#0c0c16]">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-cyber-cardBorder/40 bg-white/[0.01]">
              <th className="p-3 font-semibold text-cyber-accent text-xs uppercase tracking-wider">Severity</th>
              <th className="p-3 font-semibold text-cyber-accent text-xs uppercase tracking-wider">Tool</th>
              <th className="p-3 font-semibold text-cyber-accent text-xs uppercase tracking-wider">Category</th>
              <th className="p-3 font-semibold text-cyber-accent text-xs uppercase tracking-wider">Vulnerability Title</th>
              <th className="p-3 font-semibold text-cyber-accent text-xs uppercase tracking-wider hidden md:table-cell">Brief Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {sortedFindings.map((finding) => (
              <tr 
                key={finding.id} 
                onClick={() => setSelectedFinding(finding)}
                className="cursor-pointer hover:bg-white/[0.03] active:bg-white/[0.05] transition-all duration-150"
              >
                <td className="p-3 whitespace-nowrap">
                  <SeverityBadge severity={finding.severity} size="small" />
                </td>
                <td className="p-3 text-cyber-textMain font-mono font-semibold whitespace-nowrap">{finding.tool}</td>
                <td className="p-3 text-cyber-textMuted whitespace-nowrap">{finding.category.replace(/_/g, ' ')}</td>
                <td className="p-3 text-cyber-textMain font-bold truncate max-w-[150px] sm:max-w-xs">{finding.title}</td>
                <td className="p-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                  {finding.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {findings.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          No vulnerabilities found on target.
        </div>
      )}

      {/* Vulnerability Detailed Modal Dialog Overlay */}
      {selectedFinding && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fadeIn">
          <div className="bg-[#141424] border border-cyber-cardBorder/60 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative flex flex-col gap-5">
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={selectedFinding.severity} size="medium" />
                  <span className="text-[10px] bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded text-gray-400 font-mono">
                    Module: {selectedFinding.tool}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-cyber-textMain leading-snug">
                  {selectedFinding.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedFinding(null)}
                className="text-gray-500 hover:text-cyber-textMain text-xl p-1 rounded hover:bg-white/[0.05] transition"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              <div>
                <h4 className="text-xs uppercase font-bold tracking-widest text-cyber-accent mb-1.5">Description</h4>
                <p className="text-cyber-textMain text-sm leading-relaxed bg-[#0c0c16]/50 border border-white/[0.02] p-3 rounded-lg">
                  {selectedFinding.description}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-cyber-accent">Proof of Concept / Evidence</h4>
                  <button 
                    onClick={() => handleCopyEvidence(selectedFinding.evidence)}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copySuccess ? 'Copied! ✅' : 'Copy Evidence 📋'}
                  </button>
                </div>
                <pre className="bg-black/80 border border-white/[0.03] p-4 rounded-lg font-mono text-xs text-green-400 whitespace-pre-wrap break-all max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                  {selectedFinding.evidence}
                </pre>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold tracking-widest text-cyber-accent mb-1.5">Remediation Guidelines</h4>
                <p className="text-cyber-textMain text-sm leading-relaxed border border-green-500/20 bg-green-950/10 p-3 rounded-lg">
                  {selectedFinding.recommendation}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-cyber-cardBorder/40 pt-4 flex justify-between items-center text-[10px] sm:text-xs text-gray-500 font-mono">
              <span>Timestamp: {new Date(selectedFinding.timestamp).toLocaleString()}</span>
              <button 
                onClick={() => setSelectedFinding(null)}
                className="px-4 py-2 bg-cyber-accent hover:bg-cyber-accentHover text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyber-accent/20 active:scale-95 transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FindingsTable;