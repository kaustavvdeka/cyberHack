import React from 'react';

function ScanHistory({ history = [], onClearHistory, onDeleteItem }) {
  if (history.length === 0) {
    return (
      <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mt-6">
        <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest mb-4">📜 Scan History</div>
        <div className="text-center py-8 text-gray-500 text-sm">
          No previous scans. Start a scan to see history.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mt-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest">
          📜 Scan History ({history.length})
        </div>
        <button 
          onClick={onClearHistory}
          className="bg-red-950/40 border border-red-900/60 hover:bg-red-900/40 text-red-400 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
        >
          Clear All
        </button>
      </div>
      
      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="grid grid-cols-[2fr_1fr_1fr_auto] sm:grid-cols-[3fr_1.5fr_1.5fr_auto] gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 items-center"
          >
            <div>
              <div className="text-cyber-accent font-bold text-sm truncate max-w-[150px] sm:max-w-xs" title={item.target}>
                {item.target}
              </div>
              <div className="text-gray-500 text-[10px] sm:text-xs mt-0.5">
                {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
              </div>
            </div>
            
            <div className="flex items-center">
              <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase ${
                item.riskScore >= 75 
                  ? 'bg-red-950/40 text-red-400 border border-red-500/30' 
                  : item.riskScore >= 50 
                    ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30' 
                    : item.riskScore >= 25 
                      ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-green-950/40 text-green-400 border border-green-500/30'
              }`}>
                Score: {item.riskScore || 0}
              </span>
            </div>
            
            <div className="text-cyber-textMain text-xs sm:text-sm">
              <span className="font-semibold text-cyber-accent">{item.findings}</span> findings
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => onDeleteItem(item.id)}
                className="text-red-400/70 hover:text-red-400 p-1.5 hover:bg-white/[0.05] rounded-md transition-all duration-200"
                title="Delete entry"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScanHistory;