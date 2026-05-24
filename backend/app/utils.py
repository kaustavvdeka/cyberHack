import re
from urllib.parse import urlparse


def validate_target_url(url: str) -> bool:
    """Validate and sanitize target URL"""
    if not url:
        return False
    
    # Add scheme if missing
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False


def sanitize_target_url(url: str) -> str:
    """Sanitize target URL"""
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    # Remove trailing slash
    url = url.rstrip('/')
    
    # Remove path, keep only base URL
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def is_safe_target(url: str) -> bool:
    """Check if target is safe to test (non-production, local, or authorized)"""
    # This is a basic check - in production, implement proper authorization
    blacklist = [
        'google.com', 'facebook.com', 'amazon.com', 'microsoft.com',
        'apple.com', 'netflix.com', 'bank', 'gov', 'mil'
    ]
    
    url_lower = url.lower()
    for blocked in blacklist:
        if blocked in url_lower:
            return False
    
    return True


def extract_hostname(url: str) -> str:
    """Extract hostname (e.g. example.com or 127.0.0.1) from URL"""
    if not url:
        return ""
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    try:
        result = urlparse(url)
        host = result.hostname or result.netloc
        # If result.hostname is None or empty, strip port manually from netloc
        if not host:
            host = result.netloc
        if host and ':' in host:
            host = host.split(':')[0]
        return host
    except:
        return url