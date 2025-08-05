from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator
from enum import Enum


class AspectRatio(str, Enum):
    """Supported aspect ratios."""
    LANDSCAPE = "16:9"
    PORTRAIT = "9:16"
    SQUARE = "1:1"
    STANDARD = "4:3"
    PORTRAIT_STANDARD = "3:4"


class VideoUploadRequest(BaseModel):
    """Request model for video upload."""
    mimeType: str = Field(..., description="MIME type of the video file")
    base64Data: str = Field(..., description="Base64 encoded video data")
    fileName: str = Field(..., description="Original filename")
    prefix: str = Field(default="uploads/videos", description="Upload prefix")
    
    @validator("mimeType")
    def validate_mime_type(cls, v):
        allowed_types = [
            "video/mp4", "video/avi", "video/mov", 
            "video/mkv", "video/webm", "video/quicktime"
        ]
        if v not in allowed_types:
            raise ValueError(f"Unsupported MIME type. Allowed types: {allowed_types}")
        return v
    
    @validator("base64Data")
    def validate_base64_data(cls, v):
        if not v or len(v) < 10:
            raise ValueError("Base64 data is required and must be valid")
        return v


class VideoUploadResponse(BaseModel):
    """Response model for video upload."""
    success: bool
    url: str
    message: str
    file_id: Optional[str] = None
    file_size: Optional[int] = None


class VideoReframeRequest(BaseModel):
    """Request model for video reframing."""
    video_url: str = Field(..., description="URL of the uploaded video")
    prompt: str = Field(..., min_length=1, max_length=500, description="Reframing prompt")
    aspect_ratio: AspectRatio = Field(..., description="Target aspect ratio")
    
    @validator("video_url")
    def validate_video_url(cls, v):
        if not v or not v.startswith(("http://", "https://")):
            raise ValueError("Valid video URL is required")
        return v


class VideoReframeResponse(BaseModel):
    """Response model for video reframing."""
    success: bool
    message: str
    job_id: Optional[str] = None
    status: Optional[str] = None
    result_url: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None


class JobStatusRequest(BaseModel):
    """Request model for job status check."""
    job_id: str = Field(..., description="Job ID to check status")


class JobStatusResponse(BaseModel):
    """Response model for job status."""
    job_id: str
    status: str
    progress: Optional[float] = Field(None, ge=0.0, le=1.0)
    result_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    service: str
    version: str


class VideoValidationResult(BaseModel):
    """Video validation result model."""
    is_valid: bool
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    format: Optional[str] = None
    size: Optional[int] = None
    errors: List[str] = Field(default_factory=list)


class PicadabraUploadRequest(BaseModel):
    """Picadabra API upload request model."""
    mimeType: str
    base64Data: str
    prefix: str
    fileName: str


class PicadabraUploadResponse(BaseModel):
    """Picadabra API upload response model."""
    success: bool
    url: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


class FalReframeRequest(BaseModel):
    """Fal.ai reframe request model."""
    video_url: str
    prompt: str
    aspect_ratio: str


class FalReframeResponse(BaseModel):
    """Fal.ai reframe response model."""
    request_id: Optional[str] = None
    status: Optional[str] = None
    video_url: Optional[str] = None
    error: Optional[Dict[str, Any]] = None