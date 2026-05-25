import React, { useState } from 'react';

const availableToolsList = [
  { id: 'nmap', label: 'Nmap (Port Scan)', category: 'Recon' },
  { id: 'whatweb', label: 'WhatWeb (Tech Fingerprint)', category: 'Recon' },
  { id: 'gobuster', label: 'Gobuster (Dir Discovery)', category: 'Recon' },
  { id: 'headers_check', label: 'Headers Check (HTTP Headers)', category: 'Scanning' },
  { id: 'nikto', label: 'Nikto (Vulnerabilities)', category: 'Scanning' },
  { id: 'sqlmap', label: 'SQLMap (SQL Injection)', category: 'Exploit' },
  { id: 'xss_scanner', label: 'XSS Scanner (XSS Test)', category: 'Exploit' },
];

function TargetInput({ onStartScan, onStopScan, isScanning }) {
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');
  const [simulation, setSimulation] = useState(true);
  const [selectedTools, setSelectedTools] = useState(
    availableToolsList.map(tool => tool.id)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!target.trim()) {
      setError('Please enter a target URL');
      return;
    }

    if (selectedTools.length === 0) {
      setError('Please select at least one security tool to run');
      return;
    }

    let url = target.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      new URL(url);
      setError('');
      // Send target, simulation state, and selected tools list to parent App.js
      onStartScan(url, { simulation, tools: selectedTools });
    } catch {
      setError('Invalid URL format');
    }
  };

  const toggleTool = (toolId) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter(id => id !== toolId));
    } else {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  const selectAllTools = () => {
    setSelectedTools(availableToolsList.map(t => t.id));
  };

  const selectNoneTools = () => {
    setSelectedTools([]);
  };

  return (
    <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mb-6 pulse-border-accent">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setError('');
            }}
            placeholder="Enter target URL (e.g., example.com)"
            className={`w-full px-4 py-3 rounded-lg border bg-[#0f0f1a] text-cyber-textMain placeholder-gray-600 focus:outline-none focus:ring-2 transition-all duration-300 ${
              error 
                ? 'border-red-500 focus:ring-red-500/50' 
                : 'border-cyber-accent/30 focus:border-cyber-accent focus:ring-cyber-accent/30'
            }`}
            disabled={isScanning}
          />
          {error && (
            <p className="text-red-500 text-xs font-semibold mt-1.5 absolute -bottom-5 left-1">{error}</p>
          )}
        </div>
        
        {isScanning ? (
          <button
            type="button"
            onClick={onStopScan}
            className="px-6 py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all duration-200"
          >
            ⏹ Stop Scan
          </button>
        ) : (
          <button
            type="submit"
            className="px-6 py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-cyber-accent to-pink-700 hover:from-cyber-accentHover hover:to-pink-600 text-white shadow-lg hover:shadow-cyber-accent/20 active:scale-95 transition-all duration-200"
          >
            ▶ Start Scan
          </button>
        )}
      </form>
      
      <div className="mt-6 border-t border-cyber-cardBorder/40 pt-4">
        {/* Advanced Settings Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-cyber-textMain">🛠️ Scan Pipeline Setup</span>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={selectAllTools} 
                className="text-[10px] text-cyber-accent hover:text-cyber-accentHover font-semibold bg-cyber-accent/10 hover:bg-cyber-accent/20 px-2 py-0.5 rounded transition"
                disabled={isScanning}
              >
                All
              </button>
              <button 
                type="button"
                onClick={selectNoneTools} 
                className="text-[10px] text-gray-500 hover:text-gray-400 font-semibold bg-gray-500/10 hover:bg-gray-500/20 px-2 py-0.5 rounded transition"
                disabled={isScanning}
              >
                Clear
              </button>
            </div>
          </div>
          
          {/* Simulation mode sliding toggle */}
          <label className="inline-flex items-center cursor-pointer select-none">
            <span className="mr-3 text-xs font-bold uppercase tracking-wider text-cyber-textMuted">
              Simulation Mode
            </span>
            <div className="relative">
              <input 
                type="checkbox" 
                checked={simulation} 
                onChange={(e) => setSimulation(e.target.checked)}
                className="sr-only peer"
                disabled={isScanning}
              />
              <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyber-accent/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-accent peer-checked:after:bg-white"></div>
            </div>
          </label>
        </div>
        
        {/* Tool checklist grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {availableToolsList.map((tool) => {
            const isChecked = selectedTools.includes(tool.id);
            return (
              <div 
                key={tool.id}
                onClick={() => !isScanning && toggleTool(tool.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all duration-200 ${
                  isChecked 
                    ? 'bg-cyber-accent/10 border-cyber-accent/50 text-cyber-accent font-semibold' 
                    : 'bg-white/[0.01] border-white/[0.04] text-cyber-textMuted hover:bg-white/[0.02] hover:text-cyber-textMain'
                } ${isScanning ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // handled by div click
                  className="rounded border-gray-700 bg-gray-900 text-cyber-accent focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-cyber-accent cursor-pointer"
                  disabled={isScanning}
                />
                <div className="flex flex-col">
                  <span>{tool.label}</span>
                  <span className="text-[9px] text-gray-500 font-normal">{tool.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <p className="text-cyber-textMuted text-[10px] sm:text-xs mt-4 text-center">
        ⚡ Enter a target and select scan components. Enable **Simulation Mode** to instantly explore results without tools installed.
      </p>
    </div>
  );
}

export default TargetInput;