from fastapi import APIRouter

from app.api.v1.endpoints import upload_router, reframe_router

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(upload_router, prefix="/video", tags=["video-upload"])
api_router.include_router(reframe_router, prefix="/video", tags=["video-reframe"])