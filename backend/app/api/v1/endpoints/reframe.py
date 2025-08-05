from fastapi import APIRouter, HTTPException, status, Depends, Query
from loguru import logger

from app.models.schemas import (
    VideoReframeRequest,
    VideoReframeResponse,
    JobStatusRequest,
    JobStatusResponse
)
from app.services.fal_service import FalService
from app.utils.exceptions import FalAPIException

router = APIRouter()


def get_fal_service() -> FalService:
    """Dependency to get Fal service instance."""
    return FalService()


@router.post("/reframe", response_model=VideoReframeResponse)
async def reframe_video(
    reframe_request: VideoReframeRequest,
    fal_service: FalService = Depends(get_fal_service)
):
    """
    Submit video reframe job to Fal.ai API.
    
    This endpoint:
    1. Validates the reframe request
    2. Submits job to Fal.ai Luma Dream Machine API
    3. Returns job ID for status tracking
    
    Args:
        reframe_request: Video reframe request data
        fal_service: Fal service dependency
        
    Returns:
        VideoReframeResponse with job submission result
        
    Raises:
        HTTPException: If job submission fails
    """
    try:
        logger.info(f"Processing video reframe request for: {reframe_request.video_url}")
        logger.info(f"Prompt: {reframe_request.prompt}")
        logger.info(f"Aspect ratio: {reframe_request.aspect_ratio}")
        
        # Submit reframe job
        reframe_response = await fal_service.submit_reframe_job(reframe_request)
        
        if reframe_response.success:
            logger.info(f"Reframe job submitted successfully: {reframe_response.job_id}")
        else:
            logger.error(f"Reframe job submission failed: {reframe_response.message}")
        
        return reframe_response
        
    except FalAPIException as e:
        logger.error(f"Fal.ai API error: {e.message}")
        raise HTTPException(
            status_code=e.status_code,
            detail={
                "error": "Reframe job submission failed",
                "message": e.message,
                "details": e.details
            }
        )
        
    except Exception as e:
        logger.error(f"Unexpected error during reframe submission: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal server error",
                "message": "An unexpected error occurred during reframe submission"
            }
        )


@router.get("/reframe/status/{job_id}", response_model=JobStatusResponse)
async def get_reframe_status(
    job_id: str,
    fal_service: FalService = Depends(get_fal_service)
):
    """
    Get status of a reframe job.
    
    Args:
        job_id: Job ID to check status for
        fal_service: Fal service dependency
        
    Returns:
        JobStatusResponse with job status
        
    Raises:
        HTTPException: If status check fails
    """
    try:
        logger.info(f"Checking status for reframe job: {job_id}")
        
        status_response = await fal_service.get_job_status(job_id)
        
        logger.info(f"Job {job_id} status: {status_response.status}")
        
        return status_response
        
    except FalAPIException as e:
        logger.error(f"Fal.ai status check error: {e.message}")
        raise HTTPException(
            status_code=e.status_code,
            detail={
                "error": "Status check failed",
                "message": e.message,
                "details": e.details
            }
        )
        
    except Exception as e:
        logger.error(f"Unexpected error during status check: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal server error",
                "message": "An unexpected error occurred during status check"
            }
        )


@router.post("/reframe/wait/{job_id}", response_model=JobStatusResponse)
async def wait_for_reframe_completion(
    job_id: str,
    max_wait_time: int = Query(default=300, ge=30, le=600, description="Maximum wait time in seconds"),
    poll_interval: int = Query(default=10, ge=5, le=30, description="Poll interval in seconds"),
    fal_service: FalService = Depends(get_fal_service)
):
    """
    Wait for reframe job completion by polling status.
    
    This endpoint will poll the job status until completion or timeout.
    Use this for synchronous workflows where you want to wait for the result.
    
    Args:
        job_id: Job ID to wait for
        max_wait_time: Maximum time to wait in seconds (30-600)
        poll_interval: Time between status checks in seconds (5-30)
        fal_service: Fal service dependency
        
    Returns:
        JobStatusResponse with final job status
        
    Raises:
        HTTPException: If job fails or times out
    """
    try:
        logger.info(f"Waiting for completion of reframe job: {job_id}")
        logger.info(f"Max wait time: {max_wait_time}s, Poll interval: {poll_interval}s")
        
        final_status = await fal_service.wait_for_completion(
            job_id=job_id,
            max_wait_time=max_wait_time,
            poll_interval=poll_interval
        )
        
        logger.info(f"Job {job_id} final status: {final_status.status}")
        
        return final_status
        
    except FalAPIException as e:
        logger.error(f"Fal.ai wait error: {e.message}")
        raise HTTPException(
            status_code=e.status_code,
            detail={
                "error": "Job wait failed",
                "message": e.message,
                "details": e.details
            }
        )
        
    except Exception as e:
        logger.error(f"Unexpected error during job wait: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal server error",
                "message": "An unexpected error occurred while waiting for job completion"
            }
        )


@router.get("/reframe/health")
async def reframe_service_health(
    fal_service: FalService = Depends(get_fal_service)
):
    """
    Check reframe service health.
    
    Returns:
        dict: Health status of reframe service
    """
    try:
        fal_healthy = await fal_service.health_check()
        
        return {
            "status": "healthy" if fal_healthy else "degraded",
            "fal_api": "healthy" if fal_healthy else "unhealthy",
            "details": {
                "fal_accessible": fal_healthy
            }
        }
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return {
            "status": "unhealthy",
            "fal_api": "unknown",
            "error": str(e)
        }