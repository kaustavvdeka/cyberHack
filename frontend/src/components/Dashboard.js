import React, { useState, useEffect } from 'react';

const availableTools = [
  { id: 'nmap', name: 'Nmap', category: 'Recon' },
  { id: 'whatweb', name: 'WhatWeb', category: 'Recon' },
  { id: 'gobuster', name: 'Gobuster', category: 'Recon' },
  { id: 'headers_check', name: 'Headers Check', category: 'Scanner' },
  { id: 'nikto', name: 'Nikto', category: 'Scanner' },
  { id: 'sqlmap', name: 'SQLMap', category: 'Exploit' },
  { id: 'xss_scanner', name: 'XSS Scanner', category: 'Exploit' },
];

function Dashboard({ stats = {}, isScanning = false, phase = 'idle' }) {
  const [animatedStats, setAnimatedStats] = useState({});

  useEffect(() => {
    if (stats && Object.keys(stats).length > 0) {
      const animation = setInterval(() => {
        setAnimatedStats(prev => {
          const newStats = {};
          Object.keys(stats).forEach(key => {
            if (typeof stats[key] === 'number') {
              newStats[key] = prev[key] !== undefined 
                ? prev[key] + (stats[key] - prev[key]) * 0.3 
                : stats[key];
            } else {
              newStats[key] = stats[key];
            }
          });
          return newStats;
        });
      }, 50);

      return () => clearInterval(animation);
    } else {
      setAnimatedStats({});
    }
  }, [stats]);

  const getStatValue = (key) => {
    if (!animatedStats[key] && animatedStats[key] !== 0) return 0;
    return Math.round(animatedStats[key]) || 0;
  };

  // Determine progress percentage from phases
  const getProgressPercentage = () => {
    if (!isScanning && phase === 'complete') return 100;
    if (phase === 'stopped' || phase === 'error') return 100;
    if (phase === 'idle') return 0;
    
    // Map scanning steps to percentages
    const steps = { starting: 10, recon: 35, scanning: 65, attack: 85, report: 95 };
    return steps[phase] || 15;
  };

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Recon */}
        <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(233,69,96,0.15)] transition-all duration-300">
          <div className="text-cyber-accent text-sm font-semibold flex items-center gap-2 mb-2">
            🔍 Reconnaissance
          </div>
          <div className="text-3xl font-extrabold text-cyber-textMain">
            {getStatValue('open_ports') || 0}
          </div>
          <div className="text-cyber-textMuted text-xs mt-2">
            {isScanning && phase === 'recon' ? 'Discovering network ports...' : 'Open ports discovered'}
          </div>
        </div>

        {/* Card 2: Vulnerabilities */}
        <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(233,69,96,0.15)] transition-all duration-300">
          <div className="text-cyber-accent text-sm font-semibold flex items-center gap-2 mb-2">
            ⚠️ Vulnerabilities
          </div>
          <div className="text-3xl font-extrabold text-cyber-textMain">
            {getStatValue('total') || 0}
          </div>
          <div className="text-cyber-textMuted text-xs mt-2">
            Total security issues found
          </div>
        </div>

        {/* Card 3: Risk Level */}
        <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(233,69,96,0.15)] transition-all duration-300">
          <div className="text-cyber-accent text-sm font-semibold flex items-center gap-2 mb-2">
            🎯 Risk Level
          </div>
          <div className={`text-2xl font-extrabold transition-colors duration-500 ${
            getStatValue('critical') > 0 || getStatValue('high') > 0 
              ? 'text-red-500' 
              : getStatValue('medium') > 0 
                ? 'text-yellow-500' 
                : getStatValue('low') > 0 
                  ? 'text-green-500' 
                  : isScanning ? 'text-cyber-textMain animate-pulse' : 'text-blue-400'
          }`}>
            {getStatValue('critical') > 0 ? 'CRITICAL' : 
             getStatValue('high') > 0 ? 'HIGH' : 
             getStatValue('medium') > 0 ? 'MEDIUM' : 
             getStatValue('low') > 0 ? 'LOW' : 
             isScanning ? 'EVALUATING' : 'NONE'}
          </div>
          <div className="text-cyber-textMuted text-xs mt-2">
            Overall risk profile status
          </div>
        </div>

        {/* Card 4: Progress */}
        <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(233,69,96,0.15)] transition-all duration-300">
          <div className="text-cyber-accent text-sm font-semibold flex items-center gap-2 mb-2">
            📊 Pipeline Progress
          </div>
          <div className="text-3xl font-extrabold text-cyber-textMain">
            {phase === 'idle' ? '0%' : `${getProgressPercentage()}%`}
          </div>
          <div className="w-full bg-gray-950 h-1.5 rounded-full mt-3 overflow-hidden border border-white/[0.03]">
            <div 
              className="h-full bg-gradient-to-r from-cyber-accent to-pink-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(233,69,96,0.4)]"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Available Tools Indicators Grid */}
      <div className="mt-8">
        <h3 className="text-cyber-textMuted font-bold text-xs uppercase tracking-widest mb-4">
          Scan Modules Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {availableTools.map((tool) => {
            // Check if tool is active/completed
            const isToolActive = isScanning && phase !== 'idle';
            return (
              <div 
                key={tool.id} 
                className="p-3 rounded-lg bg-[#141424] border border-white/[0.02] flex justify-between items-center hover:border-cyber-accent/30 transition-all duration-300"
              >
                <div className="flex flex-col">
                  <span className="text-cyber-textMain font-bold text-xs truncate max-w-[90px]">{tool.name}</span>
                  <span className="text-[9px] text-gray-500 font-semibold">{tool.category}</span>
                </div>
                <span className="flex items-center">
                  <span className={`w-2 h-2 rounded-full shadow-lg transition-all duration-500 ${
                    isToolActive 
                      ? 'bg-yellow-400 shadow-yellow-400/40 animate-pulse' 
                      : 'bg-green-500 shadow-green-500/40'
                  }`} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isScanning && (
        <div className="text-center py-4 mt-6 text-cyber-accent text-xs font-bold uppercase tracking-widest bg-cyber-accent/5 rounded-lg border border-cyber-accent/15 animate-pulse">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyber-accent mr-2 animate-ping" />
          Scanner Active • Pipeline stage: {phase}
        </div>
      )}
    </div>
  );
}

export default Dashboard;