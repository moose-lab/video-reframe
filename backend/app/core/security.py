from typing import Optional
import secrets
from fastapi import HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from loguru import logger

from app.core.config import settings


class SecurityUtils:
    """Security utilities for the application."""
    
    @staticmethod
    def generate_secure_filename(filename: str) -> str:
        """
        Generate a secure filename to prevent path traversal attacks.
        
        Args:
            filename: Original filename
            
        Returns:
            str: Secure filename
        """
        # Remove path components
        filename = filename.split("/")[-1].split("\\")[-1]
        
        # Generate random prefix to avoid collisions
        secure_prefix = secrets.token_hex(8)
        
        return f"{secure_prefix}_{filename}"
    
    @staticmethod
    def validate_content_length(content_length: Optional[int]) -> None:
        """
        Validate request content length.
        
        Args:
            content_length: Content length from request headers
            
        Raises:
            HTTPException: If content length is invalid
        """
        if content_length is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Content-Length header is required"
            )
        
        if content_length > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size ({content_length} bytes) exceeds maximum allowed size ({settings.MAX_FILE_SIZE} bytes)"
            )
        
        if content_length <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Content-Length must be greater than 0"
            )


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        self._requests = {}
        self._max_requests_per_minute = 60
        self._max_requests_per_hour = 1000
    
    async def check_rate_limit(self, client_ip: str) -> None:
        """
        Check if client has exceeded rate limits.
        
        Args:
            client_ip: Client IP address
            
        Raises:
            HTTPException: If rate limit exceeded
        """
        import time
        current_time = time.time()
        
        if client_ip not in self._requests:
            self._requests[client_ip] = []
        
        # Clean old requests (older than 1 hour)
        self._requests[client_ip] = [
            req_time for req_time in self._requests[client_ip]
            if current_time - req_time < 3600
        ]
        
        # Check hourly limit
        if len(self._requests[client_ip]) >= self._max_requests_per_hour:
            logger.warning(f"Rate limit exceeded for IP {client_ip}: hourly limit")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Hourly rate limit exceeded"
            )
        
        # Check per-minute limit
        recent_requests = [
            req_time for req_time in self._requests[client_ip]
            if current_time - req_time < 60
        ]
        
        if len(recent_requests) >= self._max_requests_per_minute:
            logger.warning(f"Rate limit exceeded for IP {client_ip}: per-minute limit")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Per-minute rate limit exceeded"
            )
        
        # Add current request
        self._requests[client_ip].append(current_time)


# Global rate limiter instance
rate_limiter = RateLimiter()


async def check_client_rate_limit(request: Request):
    """
    FastAPI dependency to check rate limits.
    
    Args:
        request: FastAPI request object
        
    Raises:
        HTTPException: If rate limit exceeded
    """
    client_ip = request.client.host if request.client else "unknown"
    await rate_limiter.check_rate_limit(client_ip)


def get_client_ip(request: Request) -> str:
    """
    Get client IP address from request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Client IP address
    """
    # Check for forwarded headers (common in production behind proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in case of multiple forwarded IPs
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fallback to direct client IP
    return request.client.host if request.client else "unknown"