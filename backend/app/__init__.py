"""
Pentest AI Dashboard - Backend Application
Automated penetration testing pipeline
"""

__version__ = "1.0.0"
__author__ = "Pentest Dashboard Team"

from app.main import app
from app.pipeline import AttackPipeline
from app.tools import ToolRunner
from app.models import Finding, Severity, Phase