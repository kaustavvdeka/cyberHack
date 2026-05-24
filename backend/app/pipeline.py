import asyncio
import uuid
from typing import Callable, Dict, List, Optional
from datetime import datetime

from app.models import Finding, Phase, Severity
from app.tools import ToolRunner
from app.utils import extract_hostname


def get_mock_findings(target: str) -> Dict[str, List[Dict]]:
    host = extract_hostname(target)
    
    return {
        "nmap": [
            {
                "tool": "nmap",
                "phase": "recon",
                "severity": "info",
                "category": "open_port",
                "title": "Open Port 80/tcp",
                "description": f"Port 80/tcp is open on {host} running Nginx 1.18.0 web server.",
                "evidence": "nmap output:\n80/tcp open http nginx 1.18.0",
                "recommendation": "Ensure HTTP is redirected to HTTPS. Disable server banners if possible."
            },
            {
                "tool": "nmap",
                "phase": "recon",
                "severity": "info",
                "category": "open_port",
                "title": "Open Port 443/tcp",
                "description": f"Port 443/tcp is open on {host} running Nginx 1.18.0 secure web server.",
                "evidence": "nmap output:\n443/tcp open https nginx 1.18.0",
                "recommendation": "Ensure SSL/TLS configuration is secure, supporting TLS 1.2 and TLS 1.3 only."
            },
            {
                "tool": "nmap",
                "phase": "recon",
                "severity": "medium",
                "category": "open_port",
                "title": "Open Port 22/tcp (SSH)",
                "description": f"Port 22/tcp is open on {host} running OpenSSH 8.2p1.",
                "evidence": "nmap output:\n22/tcp open ssh OpenSSH 8.2p1 (protocol 2.0)",
                "recommendation": "Restrict SSH access to authorized IP addresses. Disable password authentication and enforce SSH key access."
            },
            {
                "tool": "nmap",
                "phase": "recon",
                "severity": "high",
                "category": "open_port",
                "title": "Open Port 3306/tcp (MySQL)",
                "description": f"MySQL database port 3306/tcp is open on {host} and listening for external connections.",
                "evidence": "nmap output:\n3306/tcp open mysql MySQL 8.0.25",
                "recommendation": "Bind MySQL service to localhost (127.0.0.1) or implement firewall rules to block public access."
            }
        ],
        "whatweb": [
            {
                "tool": "whatweb",
                "phase": "recon",
                "severity": "info",
                "category": "technology",
                "title": "Technology Stack Identified",
                "description": "Detected technologies: HTML5, Nginx/1.18.0, PHP/7.4.3, jQuery/1.12.4, OpenSSL/1.1.1f.",
                "evidence": f"whatweb output:\n{target} [200 OK] HTML5, Nginx[1.18.0], PHP[7.4.3], jQuery[1.12.4], OpenSSL[1.1.1f]",
                "recommendation": "Keep all technology stack software packages updated to their latest security patches."
            },
            {
                "tool": "whatweb",
                "phase": "recon",
                "severity": "medium",
                "category": "outdated_component",
                "title": "Outdated jQuery Component",
                "description": "The web page uses jQuery v1.12.4 which is outdated and contains multiple known vulnerabilities (e.g. CVE-2020-11022, XSS in HTML manipulation).",
                "evidence": "jQuery v1.12.4 detected in page sources.",
                "recommendation": "Upgrade to the latest version of jQuery (v3.x or above) to patch client-side security flaws."
            }
        ],
        "gobuster": [
            {
                "tool": "gobuster",
                "phase": "recon",
                "severity": "medium",
                "category": "exposed_directory",
                "title": "Exposed Directory: /admin",
                "description": f"Found accessible administrator directory: {target}/admin",
                "evidence": "HTTP/1.1 200 OK",
                "recommendation": "Restrict access to the admin area using IP whitelisting or double-factor authentication."
            },
            {
                "tool": "gobuster",
                "phase": "recon",
                "severity": "high",
                "category": "exposed_directory",
                "title": "Exposed Database Backup: /backup.sql",
                "description": f"Found accessible raw SQL database backup file: {target}/backup.sql",
                "evidence": "HTTP/1.1 200 OK - Size: 4.8MB",
                "recommendation": "Remove database backups from public web directories immediately. Store backups in a secure, non-public location."
            },
            {
                "tool": "gobuster",
                "phase": "recon",
                "severity": "high",
                "category": "exposed_directory",
                "title": "Exposed Configuration File: /.env",
                "description": f"Found accessible environment configuration file: {target}/.env containing database passwords and secret API keys.",
                "evidence": "HTTP/1.1 200 OK - Content: DB_PASSWORD=admin_secret\nAWS_SECRET_ACCESS_KEY=...",
                "recommendation": "Delete the public /.env file and configure the web server to block all hidden file access (files starting with a dot)."
            }
        ],
        "headers_check": [
            {
                "tool": "headers_check",
                "phase": "scanning",
                "severity": "medium",
                "category": "missing_header",
                "title": "Missing Content-Security-Policy",
                "description": "Content-Security-Policy (CSP) header is not set. This exposes users to Cross-Site Scripting (XSS) and data injection attacks.",
                "evidence": "HTTP headers response: Content-Security-Policy header is missing.",
                "recommendation": "Implement a strong Content-Security-Policy to restrict scripts, stylesheets, and image sources."
            },
            {
                "tool": "headers_check",
                "phase": "scanning",
                "severity": "medium",
                "category": "missing_header",
                "title": "Missing Strict-Transport-Security",
                "description": "HTTP Strict Transport Security (HSTS) header is not set. Browsers can connect via unencrypted HTTP, leaving them vulnerable to MITM attacks.",
                "evidence": "HTTP headers response: Strict-Transport-Security header is missing.",
                "recommendation": "Add the Strict-Transport-Security header with appropriate max-age value."
            },
            {
                "tool": "headers_check",
                "phase": "scanning",
                "severity": "low",
                "category": "missing_header",
                "title": "Missing X-Content-Type-Options",
                "description": "X-Content-Type-Options header is missing. Browsers may try to sniff the MIME type of a response, which can lead to script injection.",
                "evidence": "HTTP headers response: X-Content-Type-Options header is missing.",
                "recommendation": "Set the X-Content-Type-Options header to 'nosniff'."
            }
        ],
        "nikto": [
            {
                "tool": "nikto",
                "phase": "scanning",
                "severity": "medium",
                "category": "vulnerability",
                "title": "Clickjacking Vulnerability (Missing X-Frame-Options)",
                "description": "The anti-clickjacking X-Frame-Options header is not present. This page can be embedded inside a malicious iframe.",
                "evidence": "Nikto finding: + The anti-clickjacking X-Frame-Options header is not present on this site.",
                "recommendation": "Configure the X-Frame-Options header to 'SAMEORIGIN' or 'DENY', or use CSP 'frame-ancestors' directive."
            },
            {
                "tool": "nikto",
                "phase": "scanning",
                "severity": "medium",
                "category": "vulnerability",
                "title": "Outdated Server Version",
                "description": f"The remote web server Nginx 1.18.0 appears to be outdated and contains known vulnerabilities (e.g. CVE-2021-23017).",
                "evidence": "Nikto finding: + Server: nginx/1.18.0 - Outdated server version detected.",
                "recommendation": "Update Nginx to the latest stable release to patch server-level vulnerabilities."
            }
        ],
        "sqlmap": [
            {
                "tool": "sqlmap",
                "phase": "attack",
                "severity": "critical",
                "category": "sql_injection",
                "title": "SQL Injection Vulnerability",
                "description": f"Critical boolean-based and time-based blind SQL injection vulnerability detected on the GET parameter 'id' at {target}/api/products.",
                "evidence": "sqlmap output:\nParameter: id (GET)\nType: boolean-based blind\nPayload: id=1 AND 5821=5821\nType: time-based blind\nPayload: id=1 AND (SELECT 4124 FROM (SELECT(SLEEP(5)))a)",
                "recommendation": "Use parameterized queries or prepared statements in database interactions. Apply strict validation on parameter input formats."
            }
        ],
        "xss_scanner": [
            {
                "tool": "xss_scanner",
                "phase": "attack",
                "severity": "high",
                "category": "xss",
                "title": "Reflected Cross-Site Scripting (XSS)",
                "description": f"Reflected Cross-Site Scripting (XSS) vulnerability detected. The payload injected in query parameter 'q' is reflected back in the page source code unescaped.",
                "evidence": f"Request URL: {target}/search?q=%3Cscript%3Ealert(%27XSS%27)%3C/script%3E\nReflected in body: ... <div>Results for: <script>alert('XSS')</script></div> ...",
                "recommendation": "Encode all user inputs before rendering them in the HTML DOM. Implement a Content-Security-Policy (CSP) to restrict script execution."
            }
        ]
    }


class AttackPipeline:
    """Main attack pipeline orchestrator"""
    
    def __init__(self, target: str, ws_callback: Callable, simulation: bool = False, tools: Optional[List[str]] = None):
        self.target = target
        self.scan_id = str(uuid.uuid4())
        self.ws_callback = ws_callback
        self.simulation = simulation
        self.selected_tools = tools if tools is not None else ["nmap", "whatweb", "gobuster", "headers_check", "nikto", "sqlmap", "xss_scanner"]
        self.tools = ToolRunner(target, ws_callback)
        self.findings: List[Finding] = []
        self.start_time = datetime.now().isoformat()
        
    async def run_full_pipeline(self) -> Dict:
        """Execute all phases and return results"""
        
        if self.simulation:
            return await self.run_simulated_pipeline()
            
        # --- Real execution pipeline ---
        
        # Phase 1: Reconnaissance
        await self._update_phase(Phase.RECON, "Starting reconnaissance phase...")
        await asyncio.sleep(1)  # Brief pause for UI update
        
        if "nmap" in self.selected_tools:
            try:
                nmap_findings = await self.tools.run_nmap()
                for f in nmap_findings:
                    await self._add_finding(f)
            except Exception as e:
                await self._send_error("nmap", str(e))
        
        if "whatweb" in self.selected_tools:
            try:
                whatweb_findings = await self.tools.run_whatweb()
                for f in whatweb_findings:
                    await self._add_finding(f)
            except Exception as e:
                await self._send_error("whatweb", str(e))
        
        if "gobuster" in self.selected_tools:
            try:
                gobuster_findings = await self.tools.run_gobuster()
                for f in gobuster_findings:
                    await self._add_finding(f)
            except Exception as e:
                await self._send_error("gobuster", str(e))
        
        # Phase 2: Vulnerability Scanning
        await self._update_phase(Phase.SCANNING, "Starting vulnerability scanning phase...")
        await asyncio.sleep(1)
        
        if "headers_check" in self.selected_tools:
            try:
                headers_findings = await self.tools.run_headers_check()
                for f in headers_findings:
                    await self._add_finding(f)
            except Exception as e:
                await self._send_error("headers_check", str(e))
        
        if "nikto" in self.selected_tools:
            try:
                nikto_findings = await self.tools.run_nikto()
                for f in nikto_findings:
                    await self._add_finding(f)
            except Exception as e:
                await self._send_error("nikto", str(e))
        
        # Phase 3: Targeted Attacks
        await self._update_phase(Phase.ATTACK, "Starting targeted attack phase...")
        await asyncio.sleep(1)
        
        if "sqlmap" in self.selected_tools:
            try:
                sqli_findings = await self.tools.run_sqlmap_basic()
                for f in sqli_findings:
                    await self._add_finding(f)
            except Exception as e:
                await self._send_error("sqlmap", str(e))
        
        if "xss_scanner" in self.selected_tools:
            try:
                xss_findings = await self.tools.run_xss_test()
                for f in xss_findings:
                    await self._add_finding(f)
            except Exception as e:
                await self._send_error("xss_scanner", str(e))
        
        # Phase 4: Report Generation
        await self._update_phase(Phase.REPORT, "Generating final report...")
        await asyncio.sleep(1)
        
        stats = self._calculate_stats()
        risk_score = self._calculate_risk_score()
        
        results = {
            "scan_id": self.scan_id,
            "target": self.target,
            "start_time": self.start_time,
            "end_time": datetime.now().isoformat(),
            "status": "complete",
            "findings": [finding.dict() for finding in self.findings],
            "stats": stats,
            "risk_score": risk_score
        }
        
        await self.ws_callback({
            "type": "complete",
            "data": results
        })
        
        return results

    async def run_simulated_pipeline(self) -> Dict:
        """Simulate the scan pipeline execution with realistic delays and findings"""
        
        # Phase 1: Reconnaissance
        await self._update_phase(Phase.RECON, "Starting simulated reconnaissance phase...")
        await asyncio.sleep(1.5)
        
        mock_data = get_mock_findings(self.target)
        
        # Nmap
        if "nmap" in self.selected_tools:
            await self.ws_callback({
                "type": "tool_start",
                "data": {"tool": "nmap", "message": "Simulating Nmap port scan on common ports..."}
            })
            await asyncio.sleep(2)
            
            nmap_findings = mock_data.get("nmap", [])
            for raw_finding in nmap_findings:
                finding = Finding(
                    id=str(uuid.uuid4()),
                    tool=raw_finding["tool"],
                    phase=raw_finding["phase"],
                    severity=Severity(raw_finding["severity"]),
                    category=raw_finding["category"],
                    title=raw_finding["title"],
                    description=raw_finding["description"],
                    evidence=raw_finding["evidence"],
                    recommendation=raw_finding["recommendation"],
                    timestamp=datetime.now().isoformat()
                )
                await self._add_finding(finding)
                await asyncio.sleep(0.5)
                
            await self.ws_callback({
                "type": "tool_complete",
                "data": {"tool": "nmap", "findings": len(nmap_findings), "ports_found": len(nmap_findings)}
            })
            await asyncio.sleep(1)

        # WhatWeb
        if "whatweb" in self.selected_tools:
            await self.ws_callback({
                "type": "tool_start",
                "data": {"tool": "whatweb", "message": "Simulating WhatWeb fingerprinting..."}
            })
            await asyncio.sleep(1.5)
            
            whatweb_findings = mock_data.get("whatweb", [])
            for raw_finding in whatweb_findings:
                finding = Finding(
                    id=str(uuid.uuid4()),
                    tool=raw_finding["tool"],
                    phase=raw_finding["phase"],
                    severity=Severity(raw_finding["severity"]),
                    category=raw_finding["category"],
                    title=raw_finding["title"],
                    description=raw_finding["description"],
                    evidence=raw_finding["evidence"],
                    recommendation=raw_finding["recommendation"],
                    timestamp=datetime.now().isoformat()
                )
                await self._add_finding(finding)
                await asyncio.sleep(0.3)
                
            await self.ws_callback({
                "type": "tool_complete",
                "data": {"tool": "whatweb", "findings": len(whatweb_findings)}
            })
            await asyncio.sleep(1)

        # Gobuster
        if "gobuster" in self.selected_tools:
            await self.ws_callback({
                "type": "tool_start",
                "data": {"tool": "gobuster", "message": "Simulating directory discovery on common paths..."}
            })
            await asyncio.sleep(2)
            
            gobuster_findings = mock_data.get("gobuster", [])
            for raw_finding in gobuster_findings:
                finding = Finding(
                    id=str(uuid.uuid4()),
                    tool=raw_finding["tool"],
                    phase=raw_finding["phase"],
                    severity=Severity(raw_finding["severity"]),
                    category=raw_finding["category"],
                    title=raw_finding["title"],
                    description=raw_finding["description"],
                    evidence=raw_finding["evidence"],
                    recommendation=raw_finding["recommendation"],
                    timestamp=datetime.now().isoformat()
                )
                await self._add_finding(finding)
                await asyncio.sleep(0.5)
                
            await self.ws_callback({
                "type": "tool_complete",
                "data": {"tool": "gobuster", "findings": len(gobuster_findings), "directories_found": ["/admin", "/backup.sql", "/.env"]}
            })
            await asyncio.sleep(1)
            
        # Phase 2: Vulnerability Scanning
        await self._update_phase(Phase.SCANNING, "Starting simulated vulnerability scanning phase...")
        await asyncio.sleep(1.5)
        
        # Headers Check
        if "headers_check" in self.selected_tools:
            await self.ws_callback({
                "type": "tool_start",
                "data": {"tool": "headers_check", "message": "Simulating HTTP security headers analysis..."}
            })
            await asyncio.sleep(1)
            
            headers_findings = mock_data.get("headers_check", [])
            for raw_finding in headers_findings:
                finding = Finding(
                    id=str(uuid.uuid4()),
                    tool=raw_finding["tool"],
                    phase=raw_finding["phase"],
                    severity=Severity(raw_finding["severity"]),
                    category=raw_finding["category"],
                    title=raw_finding["title"],
                    description=raw_finding["description"],
                    evidence=raw_finding["evidence"],
                    recommendation=raw_finding["recommendation"],
                    timestamp=datetime.now().isoformat()
                )
                await self._add_finding(finding)
                await asyncio.sleep(0.3)
                
            await self.ws_callback({
                "type": "tool_complete",
                "data": {"tool": "headers_check", "findings": len(headers_findings)}
            })
            await asyncio.sleep(1)

        # Nikto
        if "nikto" in self.selected_tools:
            await self.ws_callback({
                "type": "tool_start",
                "data": {"tool": "nikto", "message": "Simulating Nikto vulnerability scanner..."}
            })
            await asyncio.sleep(2)
            
            nikto_findings = mock_data.get("nikto", [])
            for raw_finding in nikto_findings:
                finding = Finding(
                    id=str(uuid.uuid4()),
                    tool=raw_finding["tool"],
                    phase=raw_finding["phase"],
                    severity=Severity(raw_finding["severity"]),
                    category=raw_finding["category"],
                    title=raw_finding["title"],
                    description=raw_finding["description"],
                    evidence=raw_finding["evidence"],
                    recommendation=raw_finding["recommendation"],
                    timestamp=datetime.now().isoformat()
                )
                await self._add_finding(finding)
                await asyncio.sleep(0.5)
                
            await self.ws_callback({
                "type": "tool_complete",
                "data": {"tool": "nikto", "findings": len(nikto_findings)}
            })
            await asyncio.sleep(1)
            
        # Phase 3: Targeted Attacks
        await self._update_phase(Phase.ATTACK, "Starting simulated targeted attack phase...")
        await asyncio.sleep(1.5)
        
        # SQLMap
        if "sqlmap" in self.selected_tools:
            await self.ws_callback({
                "type": "tool_start",
                "data": {"tool": "sqlmap", "message": "Simulating SQL Injection testing on common parameters..."}
            })
            await asyncio.sleep(2)
            
            sqlmap_findings = mock_data.get("sqlmap", [])
            for raw_finding in sqlmap_findings:
                finding = Finding(
                    id=str(uuid.uuid4()),
                    tool=raw_finding["tool"],
                    phase=raw_finding["phase"],
                    severity=Severity(raw_finding["severity"]),
                    category=raw_finding["category"],
                    title=raw_finding["title"],
                    description=raw_finding["description"],
                    evidence=raw_finding["evidence"],
                    recommendation=raw_finding["recommendation"],
                    timestamp=datetime.now().isoformat()
                )
                await self._add_finding(finding)
                await asyncio.sleep(0.5)
                
            await self.ws_callback({
                "type": "tool_complete",
                "data": {"tool": "sqlmap", "findings": len(sqlmap_findings)}
            })
            await asyncio.sleep(1)

        # XSS
        if "xss_scanner" in self.selected_tools:
            await self.ws_callback({
                "type": "tool_start",
                "data": {"tool": "xss_scanner", "message": "Simulating reflected Cross-Site Scripting tests..."}
            })
            await asyncio.sleep(1.5)
            
            xss_findings = mock_data.get("xss_scanner", [])
            for raw_finding in xss_findings:
                finding = Finding(
                    id=str(uuid.uuid4()),
                    tool=raw_finding["tool"],
                    phase=raw_finding["phase"],
                    severity=Severity(raw_finding["severity"]),
                    category=raw_finding["category"],
                    title=raw_finding["title"],
                    description=raw_finding["description"],
                    evidence=raw_finding["evidence"],
                    recommendation=raw_finding["recommendation"],
                    timestamp=datetime.now().isoformat()
                )
                await self._add_finding(finding)
                await asyncio.sleep(0.3)
                
            await self.ws_callback({
                "type": "tool_complete",
                "data": {"tool": "xss_scanner", "findings": len(xss_findings)}
            })
            await asyncio.sleep(1)

        # Phase 4: Report Generation
        await self._update_phase(Phase.REPORT, "Simulating report generation...")
        await asyncio.sleep(1)
        
        stats = self._calculate_stats()
        risk_score = self._calculate_risk_score()
        
        results = {
            "scan_id": self.scan_id,
            "target": self.target,
            "start_time": self.start_time,
            "end_time": datetime.now().isoformat(),
            "status": "complete",
            "findings": [finding.dict() for finding in self.findings],
            "stats": stats,
            "risk_score": risk_score
        }
        
        await self.ws_callback({
            "type": "complete",
            "data": results
        })
        
        return results
    
    async def _add_finding(self, finding: Finding):
        """Add finding locally and broadcast it in real-time"""
        self.findings.append(finding)
        await self.ws_callback({
            "type": "finding",
            "data": finding.dict()
        })
    
    async def _update_phase(self, phase: Phase, message: str):
        """Send phase update to frontend"""
        await self.ws_callback({
            "type": "phase_change",
            "data": {
                "phase": phase.value,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
        })
    
    async def _send_error(self, tool: str, error: str):
        """Send error to frontend"""
        await self.ws_callback({
            "type": "error",
            "data": {
                "tool": tool,
                "error": error,
                "timestamp": datetime.now().isoformat()
            }
        })
    
    def _calculate_stats(self) -> Dict:
        """Calculate statistics from findings"""
        stats = {
            "total": len(self.findings),
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "info": 0,
            "by_category": {},
            "by_tool": {},
            "open_ports": 0
        }
        
        for finding in self.findings:
            stats[finding.severity.value] += 1
            
            if finding.category not in stats["by_category"]:
                stats["by_category"][finding.category] = 0
            stats["by_category"][finding.category] += 1
            
            if finding.tool not in stats["by_tool"]:
                stats["by_tool"][finding.tool] = 0
            stats["by_tool"][finding.tool] += 1
            
        stats["open_ports"] = stats["by_category"].get("open_port", 0)
        
        return stats
    
    def _calculate_risk_score(self) -> float:
        """Calculate overall risk score (0-100)"""
        if not self.findings:
            return 0.0
        
        severity_weights = {
            "critical": 10,
            "high": 7,
            "medium": 4,
            "low": 1.5,
            "info": 0.5
        }
        
        total_score = 0
        for finding in self.findings:
            total_score += severity_weights.get(finding.severity.value, 1)
        
        # Normalize to 0-100
        # If there is at least one critical vulnerability, minimum risk is 75
        # If there is at least one high vulnerability, minimum risk is 50
        base_score = 0
        if any(f.severity == Severity.CRITICAL for f in self.findings):
            base_score = 75
        elif any(f.severity == Severity.HIGH for f in self.findings):
            base_score = 50
        elif any(f.severity == Severity.MEDIUM for f in self.findings):
            base_score = 25
            
        normalized = max(base_score, min(total_score, 100))
        return round(normalized, 1)