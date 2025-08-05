# Video Reframe API Backend

A FastAPI backend service for video reframing using AI models. This service integrates with Picadabra API for file uploads and Fal.ai Luma Dream Machine for video reframing.

## Features

- **Video Upload**: Upload videos to Picadabra API with validation
- **Video Reframing**: AI-powered video reframing using Fal.ai Luma Dream Machine
- **Async Processing**: Asynchronous job submission and status tracking
- **Validation**: Comprehensive video file validation (format, size, resolution)
- **Error Handling**: Robust error handling with detailed responses
- **Rate Limiting**: Built-in rate limiting for API protection
- **Logging**: Structured logging with configurable levels
- **Health Checks**: Service health monitoring endpoints
- **Docker Support**: Containerization for easy deployment

## Requirements

- Python 3.11+
- FFmpeg (for video processing)
- Docker (optional, for containerized deployment)

## API Keys Required

- **Picadabra API Key**: For video file uploads
- **Fal.ai API Key**: For video reframing

## Installation

### Local Development

1. **Clone the repository** (if not already done):
   ```bash
   cd video-reframe/backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env file with your API keys
   ```

5. **Run the application**:
   ```bash
   ./start.sh
   # Or manually:
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Docker Deployment

1. **Build and run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

2. **Or build and run manually**:
   ```bash
   docker build -t video-reframe-api .
   docker run -p 8000:8000 --env-file .env video-reframe-api
   ```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Video Upload
- `POST /api/v1/video/upload` - Upload video file
- `GET /api/v1/video/upload/health` - Upload service health

### Video Reframing
- `POST /api/v1/video/reframe` - Submit reframe job
- `GET /api/v1/video/reframe/status/{job_id}` - Get job status
- `POST /api/v1/video/reframe/wait/{job_id}` - Wait for job completion
- `GET /api/v1/video/reframe/health` - Reframe service health

### API Documentation
- `GET /api/v1/docs` - Interactive API documentation (Swagger UI)
- `GET /api/v1/redoc` - API documentation (ReDoc)

## Configuration

The application is configured via environment variables in the `.env` file:

### Required Variables
```env
PICADABRA_API_KEY=your_picadabra_api_key
FAL_API_KEY=your_fal_api_key
```

### Optional Variables
```env
# API Configuration
DEBUG=True
API_V1_STR=/api/v1
PROJECT_NAME=Video Reframe API
VERSION=1.0.0

# CORS Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# File Upload Configuration
MAX_FILE_SIZE=104857600  # 100MB
ALLOWED_VIDEO_EXTENSIONS=mp4,avi,mov,mkv,webm
UPLOAD_DIR=uploads

# Logging Configuration
LOG_LEVEL=INFO

# External API URLs
PICADABRA_BASE_URL=https://api-test.picadabra.ai
FAL_BASE_URL=https://fal.ai
```

## Video Requirements

- **Maximum file size**: 100MB
- **Maximum resolution**: 512x512 pixels
- **Supported formats**: MP4, AVI, MOV, MKV, WebM
- **Supported aspect ratios**: 16:9, 9:16, 1:1, 4:3, 3:4

## API Usage Examples

### Upload Video
```bash
curl -X POST "http://localhost:8000/api/v1/video/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "mimeType": "video/mp4",
    "base64Data": "data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE...",
    "fileName": "sample.mp4",
    "prefix": "uploads/videos"
  }'
```

### Submit Reframe Job
```bash
curl -X POST "http://localhost:8000/api/v1/video/reframe" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://api-test.picadabra.ai/uploads/videos/sample.mp4",
    "prompt": "Reframe this video to focus on the main subject",
    "aspect_ratio": "16:9"
  }'
```

### Check Job Status
```bash
curl -X GET "http://localhost:8000/api/v1/video/reframe/status/job_id_here"
```

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "additional": "error details"
  }
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `413` - Payload Too Large
- `422` - Unprocessable Entity (validation errors)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

## Development

### Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── api/
│   │   └── v1/
│   │       ├── api.py       # API router
│   │       └── endpoints/   # API endpoints
│   ├── core/
│   │   ├── config.py        # Configuration
│   │   ├── logging.py       # Logging setup
│   │   └── security.py      # Security utilities
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── services/
│   │   ├── picadabra_service.py  # Picadabra integration
│   │   └── fal_service.py        # Fal.ai integration
│   └── utils/
│       ├── exceptions.py    # Custom exceptions
│       └── video_validator.py    # Video validation
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── start.sh
└── README.md
```

### Adding New Features

1. **Add new endpoints**: Create new routers in `app/api/v1/endpoints/`
2. **Add new models**: Define Pydantic models in `app/models/schemas.py`
3. **Add new services**: Create service classes in `app/services/`
4. **Add configuration**: Update `app/core/config.py`

### Testing

To run tests (when implemented):
```bash
pytest
```

## Monitoring

### Health Checks
- Main service: `GET /health`
- Upload service: `GET /api/v1/video/upload/health`
- Reframe service: `GET /api/v1/video/reframe/health`

### Logging
Logs are written to stdout and optionally to files in the `logs/` directory.

### Metrics
The application includes request timing headers and structured logging for monitoring.

## Security

- **Rate limiting**: Built-in per-IP rate limiting
- **Input validation**: Comprehensive request validation
- **File validation**: Video file format and size validation
- **CORS protection**: Configurable CORS origins
- **Security headers**: Standard security headers

## Deployment

### Production Considerations

1. **Set DEBUG=False** in production
2. **Configure proper CORS origins**
3. **Set up reverse proxy** (nginx/Apache) for SSL termination
4. **Monitor logs and metrics**
5. **Set up proper backup** for uploaded files
6. **Configure rate limiting** based on your needs

### Environment Variables for Production
```env
DEBUG=False
LOG_LEVEL=WARNING
ALLOWED_ORIGINS=https://yourdomain.com
```

## Troubleshooting

### Common Issues

1. **API Key errors**: Ensure your Picadabra and Fal.ai API keys are valid
2. **File upload failures**: Check file size and format requirements
3. **Connection errors**: Verify network connectivity to external APIs
4. **Permission errors**: Ensure proper file permissions for uploads directory

### Debug Mode
Set `DEBUG=True` in `.env` to enable:
- Interactive API documentation
- Detailed error messages
- Request/response logging

## License

[Your License Here]