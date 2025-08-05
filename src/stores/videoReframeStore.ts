import { create } from 'zustand';
import { VideoReframeState, VideoFile, AspectRatio, ProcessingStatus } from '@/types';

const initialState = {
  videoFile: null,
  prompt: '',
  aspectRatio: '1:1' as AspectRatio,
  isProcessing: false,
  processingStatus: 'idle' as ProcessingStatus,
  processingProgress: 0,
  reframedVideoUrl: null,
  error: null,
};

export const useVideoReframeStore = create<VideoReframeState>((set, get) => ({
  ...initialState,

  // Actions
  setVideoFile: (file: VideoFile | null) => {
    set({ 
      videoFile: file,
      error: null,
      reframedVideoUrl: null,
      processingStatus: 'idle',
      processingProgress: 0
    });
  },

  setPrompt: (prompt: string) => {
    set({ prompt, error: null });
  },

  setAspectRatio: (aspectRatio: AspectRatio) => {
    set({ aspectRatio, error: null });
  },

  setProcessingStatus: (processingStatus: ProcessingStatus) => {
    const isProcessing = processingStatus === 'processing' || processingStatus === 'uploading';
    set({ 
      processingStatus, 
      isProcessing,
      error: processingStatus === 'error' ? get().error : null
    });
  },

  setProcessingProgress: (processingProgress: number) => {
    set({ processingProgress: Math.max(0, Math.min(100, processingProgress)) });
  },

  setReframedVideoUrl: (reframedVideoUrl: string | null) => {
    set({ 
      reframedVideoUrl,
      processingStatus: reframedVideoUrl ? 'completed' : get().processingStatus,
      isProcessing: reframedVideoUrl ? false : get().isProcessing,
      processingProgress: reframedVideoUrl ? 100 : get().processingProgress
    });
  },

  setError: (error: string | null) => {
    set({ 
      error,
      processingStatus: error ? 'error' : get().processingStatus,
      isProcessing: false
    });
  },

  resetState: () => {
    set(initialState);
  },
}));

// Selector hooks for better performance
export const useVideoFile = () => useVideoReframeStore((state) => state.videoFile);
export const usePrompt = () => useVideoReframeStore((state) => state.prompt);
export const useAspectRatio = () => useVideoReframeStore((state) => state.aspectRatio);
export const useProcessingState = () => useVideoReframeStore((state) => ({
  isProcessing: state.isProcessing,
  status: state.processingStatus,
  progress: state.processingProgress,
}));
export const useReframedVideo = () => useVideoReframeStore((state) => state.reframedVideoUrl);
export const useError = () => useVideoReframeStore((state) => state.error);

// Action selectors
export const useVideoActions = () => useVideoReframeStore((state) => ({
  setVideoFile: state.setVideoFile,
  setPrompt: state.setPrompt,
  setAspectRatio: state.setAspectRatio,
  setProcessingStatus: state.setProcessingStatus,
  setProcessingProgress: state.setProcessingProgress,
  setReframedVideoUrl: state.setReframedVideoUrl,
  setError: state.setError,
  resetState: state.resetState,
}));