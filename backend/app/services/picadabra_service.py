from typing import Optional
import httpx
from loguru import logger

from app.core.config import settings
from app.models.schemas import (
    PicadabraUploadRequest,
    PicadabraUploadResponse,
    VideoUploadRequest,
    VideoUploadResponse
)
from app.utils.exceptions import PicadabraAPIException


class PicadabraService:
    """Service for interacting with Picadabra API."""
    
    def __init__(self):
        self.base_url = settings.PICADABRA_BASE_URL
        self.api_key = settings.PICADABRA_API_KEY
        self.timeout = 60.0  # 60 seconds timeout
    
    async def upload_video(self, upload_request: VideoUploadRequest) -> VideoUploadResponse:
        """
        Upload video to Picadabra API.
        
        Args:
            upload_request: Video upload request data
            
        Returns:
            VideoUploadResponse with upload result
            
        Raises:
            PicadabraAPIException: If upload fails
        """
        try:
            # Prepare request data for Picadabra API
            picadabra_request = PicadabraUploadRequest(
                mimeType=upload_request.mimeType,
                base64Data=upload_request.base64Data,
                prefix=upload_request.prefix,
                fileName=upload_request.fileName
            )
            
            logger.info(f"Uploading video to Picadabra: {upload_request.fileName}")
            
            # Make API request
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/file-upload",
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": f"Bearer {self.api_key}"  # Assuming Bearer token auth
                    },
                    json=picadabra_request.dict()
                )
                
                logger.info(f"Picadabra API response status: {response.status_code}")
                
                # Handle response
                if response.status_code == 200:
                    response_data = response.json()
                    
                    # Parse Picadabra response
                    picadabra_response = PicadabraUploadResponse(**response_data)
                    
                    if picadabra_response.success and picadabra_response.url:
                        logger.info(f"Video uploaded successfully: {picadabra_response.url}")
                        
                        return VideoUploadResponse(
                            success=True,
                            url=picadabra_response.url,
                            message="Video uploaded successfully",
                            file_id=self._extract_file_id(picadabra_response.url),
                            file_size=len(upload_request.base64Data)
                        )
                    else:
                        error_msg = picadabra_response.message or "Upload failed"
                        logger.error(f"Picadabra upload failed: {error_msg}")
                        
                        raise PicadabraAPIException(
                            message=f"Upload failed: {error_msg}",
                            details={"picadabra_response": response_data}
                        )
                
                else:
                    # Handle HTTP errors
                    error_text = response.text
                    logger.error(f"Picadabra API error {response.status_code}: {error_text}")
                    
                    raise PicadabraAPIException(
                        message=f"Upload failed with status {response.status_code}",
                        status_code=response.status_code,
                        details={"error_text": error_text}
                    )
                    
        except httpx.TimeoutException:
            logger.error("Picadabra API request timed out")
            raise PicadabraAPIException(
                message="Upload request timed out",
                details={"timeout": self.timeout}
            )
            
        except httpx.RequestError as e:
            logger.error(f"Picadabra API request error: {str(e)}")
            raise PicadabraAPIException(
                message=f"Upload request failed: {str(e)}",
                details={"request_error": str(e)}
            )
            
        except Exception as e:
            logger.error(f"Unexpected error during Picadabra upload: {str(e)}")
            raise PicadabraAPIException(
                message=f"Upload failed: {str(e)}",
                details={"error": str(e)}
            )
    
    def _extract_file_id(self, url: str) -> Optional[str]:
        """Extract file ID from Picadabra URL."""
        try:
            # Assuming URL format like: https://api-test.picadabra.ai/uploads/videos/file_id.mp4
            if "/uploads/" in url:
                parts = url.split("/")
                filename = parts[-1]
                # Remove extension to get file ID
                file_id = filename.split(".")[0] if "." in filename else filename
                return file_id
        except Exception as e:
            logger.warning(f"Could not extract file ID from URL {url}: {str(e)}")
        
        return None
    
    async def health_check(self) -> bool:
        """
        Check if Picadabra API is accessible.
        
        Returns:
            bool: True if API is accessible, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/health",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                return response.status_code == 200
        except Exception:
            return False