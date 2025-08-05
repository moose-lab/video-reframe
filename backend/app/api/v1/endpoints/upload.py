from fastapi import APIRouter, HTTPException, status, Depends
from loguru import logger

from app.models.schemas import VideoUploadRequest, VideoUploadResponse
from app.services.picadabra_service import PicadabraService
from app.utils.video_validator import VideoValidator
from app.utils.exceptions import VideoValidationException, PicadabraAPIException

router = APIRouter()


def get_picadabra_service() -> PicadabraService:
    """Dependency to get Picadabra service instance."""
    return PicadabraService()


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(
    upload_request: VideoUploadRequest,
    picadabra_service: PicadabraService = Depends(get_picadabra_service)
):
    """
    Upload video file to Picadabra API.
    
    This endpoint:
    1. Validates the video file (size, format, resolution)
    2. Uploads to Picadabra API
    3. Returns the uploaded video URL
    
    Args:
        upload_request: Video upload request data
        picadabra_service: Picadabra service dependency
        
    Returns:
        VideoUploadResponse with upload result
        
    Raises:
        HTTPException: If validation or upload fails
    """
    try:
        logger.info(f"Processing video upload: {upload_request.fileName}")
        
        # Validate video file
        validation_result = VideoValidator.validate_video(
            base64_data=upload_request.base64Data,
            mime_type=upload_request.mimeType,
            filename=upload_request.fileName
        )
        
        if not validation_result.is_valid:
            logger.error(f"Video validation failed: {validation_result.errors}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Video validation failed",
                    "message": "The uploaded video does not meet the requirements",
                    "validation_errors": validation_result.errors,
                    "video_info": {
                        "width": validation_result.width,
                        "height": validation_result.height,
                        "duration": validation_result.duration,
                        "format": validation_result.format,
                        "size": validation_result.size
                    }
                }
            )
        
        logger.info(f"Video validation passed: {validation_result.width}x{validation_result.height}, "
                   f"{validation_result.duration:.2f}s, {validation_result.size} bytes")
        
        # Upload to Picadabra
        upload_response = await picadabra_service.upload_video(upload_request)
        
        logger.info(f"Video uploaded successfully: {upload_response.url}")
        
        return upload_response
        
    except VideoValidationException as e:
        logger.error(f"Video validation error: {e.message}")
        raise HTTPException(
            status_code=e.status_code,
            detail={
                "error": "Video validation failed",
                "message": e.message,
                "details": e.details
            }
        )
        
    except PicadabraAPIException as e:
        logger.error(f"Picadabra API error: {e.message}")
        raise HTTPException(
            status_code=e.status_code,
            detail={
                "error": "Upload failed",
                "message": e.message,
                "details": e.details
            }
        )
        
    except Exception as e:
        logger.error(f"Unexpected error during video upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal server error",
                "message": "An unexpected error occurred during upload"
            }
        )


@router.get("/upload/health")
async def upload_service_health(
    picadabra_service: PicadabraService = Depends(get_picadabra_service)
):
    """
    Check upload service health.
    
    Returns:
        dict: Health status of upload service
    """
    try:
        picadabra_healthy = await picadabra_service.health_check()
        
        return {
            "status": "healthy" if picadabra_healthy else "degraded",
            "picadabra_api": "healthy" if picadabra_healthy else "unhealthy",
            "details": {
                "picadabra_accessible": picadabra_healthy
            }
        }
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return {
            "status": "unhealthy",
            "picadabra_api": "unknown",
            "error": str(e)
        }