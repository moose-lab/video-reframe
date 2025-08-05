from typing import Optional, Dict, Any
import httpx
import asyncio
from loguru import logger

from app.core.config import settings
from app.models.schemas import (
    FalReframeRequest,
    FalReframeResponse,
    VideoReframeRequest,
    VideoReframeResponse,
    JobStatusResponse,
    AspectRatio
)
from app.utils.exceptions import FalAPIException


class FalService:
    """Service for interacting with Fal.ai API."""
    
    def __init__(self):
        self.base_url = settings.FAL_BASE_URL
        self.api_key = settings.FAL_API_KEY
        self.timeout = 120.0  # 2 minutes timeout for initial request
        self.status_timeout = 30.0  # 30 seconds for status checks
        
        # Fal.ai API endpoints
        self.reframe_endpoint = "/models/fal-ai/luma-dream-machine/ray-2-flash/reframe/api"
        
    async def submit_reframe_job(self, reframe_request: VideoReframeRequest) -> VideoReframeResponse:
        """
        Submit video reframe job to Fal.ai API.
        
        Args:
            reframe_request: Video reframe request data
            
        Returns:
            VideoReframeResponse with job submission result
            
        Raises:
            FalAPIException: If job submission fails
        """
        try:
            # Prepare request data for Fal.ai API
            fal_request = FalReframeRequest(
                video_url=reframe_request.video_url,
                prompt=reframe_request.prompt,
                aspect_ratio=reframe_request.aspect_ratio.value
            )
            
            logger.info(f"Submitting reframe job to Fal.ai: {reframe_request.video_url}")
            logger.info(f"Prompt: {reframe_request.prompt}")
            logger.info(f"Aspect ratio: {reframe_request.aspect_ratio}")
            
            # Make API request
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}{self.reframe_endpoint}",
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": f"Key {self.api_key}"
                    },
                    json={
                        "video_url": fal_request.video_url,
                        "prompt": fal_request.prompt,
                        "aspect_ratio": fal_request.aspect_ratio,
                        "enable_safety_checker": True,
                        "output_format": "mp4"
                    }
                )
                
                logger.info(f"Fal.ai API response status: {response.status_code}")
                
                # Handle response
                if response.status_code in [200, 201, 202]:
                    response_data = response.json()
                    
                    # Check if job was submitted successfully
                    if "request_id" in response_data:
                        job_id = response_data["request_id"]
                        logger.info(f"Reframe job submitted successfully: {job_id}")
                        
                        return VideoReframeResponse(
                            success=True,
                            message="Reframe job submitted successfully",
                            job_id=job_id,
                            status="submitted"
                        )
                    
                    # Check if result is immediately available (synchronous response)
                    elif "video_url" in response_data:
                        result_url = response_data["video_url"]
                        logger.info(f"Reframe completed immediately: {result_url}")
                        
                        return VideoReframeResponse(
                            success=True,
                            message="Video reframed successfully",
                            status="completed",
                            result_url=result_url
                        )
                    
                    else:
                        logger.error(f"Unexpected Fal.ai response format: {response_data}")
                        
                        return VideoReframeResponse(
                            success=False,
                            message="Unexpected API response format",
                            error_details={"fal_response": response_data}
                        )
                
                else:
                    # Handle HTTP errors
                    error_text = response.text
                    error_data = {}
                    
                    try:
                        error_data = response.json()
                    except:
                        pass
                    
                    logger.error(f"Fal.ai API error {response.status_code}: {error_text}")
                    
                    raise FalAPIException(
                        message=f"Reframe job submission failed with status {response.status_code}",
                        status_code=response.status_code,
                        details={"error_text": error_text, "error_data": error_data}
                    )
                    
        except httpx.TimeoutException:
            logger.error("Fal.ai API request timed out")
            raise FalAPIException(
                message="Reframe job submission timed out",
                details={"timeout": self.timeout}
            )
            
        except httpx.RequestError as e:
            logger.error(f"Fal.ai API request error: {str(e)}")
            raise FalAPIException(
                message=f"Reframe job submission failed: {str(e)}",
                details={"request_error": str(e)}
            )
            
        except Exception as e:
            logger.error(f"Unexpected error during Fal.ai reframe submission: {str(e)}")
            raise FalAPIException(
                message=f"Reframe job submission failed: {str(e)}",
                details={"error": str(e)}
            )
    
    async def get_job_status(self, job_id: str) -> JobStatusResponse:
        """
        Get job status from Fal.ai API.
        
        Args:
            job_id: Job ID to check
            
        Returns:
            JobStatusResponse with job status
            
        Raises:
            FalAPIException: If status check fails
        """
        try:
            logger.info(f"Checking status for job: {job_id}")
            
            async with httpx.AsyncClient(timeout=self.status_timeout) as client:
                response = await client.get(
                    f"{self.base_url}/models/fal-ai/luma-dream-machine/ray-2-flash/reframe/requests/{job_id}",
                    headers={
                        "Accept": "application/json",
                        "Authorization": f"Key {self.api_key}"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    status = data.get("status", "unknown")
                    result_url = None
                    error_message = None
                    progress = None
                    
                    # Extract result URL if completed
                    if status == "COMPLETED" and "video_url" in data:
                        result_url = data["video_url"]
                    
                    # Extract error message if failed
                    elif status == "FAILED":
                        error_message = data.get("error", "Job failed without error message")
                    
                    # Extract progress if available
                    elif status == "IN_PROGRESS":
                        progress = data.get("progress", 0.5)  # Default to 50% if not specified
                    
                    logger.info(f"Job {job_id} status: {status}")
                    
                    return JobStatusResponse(
                        job_id=job_id,
                        status=status.lower(),
                        progress=progress,
                        result_url=result_url,
                        error_message=error_message,
                        created_at=data.get("created_at"),
                        completed_at=data.get("completed_at")
                    )
                
                elif response.status_code == 404:
                    logger.error(f"Job not found: {job_id}")
                    raise FalAPIException(
                        message=f"Job {job_id} not found",
                        status_code=404
                    )
                
                else:
                    error_text = response.text
                    logger.error(f"Fal.ai status check error {response.status_code}: {error_text}")
                    
                    raise FalAPIException(
                        message=f"Status check failed with status {response.status_code}",
                        status_code=response.status_code,
                        details={"error_text": error_text}
                    )
                    
        except httpx.TimeoutException:
            logger.error(f"Fal.ai status check timed out for job: {job_id}")
            raise FalAPIException(
                message="Status check timed out",
                details={"job_id": job_id, "timeout": self.status_timeout}
            )
            
        except httpx.RequestError as e:
            logger.error(f"Fal.ai status check request error: {str(e)}")
            raise FalAPIException(
                message=f"Status check failed: {str(e)}",
                details={"request_error": str(e)}
            )
            
        except Exception as e:
            logger.error(f"Unexpected error during Fal.ai status check: {str(e)}")
            raise FalAPIException(
                message=f"Status check failed: {str(e)}",
                details={"error": str(e)}
            )
    
    async def wait_for_completion(
        self,
        job_id: str,
        max_wait_time: int = 300,  # 5 minutes
        poll_interval: int = 10    # 10 seconds
    ) -> JobStatusResponse:
        """
        Wait for job completion by polling status.
        
        Args:
            job_id: Job ID to wait for
            max_wait_time: Maximum time to wait in seconds
            poll_interval: Time between status checks in seconds
            
        Returns:
            JobStatusResponse with final job status
            
        Raises:
            FalAPIException: If job fails or times out
        """
        start_time = asyncio.get_event_loop().time()
        
        while True:
            status_response = await self.get_job_status(job_id)
            
            if status_response.status in ["completed", "failed"]:
                return status_response
            
            # Check timeout
            elapsed_time = asyncio.get_event_loop().time() - start_time
            if elapsed_time > max_wait_time:
                logger.error(f"Job {job_id} timed out after {max_wait_time} seconds")
                raise FalAPIException(
                    message=f"Job {job_id} timed out",
                    details={"max_wait_time": max_wait_time, "elapsed_time": elapsed_time}
                )
            
            # Wait before next poll
            await asyncio.sleep(poll_interval)
    
    async def health_check(self) -> bool:
        """
        Check if Fal.ai API is accessible.
        
        Returns:
            bool: True if API is accessible, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/health",
                    headers={"Authorization": f"Key {self.api_key}"}
                )
                return response.status_code == 200
        except Exception:
            return False