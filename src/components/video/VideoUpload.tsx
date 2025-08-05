'use client';

import React, { useCallback, useState, useRef } from 'react';
import { VideoUploadProps, VideoFile } from '@/types';
import { 
  validateVideoFile, 
  validateVideoDimensions, 
  createVideoUrl, 
  loadVideoMetadata,
  formatFileSize,
  getErrorMessage
} from '@/lib/utils';
import { cn } from '@/lib/utils';

export function VideoUpload({ 
  onVideoSelect, 
  acceptedFormats, 
  maxSize, 
  disabled = false 
}: VideoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setIsValidating(true);
    setValidationError(null);

    try {
      // Basic file validation
      const validation = validateVideoFile(file);
      if (!validation.isValid) {
        setValidationError(validation.error!);
        return;
      }

      // Load video metadata and validate dimensions
      const metadata = await loadVideoMetadata(file);
      const video = document.createElement('video');
      video.src = createVideoUrl(file);
      
      await new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', resolve);
        video.addEventListener('error', reject);
      });

      const dimensionValidation = validateVideoDimensions(video);
      if (!dimensionValidation.isValid) {
        setValidationError(dimensionValidation.error!);
        return;
      }

      // Create VideoFile object
      const videoFile: VideoFile = {
        file,
        url: createVideoUrl(file),
        duration: metadata.duration,
        size: file.size,
        type: file.type,
      };

      onVideoSelect(videoFile);
    } catch (error) {
      setValidationError(getErrorMessage(error));
    } finally {
      setIsValidating(false);
    }
  }, [onVideoSelect]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    processFile(files[0]);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const clearError = useCallback(() => {
    setValidationError(null);
  }, []);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'file-upload-zone cursor-pointer',
          isDragOver && 'dragover',
          disabled && 'opacity-50 cursor-not-allowed',
          validationError && 'border-red-300'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          {isValidating ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-600">Validating video...</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-primary-50 rounded-full">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900 mb-1">
                  Upload your video
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Drag and drop or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Max: {formatFileSize(maxSize)}
                </p>
                <p className="text-xs text-gray-400">
                  Formats: {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}
                </p>
              </div>
              
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={disabled}
              >
                Choose File
              </button>
            </>
          )}
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-800">{validationError}</p>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="ml-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg focus:ring-2 focus:ring-red-600 p-1.5 hover:bg-red-100 inline-flex h-8 w-8"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              Video Requirements
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Any video dimensions are supported</li>
              <li>• Maximum file size: {formatFileSize(maxSize)}</li>
              <li>• Supported formats: MP4, WebM, MOV</li>
              <li>• Video will be processed and reframed to your chosen aspect ratio</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}