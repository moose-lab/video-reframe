import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { VideoProcessingResponse, AspectRatio, ApiConfig } from '@/types';

// API Configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 30000, // 30 seconds
  maxFileSize: 100 * 1024 * 1024, // 100MB
};

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: DEFAULT_CONFIG.baseUrl,
    timeout: DEFAULT_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add any auth headers here if needed
      // config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle common errors
      if (error.response?.status === 413) {
        throw new Error('File too large. Please upload a smaller video.');
      }
      if (error.response?.status === 415) {
        throw new Error('Unsupported file format. Please upload MP4, WebM, or MOV.');
      }
      if (error.response?.status === 422) {
        throw new Error('Invalid video dimensions. Video must be 512x512 pixels.');
      }
      if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw error;
    }
  );

  return client;
};

const apiClient = createApiClient();

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:video/mp4;base64, prefix
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

// API Functions
export const videoApi = {
  /**
   * Upload video file to backend
   */
  uploadVideo: async (videoFile: File): Promise<{success: boolean, url: string, message: string}> => {
    const base64Data = await fileToBase64(videoFile);
    
    const uploadRequest = {
      mimeType: videoFile.type,
      base64Data: base64Data,
      fileName: videoFile.name,
      prefix: 'uploads/videos'
    };

    const response = await apiClient.post('/video/upload', uploadRequest);
    return response.data;
  },

  /**
   * Submit video reframe job
   */
  reframeVideo: async (
    videoUrl: string,
    prompt: string,
    aspectRatio: AspectRatio
  ): Promise<{success: boolean, job_id: string, message: string}> => {
    const reframeRequest = {
      video_url: videoUrl,
      prompt: prompt,
      aspect_ratio: aspectRatio
    };

    const response = await apiClient.post('/video/reframe', reframeRequest);
    return response.data;
  },

  /**
   * Upload and process a video for reframing (combined workflow)
   */
  processVideo: async (
    videoFile: File,
    prompt: string,
    aspectRatio: AspectRatio
  ): Promise<VideoProcessingResponse> => {
    try {
      // Step 1: Upload video
      const uploadResponse = await videoApi.uploadVideo(videoFile);
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || 'Video upload failed');
      }

      // Step 2: Submit reframe job
      const reframeResponse = await videoApi.reframeVideo(
        uploadResponse.url,
        prompt,
        aspectRatio
      );

      if (!reframeResponse.success) {
        throw new Error(reframeResponse.message || 'Reframe job submission failed');
      }

      // Step 3: Wait for completion
      const finalStatus = await videoApi.waitForCompletion(reframeResponse.job_id);

      // Return combined response in expected format
      return {
        id: reframeResponse.job_id,
        status: finalStatus.status,
        originalVideo: uploadResponse.url,
        reframedVideo: finalStatus.result_url || '',
        prompt,
        aspectRatio,
        createdAt: finalStatus.created_at || new Date().toISOString(),
        completedAt: finalStatus.completed_at || new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get the status of a video processing job
   */
  getProcessingStatus: async (jobId: string): Promise<{
    job_id: string;
    status: string;
    progress?: number;
    result_url?: string;
    error_message?: string;
    created_at?: string;
    completed_at?: string;
  }> => {
    const response = await apiClient.get(`/video/reframe/status/${jobId}`);
    return response.data;
  },

  /**
   * Wait for reframe job completion
   */
  waitForCompletion: async (
    jobId: string,
    maxWaitTime: number = 300,
    pollInterval: number = 10
  ): Promise<{
    job_id: string;
    status: string;
    progress?: number;
    result_url?: string;
    error_message?: string;
    created_at?: string;
    completed_at?: string;
  }> => {
    const response = await apiClient.post(`/video/reframe/wait/${jobId}`, null, {
      params: {
        max_wait_time: maxWaitTime,
        poll_interval: pollInterval
      }
    });
    return response.data;
  },

  /**
   * Download a processed video
   */
  downloadVideo: async (videoUrl: string): Promise<Blob> => {
    const response = await apiClient.get(videoUrl, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Health check endpoints
   */
  healthCheck: async (): Promise<{status: string; service: string; version: string}> => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  uploadServiceHealth: async (): Promise<{status: string; picadabra_api: string}> => {
    const response = await apiClient.get('/video/upload/health');
    return response.data;
  },

  reframeServiceHealth: async (): Promise<{status: string; fal_api: string}> => {
    const response = await apiClient.get('/video/reframe/health');
    return response.data;
  },
};

// React Query hooks
export const queryKeys = {
  processingStatus: (jobId: string) => ['processing-status', jobId],
  processingHistory: () => ['processing-history'],
};

// Utility functions
export const createVideoDownloadUrl = (blob: Blob, filename: string): string => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  return url;
};

export const downloadVideoFile = (blob: Blob, filename: string): void => {
  const url = createVideoDownloadUrl(blob, filename);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Error types for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class UploadError extends ApiError {
  constructor(message: string) {
    super(message, 413, 'UPLOAD_ERROR');
    this.name = 'UploadError';
  }
}

// Mock API for development/testing
export const mockApi = {
  processVideo: async (
    videoFile: File,
    prompt: string,
    aspectRatio: AspectRatio
  ): Promise<VideoProcessingResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: `job_${Date.now()}`,
      status: 'completed',
      originalVideo: URL.createObjectURL(videoFile),
      reframedVideo: URL.createObjectURL(videoFile), // Use same video for demo
      prompt,
      aspectRatio,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  },

  getProcessingStatus: async (jobId: string): Promise<VideoProcessingResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: jobId,
      status: 'completed',
      originalVideo: '',
      reframedVideo: '',
      prompt: '',
      aspectRatio: '1:1',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  },
};

export default apiClient;