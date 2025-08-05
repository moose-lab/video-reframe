# Video Reframe Application - Integration Setup Guide

## Overview

This guide provides comprehensive instructions for setting up and running the Video Reframe application with full frontend-backend integration.

## Architecture Summary

- **Frontend**: Next.js 14 with TypeScript, TailwindCSS, and Zustand state management
- **Backend**: FastAPI with Python 3.11, integrates with Picadabra.ai and Fal.ai APIs
- **Integration**: RESTful API communication with CORS support

## Prerequisites

### System Requirements
- Node.js 18.0.0 or higher
- Python 3.11 or higher
- Docker and Docker Compose (optional but recommended)

### External API Keys Required
- **Picadabra API Key**: For video file upload and storage
- **Fal.ai API Key**: For AI-powered video reframing

## Setup Instructions

### 1. Clone and Initial Setup

```bash
cd /Users/moose/A1D/video-reframe
```

### 2. Backend Setup

#### Option A: Docker Setup (Recommended)

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env file and add your API keys:
# PICADABRA_API_KEY=your_picadabra_api_key_here
# FAL_API_KEY=your_fal_api_key_here

# Build and start with Docker Compose
docker-compose up --build
```

#### Option B: Local Python Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env file with your API keys

# Create necessary directories
mkdir -p uploads logs

# Start the server
chmod +x start.sh
./start.sh
# Or directly: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
# From project root
cd /Users/moose/A1D/video-reframe

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# The default API URL should work: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# Start development server
npm run dev
```

## Integration Architecture

### API Endpoints Integration

The frontend communicates with the backend through these integrated workflows:

#### Video Processing Workflow
1. **Upload Phase**: `POST /api/v1/video/upload`
   - Frontend converts video file to base64
   - Backend validates video (512x512 resolution requirement)
   - Backend uploads to Picadabra API
   - Returns video URL for processing

2. **Reframe Phase**: `POST /api/v1/video/reframe`
   - Frontend submits reframe job with video URL, prompt, and aspect ratio
   - Backend submits job to Fal.ai Luma Dream Machine
   - Returns job ID for tracking

3. **Status Tracking**: `GET /api/v1/video/reframe/status/{job_id}`
   - Frontend polls for job completion
   - Backend queries Fal.ai for job status
   - Returns current status and result URL when complete

#### Health Check Endpoints
- `GET /health` - Overall API health
- `GET /api/v1/video/upload/health` - Picadabra service health
- `GET /api/v1/video/reframe/health` - Fal.ai service health

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (Next.js dev server)
- `http://127.0.0.1:3000` (alternative localhost)

## Testing Integration

### 1. Health Check Tests

```bash
# Test backend health
curl http://localhost:8000/health

# Test service health
curl http://localhost:8000/api/v1/video/upload/health
curl http://localhost:8000/api/v1/video/reframe/health
```

### 2. Frontend-Backend Integration Test

1. Start both servers (backend on :8000, frontend on :3000)
2. Open browser to `http://localhost:3000`
3. Upload a 512x512 MP4 video file
4. Enter a descriptive prompt (e.g., "Make this video more cinematic")
5. Select an aspect ratio (16:9, 9:16, 1:1, 4:3, or 3:4)
6. Click "Generate Reframed Video"
7. Monitor progress and wait for completion

### 3. Error Scenarios to Test

- **Invalid file format**: Upload non-video file
- **Wrong resolution**: Upload video that's not 512x512
- **Large file**: Upload file > 100MB
- **API key issues**: Invalid or missing API keys
- **Network errors**: Backend down during request

## File Structure and Key Integration Points

### Frontend API Client (`/src/lib/api.ts`)
- **Updated base URL**: Points to `http://localhost:8000/api/v1`
- **Integrated workflow**: Combines upload + reframe + status polling
- **Error handling**: Maps backend errors to user-friendly messages
- **File conversion**: Converts File objects to base64 for backend

### Backend Configuration (`/backend/app/core/config.py`)
- **CORS origins**: Configured for frontend URLs
- **File constraints**: 100MB max, 512x512 resolution requirement
- **API integrations**: Picadabra and Fal.ai endpoint configuration

### Backend Main App (`/backend/app/main.py`)
- **CORS middleware**: Allows frontend origins and credentials
- **Error handlers**: Standardized error responses
- **Request logging**: Performance timing headers

## Environment Variables Reference

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=Video Reframe
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_MAX_FILE_SIZE=104857600
NEXT_PUBLIC_ACCEPTED_FORMATS=video/mp4,video/webm,video/mov
NODE_ENV=development
```

### Backend (`.env`)
```env
# Required API Keys
PICADABRA_API_KEY=your_picadabra_api_key_here
FAL_API_KEY=your_fal_api_key_here

# Application Configuration
DEBUG=True
API_V1_STR=/api/v1
PROJECT_NAME=Video Reframe API
VERSION=1.0.0

# CORS Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# File Upload Configuration
MAX_FILE_SIZE=104857600
ALLOWED_VIDEO_EXTENSIONS=mp4,avi,mov,mkv,webm
UPLOAD_DIR=uploads

# Logging
LOG_LEVEL=INFO

# External APIs
PICADABRA_BASE_URL=https://api-test.picadabra.ai
FAL_BASE_URL=https://fal.ai
```

## Deployment Considerations

### Production Configuration
- Set `DEBUG=False` in backend
- Configure proper CORS origins for production domain
- Use environment-specific API keys
- Set up proper logging and monitoring
- Configure Docker for production deployment

### Security Notes
- API keys should be kept secure and not committed to version control
- CORS origins should be restricted to your domain in production
- Consider rate limiting for production use
- Video files are uploaded to Picadabra (external service)

## Troubleshooting Common Issues

### Backend Won't Start
- Check Python dependencies are installed
- Verify `.env` file exists with required API keys
- Ensure port 8000 is available
- Check logs for specific error messages

### Frontend Can't Connect to Backend
- Verify backend is running on port 8000
- Check CORS configuration in backend
- Confirm `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.local`
- Test backend health endpoint directly

### Video Upload Fails
- Verify video is 512x512 resolution
- Check file size is under 100MB
- Ensure video format is supported (MP4, WebM, MOV)
- Verify Picadabra API key is valid

### Reframe Job Fails
- Check Fal.ai API key is valid
- Monitor backend logs for API errors
- Verify video URL from upload is accessible
- Check prompt and aspect ratio are valid

## API Integration Flow Diagram

```
Frontend Upload → Backend Validation → Picadabra Upload → Backend Response
       ↓
Frontend Reframe Request → Backend → Fal.ai Job Submission → Job ID Response
       ↓
Frontend Status Polling → Backend → Fal.ai Status Check → Status Response
       ↓
Job Complete → Frontend Downloads Result → Display to User
```

This integration provides a complete end-to-end video reframing workflow with proper error handling, progress tracking, and user feedback.