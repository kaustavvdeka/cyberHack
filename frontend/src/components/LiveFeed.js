import React, { useEffect, useRef, useState } from 'react';

function getLogStyle(type) {
  switch(type) {
    case 'phase': return { text: 'text-pink-400 font-bold', icon: '📌' };
    case 'tool': return { text: 'text-cyan-400', icon: '🔧' };
    case 'success': return { text: 'text-green-400 font-semibold', icon: '✅' };
    case 'error': return { text: 'text-red-500 font-bold', icon: '❌' };
    case 'warning': return { text: 'text-amber-500', icon: '⚠️' };
    case 'info':
    default: return { text: 'text-gray-300', icon: '📡' };
  }
}

function LiveFeed({ logs = [], isScanning }) {
  const feedRef = useRef(null);
  const [filterText, setFilterText] = useState('');
  const [consoleLogs, setConsoleLogs] = useState([]);

  // Auto scroll to bottom of terminal
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [logs, consoleLogs]);

  // Keep logs locally so users can clear them on screen if they want
  useEffect(() => {
    setConsoleLogs(logs);
  }, [logs]);

  const handleClear = () => {
    setConsoleLogs([]);
  };

  const handleCopy = () => {
    const rawText = consoleLogs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(rawText);
  };

  const filteredLogs = consoleLogs.filter(log => 
    log.message.toLowerCase().includes(filterText.toLowerCase()) || 
    log.type.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 flex flex-col h-[400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
          📟 Security Console
          {isScanning && <span className="w-2.5 h-2.5 rounded-full bg-cyber-accent animate-ping duration-300 inline-block" />}
        </div>
        
        {/* Terminal Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter logs..."
            className="px-2.5 py-1 bg-black/50 border border-cyber-cardBorder/40 rounded text-[11px] text-cyber-textMain placeholder-gray-600 focus:outline-none focus:border-cyber-accent w-full sm:w-32"
          />
          <button 
            onClick={handleCopy}
            className="p-1 px-2 text-[10px] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.07] text-cyber-textMain rounded transition"
            title="Copy all logs"
            disabled={consoleLogs.length === 0}
          >
            Copy
          </button>
          <button 
            onClick={handleClear}
            className="p-1 px-2 text-[10px] bg-red-950/20 border border-red-500/10 hover:bg-red-950/40 text-red-400 rounded transition"
            title="Clear console window"
            disabled={consoleLogs.length === 0}
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* CLI Black Box */}
      <div className="flex-1 bg-black/70 border border-white/[0.02] rounded-lg p-4 overflow-y-auto font-mono text-[11px] sm:text-xs select-text shadow-inner" ref={feedRef}>
        {filteredLogs.length === 0 ? (
          <div className="text-gray-600 text-center py-16">
            {consoleLogs.length === 0 ? 'Initialize a scan to stream live diagnostic records...' : 'No logs matches filter'}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredLogs.map((log, index) => {
              const logStyle = getLogStyle(log.type);
              const time = new Date(log.timestamp).toLocaleTimeString();
              
              return (
                <div key={index} className="flex gap-2 items-start leading-relaxed break-all border-b border-white/[0.01] pb-1">
                  <span className="text-gray-600 select-none">{time}</span>
                  <span className="select-none">{logStyle.icon}</span>
                  <span className={logStyle.text}>{log.message}</span>
                </div>
              );
            })}
          </div>
        )}
        
        {isScanning && (
          <div className="mt-2 text-cyber-accent flex items-center gap-1 select-none">
            <span className="typing-cursor">▌</span>
            <span className="text-[10px] tracking-widest text-cyber-accent/80 animate-pulse font-sans font-bold">TUNNELING SECURE SOCKET...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveFeed;