import base64
import io
import tempfile
import os
from typing import Tuple, Optional
import cv2
from PIL import Image
from loguru import logger

from app.core.config import settings
from app.models.schemas import VideoValidationResult
from app.utils.exceptions import VideoValidationException


class VideoValidator:
    """Utility class for video validation."""
    
    @staticmethod
    def decode_base64_video(base64_data: str) -> bytes:
        """Decode base64 video data."""
        try:
            # Remove data URL prefix if present
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]
            
            return base64.b64decode(base64_data)
        except Exception as e:
            logger.error(f"Error decoding base64 video: {str(e)}")
            raise VideoValidationException("Invalid base64 video data")
    
    @staticmethod
    def validate_file_size(video_data: bytes) -> None:
        """Validate video file size."""
        file_size = len(video_data)
        if file_size > settings.MAX_FILE_SIZE:
            raise VideoValidationException(
                f"File size ({file_size} bytes) exceeds maximum allowed size ({settings.MAX_FILE_SIZE} bytes)"
            )
    
    @staticmethod
    def get_video_info(video_data: bytes) -> Tuple[int, int, float, str]:
        """Get video information using OpenCV."""
        try:
            # Write video data to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
                temp_file.write(video_data)
                temp_path = temp_file.name
            
            try:
                # Open video with OpenCV
                cap = cv2.VideoCapture(temp_path)
                
                if not cap.isOpened():
                    raise VideoValidationException("Cannot open video file")
                
                # Get video properties
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                
                duration = frame_count / fps if fps > 0 else 0
                
                # Get format info
                fourcc = int(cap.get(cv2.CAP_PROP_FOURCC))
                format_code = "".join([chr((fourcc >> 8 * i) & 0xFF) for i in range(4)])
                
                cap.release()
                
                return width, height, duration, format_code
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                    
        except Exception as e:
            logger.error(f"Error getting video info: {str(e)}")
            raise VideoValidationException(f"Cannot analyze video: {str(e)}")
    
    @staticmethod
    def validate_video_resolution(width: int, height: int) -> None:
        """Validate video resolution constraints."""
        max_width, max_height = settings.MAX_VIDEO_RESOLUTION
        
        if width > max_width or height > max_height:
            raise VideoValidationException(
                f"Video resolution ({width}x{height}) exceeds maximum allowed resolution ({max_width}x{max_height})"
            )
    
    @staticmethod
    def validate_video_format(mime_type: str, format_code: str) -> None:
        """Validate video format."""
        # Extract extension from mime type
        if "/" in mime_type:
            format_ext = mime_type.split("/")[1].lower()
            
            # Handle special cases
            if format_ext == "quicktime":
                format_ext = "mov"
            
            if format_ext not in settings.ALLOWED_VIDEO_EXTENSIONS:
                raise VideoValidationException(
                    f"Video format '{format_ext}' is not supported. "
                    f"Allowed formats: {', '.join(settings.ALLOWED_VIDEO_EXTENSIONS)}"
                )
    
    @classmethod
    def validate_video(
        cls,
        base64_data: str,
        mime_type: str,
        filename: str
    ) -> VideoValidationResult:
        """
        Comprehensive video validation.
        
        Args:
            base64_data: Base64 encoded video data
            mime_type: MIME type of the video
            filename: Original filename
            
        Returns:
            VideoValidationResult with validation details
        """
        errors = []
        width = height = duration = None
        format_info = None
        
        try:
            # Decode base64 data
            video_data = cls.decode_base64_video(base64_data)
            file_size = len(video_data)
            
            # Validate file size
            try:
                cls.validate_file_size(video_data)
            except VideoValidationException as e:
                errors.append(str(e))
            
            # Get video information
            try:
                width, height, duration, format_code = cls.get_video_info(video_data)
                format_info = format_code
                
                # Validate resolution
                try:
                    cls.validate_video_resolution(width, height)
                except VideoValidationException as e:
                    errors.append(str(e))
                
                # Validate format
                try:
                    cls.validate_video_format(mime_type, format_code)
                except VideoValidationException as e:
                    errors.append(str(e))
                    
            except VideoValidationException as e:
                errors.append(str(e))
            
            return VideoValidationResult(
                is_valid=len(errors) == 0,
                width=width,
                height=height,
                duration=duration,
                format=format_info,
                size=file_size,
                errors=errors
            )
            
        except Exception as e:
            logger.error(f"Unexpected error during video validation: {str(e)}")
            errors.append(f"Validation failed: {str(e)}")
            
            return VideoValidationResult(
                is_valid=False,
                errors=errors
            )