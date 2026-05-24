from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class Severity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Phase(str, Enum):
    RECON = "recon"
    SCANNING = "scanning"
    ATTACK = "attack"
    REPORT = "report"
    COMPLETE = "complete"
    ERROR = "error"


class Finding(BaseModel):
    id: str
    tool: str
    phase: str
    severity: Severity
    category: str
    title: str
    description: str
    evidence: str
    recommendation: str
    timestamp: str


class TargetRequest(BaseModel):
    url: str


class WebSocketMessage(BaseModel):
    type: str  # "phase_change", "tool_start", "tool_output", "tool_complete", "finding", "error", "complete"
    data: Dict[str, Any]


class ScanResult(BaseModel):
    scan_id: str
    target: str
    start_time: str
    end_time: Optional[str] = None
    status: str
    findings: List[Finding] = []
    stats: Dict[str, int] = {}
    risk_score: Optional[float] = None