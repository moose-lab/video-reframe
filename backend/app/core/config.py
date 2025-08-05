from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Video Reframe API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # External API Keys
    PICADABRA_API_KEY: str
    FAL_API_KEY: str
    
    # CORS Configuration
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 104857600  # 100MB
    ALLOWED_VIDEO_EXTENSIONS: List[str] = ["mp4", "avi", "mov", "mkv", "webm"]
    UPLOAD_DIR: str = "uploads"
    
    @field_validator("ALLOWED_VIDEO_EXTENSIONS", mode="before")
    @classmethod
    def assemble_extensions(cls, v) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    
    # External API URLs
    PICADABRA_BASE_URL: str = "https://api-test.picadabra.ai"
    FAL_BASE_URL: str = "https://fal.ai"
    
    # Video Processing Constraints
    MAX_VIDEO_RESOLUTION: tuple = (4096, 4096)  # Allow much larger videos
    SUPPORTED_ASPECT_RATIOS: List[str] = ["16:9", "9:16", "1:1", "4:3", "3:4"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()