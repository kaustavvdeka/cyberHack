import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import TargetInput from './components/TargetInput';
import Dashboard from './components/Dashboard';
import LiveFeed from './components/LiveFeed';
import FindingsTable from './components/FindingsTable';
import RiskScore from './components/RiskScore';
import PhaseIndicator from './components/PhaseIndicator';
import ReportSummary from './components/ReportSummary';
import StatisticsPanel from './components/StatisticsPanel';
import ExportReport from './components/ExportReport';
import ScanHistory from './components/ScanHistory';
import RemediationChecklist from './components/RemediationChecklist';

function App() {
  const [scanState, setScanState] = useState({
    isScanning: false,
    target: '',
    phase: 'idle',
    findings: [],
    stats: {},
    riskScore: 0,
    logs: [],
    completed: false,
    scanHistory: []
  });

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'remediation'

  const wsRef = useRef(null);

  const deleteHistoryItem = (id) => {
    const updatedHistory = (scanState.scanHistory || []).filter(item => item.id !== id);
    localStorage.setItem('pentest_scan_history', JSON.stringify(updatedHistory));
    setScanState(prev => ({ ...prev, scanHistory: updatedHistory }));
  };

  const clearAllHistory = () => {
    localStorage.removeItem('pentest_scan_history');
    setScanState(prev => ({ ...prev, scanHistory: [] }));
  };

  const connectWebSocket = useCallback((target, options = {}) => {
    // Determine WebSocket protocol/domain dynamically
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws/scan';
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      
      ws.send(JSON.stringify({
        action: 'start_scan',
        target: target,
        simulation: options.simulation || false,
        tools: options.tools || null
      }));

      setScanState(prev => ({
        ...prev,
        isScanning: true,
        target: target,
        phase: 'starting',
        completed: false,
        logs: [{
          timestamp: new Date().toISOString(),
          message: `Starting scan on ${target} (Simulation: ${options.simulation ? 'ON' : 'OFF'})`,
          type: 'info'
        }]
      }));
    };

    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);
      
      switch(response.type) {
        case 'scan_started':
          setScanState(prev => ({
            ...prev,
            phase: 'recon',
            logs: [...prev.logs, {
              timestamp: new Date().toISOString(),
              message: `Scan transaction initialized: ${response.data.scan_id}`,
              type: 'info'
            }]
          }));
          break;

        case 'phase_change':
          setScanState(prev => ({
            ...prev,
            phase: response.data.phase,
            logs: [...prev.logs, {
              timestamp: response.data.timestamp,
              message: response.data.message,
              type: 'phase'
            }]
          }));
          break;

        case 'tool_start':
          setScanState(prev => ({
            ...prev,
            logs: [...prev.logs, {
              timestamp: new Date().toISOString(),
              message: `Executing tool runner [${response.data.tool}]: ${response.data.message}`,
              type: 'tool'
            }]
          }));
          break;

        case 'tool_complete':
          const toolFindings = response.data.findings || 0;
          setScanState(prev => ({
            ...prev,
            logs: [...prev.logs, {
              timestamp: new Date().toISOString(),
              message: `Module execution [${response.data.tool}] completed. Found ${toolFindings} issues.`,
              type: 'success'
            }]
          }));
          break;

        case 'finding':
          setScanState(prev => ({
            ...prev,
            findings: [...prev.findings, response.data]
          }));
          break;

        case 'error':
          setScanState(prev => ({
            ...prev,
            logs: [...prev.logs, {
              timestamp: new Date().toISOString(),
              message: `Internal error [${response.data.tool || 'pipeline'}]: ${response.data.error}`,
              type: 'error'
            }]
          }));
          break;

        case 'complete':
          const completedData = response.data;
          setScanState(prev => {
            const newState = {
              ...prev,
              isScanning: false,
              completed: true,
              phase: 'complete',
              findings: completedData.findings || [],
              stats: completedData.stats || {},
              riskScore: completedData.risk_score || 0,
              logs: [...prev.logs, {
                timestamp: new Date().toISOString(),
                message: `Scan finished successfully. Found ${completedData.findings?.length || 0} issues. Overall threat score: ${completedData.risk_score}`,
                type: 'success'
              }]
            };
            
            // Add entry to localStorage history list
            const historyEntry = {
              id: Date.now().toString(),
              target: completedData.target,
              date: new Date().toISOString(),
              riskScore: completedData.risk_score,
              findings: completedData.findings?.length || 0,
              status: 'completed',
            };
            const updatedHistory = [historyEntry, ...(prev.scanHistory || []).slice(0, 9)];
            localStorage.setItem('pentest_scan_history', JSON.stringify(updatedHistory));
            
            return { ...newState, scanHistory: updatedHistory };
          });
          break;

        case 'scan_stopped':
          setScanState(prev => ({
            ...prev,
            isScanning: false,
            phase: 'stopped',
            logs: [...prev.logs, {
              timestamp: new Date().toISOString(),
              message: 'Scan execution aborted by dashboard command.',
              type: 'warning'
            }]
          }));
          break;
          
        default:
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket connection error:', error);
      setScanState(prev => ({
        ...prev,
        isScanning: false,
        phase: 'error',
        logs: [...prev.logs, {
          timestamp: new Date().toISOString(),
          message: 'Secure WebSocket handshake failure.',
          type: 'error'
        }]
      }));
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }, []);

  const startScan = useCallback((target, options) => {
    setScanState(prev => ({
      ...prev,
      findings: [],
      stats: {},
      riskScore: 0,
      logs: [],
      completed: false
    }));
    setActiveTab('overview');
    connectWebSocket(target, options);
  }, [connectWebSocket]);

  const stopScan = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'stop_scan'
      }));
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('pentest_scan_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setScanState(prev => ({ ...prev, scanHistory: parsed }));
      } catch (e) {
        console.error('Failed to parse scan history');
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-bg via-[#121224] to-cyber-darkBlue flex flex-col font-sans select-none">
      {/* Premium Header Nav Bar */}
      <header className="sticky top-0 bg-cyber-bg/95 backdrop-blur-md border-b border-cyber-accent/20 px-6 py-4 z-[100] shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none filter drop-shadow-[0_0_10px_rgba(233,69,96,0.3)]">🛡️</span>
            <div>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyber-accent to-pink-500 tracking-wider text-glow select-none uppercase">
                Pentest AI Dashboard
              </h1>
              <p className="text-[10px] text-cyber-textMuted font-semibold tracking-widest uppercase">Automated Vulnerabilities Assessment Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-md shadow-green-500/50" />
            <span className="text-xs font-bold font-mono text-green-400 tracking-wider uppercase">Engine Online</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <TargetInput 
          onStartScan={startScan} 
          onStopScan={stopScan}
          isScanning={scanState.isScanning}
        />

        {scanState.phase !== 'idle' && (
          <div className="animate-fadeIn">
            <PhaseIndicator 
              phase={scanState.phase} 
              target={scanState.target}
            />

            {/* Grid for Risk Dial and Log CLI Terminal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <RiskScore 
                score={scanState.riskScore}
                stats={scanState.stats}
                isScanning={scanState.isScanning}
              />

              <LiveFeed 
                logs={scanState.logs}
                isScanning={scanState.isScanning}
              />
            </div>

            {/* Tab bar selection */}
            <div className="flex border-b border-cyber-cardBorder/60 gap-4 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-cyber-accent text-cyber-accent font-black'
                    : 'border-transparent text-cyber-textMuted hover:text-cyber-textMain'
                }`}
              >
                📊 Dashboard Summary
              </button>
              
              <button
                onClick={() => setActiveTab('remediation')}
                className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition border-b-2 ${
                  activeTab === 'remediation'
                    ? 'border-cyber-accent text-cyber-accent font-black'
                    : 'border-transparent text-cyber-textMuted hover:text-cyber-textMain'
                }`}
              >
                🛡️ Remediation Plan
              </button>
            </div>

            {activeTab === 'overview' ? (
              <div className="space-y-6">
                <Dashboard 
                  stats={scanState.stats}
                  isScanning={scanState.isScanning}
                  phase={scanState.phase}
                />

                {scanState.findings.length > 0 && (
                  <FindingsTable findings={scanState.findings} />
                )}

                {scanState.completed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <ReportSummary 
                      findings={scanState.findings}
                      stats={scanState.stats}
                      riskScore={scanState.riskScore}
                      target={scanState.target}
                    />
                    
                    <ExportReport 
                      findings={scanState.findings}
                      stats={scanState.stats}
                      riskScore={scanState.riskScore}
                      target={scanState.target}
                    />
                  </div>
                )}

                <StatisticsPanel 
                  stats={scanState.stats}
                  findings={scanState.findings}
                />
              </div>
            ) : (
              <RemediationChecklist findings={scanState.findings} />
            )}
          </div>
        )}

        <ScanHistory 
          history={scanState.scanHistory} 
          onClearHistory={clearAllHistory}
          onDeleteItem={deleteHistoryItem}
        />
      </main>

      {/* Cyber Footer */}
      <footer className="py-6 mt-12 bg-black/60 border-t border-cyber-cardBorder/40 text-center">
        <p className="text-xs font-bold text-red-500 tracking-wide uppercase px-4 select-none">
          ⚠️ AUTHORIZED PENETRATION SECURITY ASSESSMENT ENGAGEMENTS ONLY • EXPLICIT PERMISSION MANDATORY
        </p>
        <p className="text-[10px] text-gray-600 mt-2 font-mono">
          Pentest AI Dashboard v1.1.0 • Built with Tailwind CSS
        </p>
      </footer>
    </div>
  );
}

export default App;