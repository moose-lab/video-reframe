import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AspectRatio, ASPECT_RATIO_DIMENSIONS, ACCEPTED_VIDEO_FORMATS, MAX_FILE_SIZE, REQUIRED_VIDEO_DIMENSIONS } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Video validation utilities
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!ACCEPTED_VIDEO_FORMATS.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file format. Please upload ${ACCEPTED_VIDEO_FORMATS.join(', ')}`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`
    };
  }

  return { isValid: true };
}

export function validateVideoDimensions(video: HTMLVideoElement): { isValid: boolean; error?: string } {
  const { videoWidth, videoHeight } = video;
  const { width: requiredWidth, height: requiredHeight } = REQUIRED_VIDEO_DIMENSIONS;

  if (videoWidth !== requiredWidth || videoHeight !== requiredHeight) {
    return {
      isValid: false,
      error: `Video must be exactly ${requiredWidth}x${requiredHeight}px. Current video is ${videoWidth}x${videoHeight}px`
    };
  }

  return { isValid: true };
}

// File utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function createVideoUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeVideoUrl(url: string): void {
  URL.revokeObjectURL(url);
}

// Aspect ratio utilities
export function getAspectRatioDimensions(aspectRatio: AspectRatio) {
  return ASPECT_RATIO_DIMENSIONS[aspectRatio];
}

export function getAspectRatioValue(aspectRatio: AspectRatio): number {
  const dimensions = ASPECT_RATIO_DIMENSIONS[aspectRatio];
  return dimensions.width / dimensions.height;
}

export function formatAspectRatio(aspectRatio: AspectRatio): string {
  const dimensions = ASPECT_RATIO_DIMENSIONS[aspectRatio];
  return `${aspectRatio} (${dimensions.width}×${dimensions.height})`;
}

// Video loading utilities
export function loadVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = createVideoUrl(file);

    video.addEventListener('loadedmetadata', () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      };
      revokeVideoUrl(url);
      resolve(metadata);
    });

    video.addEventListener('error', () => {
      revokeVideoUrl(url);
      reject(new Error('Failed to load video metadata'));
    });

    video.src = url;
  });
}

// Time utilities
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

// URL utilities
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}