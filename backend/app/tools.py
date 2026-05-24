import asyncio
import subprocess
import re
import json
from typing import Dict, List, Optional, Tuple, Callable
from datetime import datetime
import uuid

from app.models import Finding, Severity
from app.utils import extract_hostname


class ToolRunner:
    """Wrapper for all security tools"""
    
    def __init__(self, target: str, callback: Callable):
        self.target = target
        self.callback = callback
    
    async def run_command(self, cmd: List[str], timeout: int = 300) -> Tuple[str, str]:
        """Run a command asynchronously and return stdout, stderr"""
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=timeout
            )
            
            return stdout.decode('utf-8', errors='ignore'), stderr.decode('utf-8', errors='ignore')
        except asyncio.TimeoutError:
            return "", "Command timed out"
        except Exception as e:
            return "", str(e)
    
    async def run_nmap(self) -> List[Finding]:
        """Run Nmap port scan"""
        await self.callback({
            "type": "tool_start",
            "data": {"tool": "nmap", "message": "Starting Nmap port scan..."}
        })
        
        host = extract_hostname(self.target)
        # Quick scan on common ports
        cmd = ["nmap", "-sV", "-sC", "-T4", "--top-ports", "1000", host]
        stdout, stderr = await self.run_command(cmd, timeout=600)
        
        findings = []
        
        # Parse open ports
        port_pattern = r'(\d+)/tcp\s+(\w+)\s+(\w+)\s*(.*)'
        open_ports = re.findall(port_pattern, stdout)
        
        for port, state, service, version in open_ports:
            if state == 'open':
                severity = Severity.INFO
                if port in ['21', '23', '445', '3389']:
                    severity = Severity.MEDIUM
                if service in ['mysql', 'redis', 'mongodb'] and 'unknown' not in version:
                    severity = Severity.HIGH
                
                findings.append(Finding(
                    id=str(uuid.uuid4()),
                    tool="nmap",
                    phase="recon",
                    severity=severity,
                    category="open_port",
                    title=f"Open Port {port}/tcp",
                    description=f"Port {port}/tcp is open running {service} {version}",
                    evidence=f"nmap output: {service} {version}",
                    recommendation=f"Close port {port} if not needed. If required, ensure service is properly secured.",
                    timestamp=datetime.now().isoformat()
                ))
        
        await self.callback({
            "type": "tool_complete",
            "data": {"tool": "nmap", "findings": len(findings), "ports_found": len(open_ports)}
        })
        
        return findings
    
    async def run_whatweb(self) -> List[Finding]:
        """Run WhatWeb technology detection"""
        await self.callback({
            "type": "tool_start",
            "data": {"tool": "whatweb", "message": "Detecting web technologies..."}
        })
        
        cmd = ["whatweb", "--no-errors", self.target]
        stdout, stderr = await self.run_command(cmd, timeout=120)
        
        findings = []
        
        if stdout:
            findings.append(Finding(
                id=str(uuid.uuid4()),
                tool="whatweb",
                phase="recon",
                severity=Severity.INFO,
                category="technology",
                title="Technology Stack Detected",
                description=f"Identified technologies: {stdout[:500]}",
                evidence=stdout[:1000],
                recommendation="Review technology stack for known vulnerabilities.",
                timestamp=datetime.now().isoformat()
            ))
            
            # Check for outdated technologies
            if 'jquery/1.' in stdout.lower() or 'jquery/2.' in stdout.lower():
                findings.append(Finding(
                    id=str(uuid.uuid4()),
                    tool="whatweb",
                    phase="recon",
                    severity=Severity.MEDIUM,
                    category="outdated_component",
                    title="Outdated jQuery Version Detected",
                    description="Old jQuery version may have known vulnerabilities.",
                    evidence=stdout,
                    recommendation="Update jQuery to the latest stable version.",
                    timestamp=datetime.now().isoformat()
                ))
        
        await self.callback({
            "type": "tool_complete",
            "data": {"tool": "whatweb", "findings": len(findings)}
        })
        
        return findings
    
    async def run_gobuster(self) -> List[Finding]:
        """Run Gobuster directory discovery"""
        await self.callback({
            "type": "tool_start",
            "data": {"tool": "gobuster", "message": "Scanning for hidden directories..."}
        })
        
        # Use a small common wordlist
        common_dirs = [
            "admin", "login", "wp-admin", "backup", "config", "dashboard",
            "uploads", "api", "test", "dev", "old", "temp", ".git", ".env",
            "robots.txt", "sitemap.xml", "phpmyadmin", "db", "sql"
        ]
        
        findings = []
        found_dirs = []
        
        for directory in common_dirs:
            cmd = ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", 
                   f"{self.target.rstrip('/')}/{directory}"]
            stdout, stderr = await self.run_command(cmd, timeout=10)
            
            if stdout.strip() in ['200', '301', '302', '403']:
                found_dirs.append(directory)
        
        if found_dirs:
            for directory in found_dirs:
                severity = Severity.INFO
                if directory in ['admin', 'login', 'backup', '.git', '.env', 'config', 'db']:
                    severity = Severity.MEDIUM
                if directory in ['.env', '.git']:
                    severity = Severity.HIGH
                
                findings.append(Finding(
                    id=str(uuid.uuid4()),
                    tool="gobuster",
                    phase="recon",
                    severity=severity,
                    category="exposed_directory",
                    title=f"Directory Found: /{directory}",
                    description=f"Accessible directory: {self.target.rstrip('/')}/{directory}",
                    evidence=f"HTTP {stdout.strip()}",
                    recommendation=f"Restrict access to /{directory} or remove if not needed.",
                    timestamp=datetime.now().isoformat()
                ))
        
        await self.callback({
            "type": "tool_complete",
            "data": {"tool": "gobuster", "directories_found": found_dirs, "findings": len(findings)}
        })
        
        return findings
    
    async def run_nikto(self) -> List[Finding]:
        """Run Nikto vulnerability scanner"""
        await self.callback({
            "type": "tool_start",
            "data": {"tool": "nikto", "message": "Running Nikto vulnerability scan..."}
        })
        
        cmd = ["nikto", "-h", self.target, "-Format", "txt", "-Tuning", "123456789"]
        stdout, stderr = await self.run_command(cmd, timeout=600)
        
        findings = []
        
        # Parse Nikto findings
        for line in stdout.split('\n'):
            if '+ OSVDB-' in line or '+ ' in line[:2]:
                severity = Severity.LOW
                if 'critical' in line.lower() or 'serious' in line.lower():
                    severity = Severity.CRITICAL
                elif 'warning' in line.lower():
                    severity = Severity.MEDIUM
                
                findings.append(Finding(
                    id=str(uuid.uuid4()),
                    tool="nikto",
                    phase="scanning",
                    severity=severity,
                    category="vulnerability",
                    title="Nikto Finding",
                    description=line.strip(),
                    evidence=line.strip(),
                    recommendation="Review Nikto finding and apply appropriate fix.",
                    timestamp=datetime.now().isoformat()
                ))
        
        await self.callback({
            "type": "tool_complete",
            "data": {"tool": "nikto", "findings": len(findings)}
        })
        
        return findings
    
    async def run_sqlmap_basic(self) -> List[Finding]:
        """Run SQLMap basic SQL injection test"""
        await self.callback({
            "type": "tool_start",
            "data": {"tool": "sqlmap", "message": "Testing for SQL injection..."}
        })
        
        # Test common injection points
        test_urls = [
            f"{self.target}?id=1",
            f"{self.target}?page=1",
            f"{self.target}?user=1",
        ]
        
        findings = []
        
        for test_url in test_urls:
            cmd = ["sqlmap", "-u", test_url, "--batch", "--level=1", "--risk=1", 
                   "--smart", "--timeout=10"]
            stdout, stderr = await self.run_command(cmd, timeout=300)
            
            if 'vulnerable' in stdout.lower() or 'parameter' in stdout.lower():
                findings.append(Finding(
                    id=str(uuid.uuid4()),
                    tool="sqlmap",
                    phase="attack",
                    severity=Severity.CRITICAL,
                    category="sql_injection",
                    title="SQL Injection Vulnerability",
                    description=f"SQL injection detected at: {test_url}",
                    evidence=stdout[:1000],
                    recommendation="Use parameterized queries. Sanitize all user inputs.",
                    timestamp=datetime.now().isoformat()
                ))
        
        await self.callback({
            "type": "tool_complete",
            "data": {"tool": "sqlmap", "findings": len(findings)}
        })
        
        return findings
    
    async def run_xss_test(self) -> List[Finding]:
        """Basic XSS vulnerability test"""
        await self.callback({
            "type": "tool_start",
            "data": {"tool": "xss_scanner", "message": "Testing for XSS vulnerabilities..."}
        })
        
        findings = []
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "'><script>alert('XSS')</script>",
            "javascript:alert('XSS')",
        ]
        
        for payload in xss_payloads:
            # Test reflected XSS via query parameter
            import urllib.parse
            encoded_payload = urllib.parse.quote(payload)
            test_url = f"{self.target}?q={encoded_payload}"
            
            cmd = ["curl", "-s", "-L", test_url]
            stdout, stderr = await self.run_command(cmd, timeout=30)
            
            if payload in stdout:
                findings.append(Finding(
                    id=str(uuid.uuid4()),
                    tool="xss_scanner",
                    phase="attack",
                    severity=Severity.HIGH,
                    category="xss",
                    title="Cross-Site Scripting (XSS) Vulnerability",
                    description=f"Reflected XSS detected. Payload reflected in response.",
                    evidence=f"Payload: {payload}\nReflected in response.",
                    recommendation="Implement output encoding. Use Content-Security-Policy header.",
                    timestamp=datetime.now().isoformat()
                ))
                break  # One finding is enough for demo
        
        await self.callback({
            "type": "tool_complete",
            "data": {"tool": "xss_scanner", "findings": len(findings)}
        })
        
        return findings
    
    async def run_headers_check(self) -> List[Finding]:
        """Check security headers"""
        await self.callback({
            "type": "tool_start",
            "data": {"tool": "headers_check", "message": "Checking security headers..."}
        })
        
        findings = []
        
        cmd = ["curl", "-s", "-I", "-L", self.target]
        stdout, stderr = await self.run_command(cmd, timeout=30)
        
        security_headers = {
            "Strict-Transport-Security": ("HSTS not implemented", Severity.MEDIUM),
            "Content-Security-Policy": ("CSP not implemented", Severity.MEDIUM),
            "X-Frame-Options": ("Clickjacking protection missing", Severity.MEDIUM),
            "X-Content-Type-Options": ("MIME sniffing protection missing", Severity.LOW),
            "Referrer-Policy": ("Referrer policy not set", Severity.LOW),
        }
        
        for header, (message, severity) in security_headers.items():
            if header not in stdout:
                findings.append(Finding(
                    id=str(uuid.uuid4()),
                    tool="headers_check",
                    phase="scanning",
                    severity=severity,
                    category="missing_header",
                    title=f"Missing Security Header: {header}",
                    description=message,
                    evidence=f"Header '{header}' not found in response.",
                    recommendation=f"Add '{header}' header to improve security posture.",
                    timestamp=datetime.now().isoformat()
                ))
        
        await self.callback({
            "type": "tool_complete",
            "data": {"tool": "headers_check", "findings": len(findings)}
        })
        
        return findings