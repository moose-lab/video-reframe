// Aspect ratio options for video reframing
export type AspectRatio = '1:1' | '3:4' | '9:16' | '4:3' | '16:9';

// Video processing status
export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

// Video file information
export interface VideoFile {
  file: File;
  url: string;
  duration?: number;
  size: number;
  type: string;
}

// API response for video processing
export interface VideoProcessingResponse {
  id: string;
  status: ProcessingStatus;
  originalVideo: string;
  reframedVideo?: string;
  prompt: string;
  aspectRatio: AspectRatio;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// Processing job information
export interface ProcessingJob {
  id: string;
  status: ProcessingStatus;
  progress?: number;
  error?: string;
}

// Application state interface for Zustand store
export interface VideoReframeState {
  // Current video file
  videoFile: VideoFile | null;
  
  // User inputs
  prompt: string;
  aspectRatio: AspectRatio;
  
  // Processing state
  isProcessing: boolean;
  processingStatus: ProcessingStatus;
  processingProgress: number;
  
  // Results
  reframedVideoUrl: string | null;
  
  // Error handling
  error: string | null;
  
  // Actions
  setVideoFile: (file: VideoFile | null) => void;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setProcessingStatus: (status: ProcessingStatus) => void;
  setProcessingProgress: (progress: number) => void;
  setReframedVideoUrl: (url: string | null) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

// API endpoints configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  maxFileSize: number;
}

// Component props interfaces
export interface VideoUploadProps {
  onVideoSelect: (file: VideoFile) => void;
  acceptedFormats: string[];
  maxSize: number;
  disabled?: boolean;
}

export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
  options: AspectRatio[];
  disabled?: boolean;
}

export interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface VideoPreviewProps {
  videoUrl: string | null;
  aspectRatio: AspectRatio;
  className?: string;
}

// Utility types
export type PartialVideoReframeState = Partial<VideoReframeState>;

// Constants
export const ASPECT_RATIO_OPTIONS: AspectRatio[] = ['1:1', '3:4', '9:16', '4:3', '16:9'];

export const ASPECT_RATIO_DIMENSIONS = {
  '1:1': { width: 1024, height: 1024 },
  '3:4': { width: 768, height: 1024 },
  '9:16': { width: 576, height: 1024 },
  '4:3': { width: 1024, height: 768 },
  '16:9': { width: 1024, height: 576 },
} as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ACCEPTED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/mov'];
export const REQUIRED_VIDEO_DIMENSIONS = { width: 512, height: 512 };