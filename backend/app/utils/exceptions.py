from typing import Optional, Any, Dict
from fastapi import status


class VideoProcessingException(Exception):
    """Custom exception for video processing errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class FileUploadException(VideoProcessingException):
    """Exception for file upload errors."""
    pass


class VideoValidationException(VideoProcessingException):
    """Exception for video validation errors."""
    pass


class ExternalAPIException(VideoProcessingException):
    """Exception for external API errors."""
    pass


class PicadabraAPIException(ExternalAPIException):
    """Exception for Picadabra API errors."""
    pass


class FalAPIException(ExternalAPIException):
    """Exception for Fal.ai API errors."""
    pass