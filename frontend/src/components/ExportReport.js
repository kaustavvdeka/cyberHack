import React, { useState } from 'react';

function ExportReport({ findings = [], stats = {}, riskScore = 0, target = '' }) {
  const [exportStatus, setExportStatus] = useState('');

  const generateReportData = () => {
    return {
      report_metadata: {
        generated_at: new Date().toISOString(),
        target_url: target,
        risk_score: riskScore,
        total_findings: findings.length,
        scan_duration: 'N/A',
      },
      statistics: stats,
      findings: findings.map(finding => ({
        id: finding.id,
        severity: finding.severity,
        tool: finding.tool,
        category: finding.category,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        recommendation: finding.recommendation,
        timestamp: finding.timestamp,
      })),
      executive_summary: {
        critical_findings: findings.filter(f => f.severity.toLowerCase() === 'critical').length,
        high_findings: findings.filter(f => f.severity.toLowerCase() === 'high').length,
        medium_findings: findings.filter(f => f.severity.toLowerCase() === 'medium').length,
        low_findings: findings.filter(f => f.severity.toLowerCase() === 'low').length,
        info_findings: findings.filter(f => f.severity.toLowerCase() === 'info').length,
        risk_level: riskScore >= 75 ? 'CRITICAL' : 
                    riskScore >= 50 ? 'HIGH' : 
                    riskScore >= 25 ? 'MEDIUM' : 
                    riskScore > 0 ? 'LOW' : 'NONE',
      }
    };
  };

  const exportJSON = () => {
    try {
      const data = generateReportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadFile(blob, `pentest-report-${sanitizeFilename(target)}.json`);
      triggerMessage('JSON report exported successfully! 📄');
    } catch (error) {
      triggerMessage('Error exporting JSON report ❌');
    }
  };

  const exportCSV = () => {
    try {
      const headers = ['Severity', 'Tool', 'Category', 'Title', 'Description', 'Recommendation', 'Evidence'];
      const rows = findings.map(f => [
        f.severity,
        f.tool,
        f.category,
        `"${(f.title || '').replace(/"/g, '""')}"`,
        `"${(f.description || '').replace(/"/g, '""')}"`,
        `"${(f.recommendation || '').replace(/"/g, '""')}"`,
        `"${(f.evidence || '').replace(/"/g, '""')}"`,
      ]);
      
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadFile(blob, `pentest-findings-${sanitizeFilename(target)}.csv`);
      triggerMessage('CSV report exported successfully! 📊');
    } catch (error) {
      triggerMessage('Error exporting CSV report ❌');
    }
  };

  const exportHTML = () => {
    try {
      const data = generateReportData();
      const html = generateHTMLReport(data);
      const blob = new Blob([html], { type: 'text/html' });
      downloadFile(blob, `pentest-report-${sanitizeFilename(target)}.html`);
      triggerMessage('HTML report exported successfully! 🌐');
    } catch (error) {
      triggerMessage('Error exporting HTML report ❌');
    }
  };

  const triggerMessage = (msg) => {
    setExportStatus(msg);
    setTimeout(() => setExportStatus(''), 3000);
  };

  const generateHTMLReport = (data) => {
    const severityColor = (s) => {
      const colors = { critical: '#ff4444', high: '#ff8800', medium: '#ffbb33', low: '#00C851', info: '#33b5e5' };
      return colors[s.toLowerCase()] || '#666';
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pentest Report - ${data.report_metadata.target_url}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 30px; background: #0b0b14; color: #e0e0e0; }
    .header { background: #141424; border: 1px solid rgba(233, 69, 96, 0.2); padding: 30px; border-radius: 12px; margin-bottom: 25px; }
    .header h1 { margin: 0; color: #e94560; font-size: 28px; }
    .header p { margin: 8px 0 0 0; color: #a0a0b0; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
    .card { background: #141424; border: 1px solid rgba(233, 69, 96, 0.15); padding: 20px; border-radius: 12px; }
    .card h3 { margin: 0 0 10px 0; color: #a0a0b0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .card .value { font-size: 28px; font-weight: bold; }
    .card p { margin: 5px 0 0 0; font-size: 12px; font-weight: bold; }
    .finding-section { margin-top: 30px; }
    .finding-section h2 { color: #e94560; font-size: 20px; border-bottom: 2px solid rgba(233, 69, 96, 0.2); padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; background: #141424; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.03); }
    th { background: #0c0c16; color: #e94560; padding: 14px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 13px; vertical-align: top; }
    .severity-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; color: white; font-size: 11px; font-weight: bold; border: 1px solid transparent; text-transform: uppercase; }
    .evidence { font-family: monospace; font-size: 11px; background: #0c0c16; padding: 10px; border-radius: 6px; white-space: pre-wrap; word-break: break-all; color: #00ff66; margin-top: 5px; }
    .footer { text-align: center; margin-top: 40px; color: #ff6b6b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ Automated Security Penetration Test Report</h1>
    <p>Target Domain: ${data.report_metadata.target_url}</p>
    <p>Generated At: ${new Date(data.report_metadata.generated_at).toLocaleString()}</p>
  </div>

  <div class="summary">
    <div class="card">
      <h3>Risk Assessment</h3>
      <div class="value" style="color: ${data.report_metadata.risk_score >= 50 ? '#ff4444' : '#00C851'}">
        ${data.report_metadata.risk_score}/100
      </div>
      <p style="color: ${data.report_metadata.risk_score >= 50 ? '#ff4444' : '#00C851'}">${data.executive_summary.risk_level} THREAT LEVEL</p>
    </div>
    <div class="card">
      <h3>Total Issues</h3>
      <div class="value" style="color: #e0e0e0">${data.report_metadata.total_findings}</div>
      <p style="color: #a0a0b0">VULNERABILITIES</p>
    </div>
    <div class="card">
      <h3>High + Critical</h3>
      <div class="value" style="color: #ff4444">
        ${data.executive_summary.critical_findings + data.executive_summary.high_findings}
      </div>
      <p style="color: #ff4444">ACTION REQUIRED</p>
    </div>
  </div>

  <div class="finding-section">
    <h2>Detailed Findings Log</h2>
    ${data.findings.length === 0 ? '<p>No findings to display.</p>' : `
      <table>
        <thead>
          <tr>
            <th style="width: 15%">Severity</th>
            <th style="width: 10%">Module</th>
            <th style="width: 25%">Vulnerability Title</th>
            <th style="width: 25%">Description</th>
            <th style="width: 25%">Remediation Plan</th>
          </tr>
        </thead>
        <tbody>
          ${data.findings.map(f => `
            <tr>
              <td>
                <span class="severity-badge" style="background: ${severityColor(f.severity)}20; color: ${severityColor(f.severity)}; border: 1px solid ${severityColor(f.severity)}50">
                  ${f.severity}
                </span>
              </td>
              <td style="font-family: monospace; font-weight: bold;">${f.tool}</td>
              <td style="font-weight: bold;">${f.title}</td>
              <td>
                <div>${f.description}</div>
                <div class="evidence">${f.evidence}</div>
              </td>
              <td style="color: #88ff88;">${f.recommendation}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `}
  </div>

  <div class="footer">
    <p>⚠️ DISCLAIMER: This document contains sensitive security scan logs. For authorized eyes only.</p>
  </div>
</body>
</html>`;
  };

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sanitizeFilename = (str) => {
    return str.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  };

  if (findings.length === 0 && Object.keys(stats).length === 0) {
    return null;
  }

  return (
    <div className="bg-cyber-card border border-cyber-cardBorder rounded-xl p-6 mt-6">
      <div className="text-cyber-textMuted text-xs font-semibold uppercase tracking-widest mb-4">📥 Export Assessments Log</div>
      
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={exportJSON}
          className="bg-[#18182c] border border-cyber-cardBorder/40 hover:bg-[#20203a] hover:border-cyber-accent text-cyber-textMain text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg transition duration-200 active:scale-95 shadow-md"
        >
          📄 Export JSON
        </button>
        
        <button 
          onClick={exportCSV}
          className="bg-[#18182c] border border-cyber-cardBorder/40 hover:bg-[#20203a] hover:border-cyber-accent text-cyber-textMain text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg transition duration-200 active:scale-95 shadow-md"
        >
          📊 Export CSV Table
        </button>
        
        <button 
          onClick={exportHTML}
          className="bg-cyber-accent hover:bg-cyber-accentHover text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg transition duration-200 active:scale-95 shadow-lg shadow-cyber-accent/15"
        >
          🌐 Download HTML Report
        </button>
      </div>
      
      {exportStatus && (
        <p className="text-green-400 text-xs font-semibold mt-3 animate-fadeIn">{exportStatus}</p>
      )}
    </div>
  );
}

export default ExportReport;