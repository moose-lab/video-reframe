import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { videoApi, queryKeys, mockApi } from '@/lib/api';
import { VideoFile, AspectRatio, VideoProcessingResponse } from '@/types';
import { useVideoActions } from '@/stores/videoReframeStore';

// Configuration for development mode
const USE_MOCK_API = process.env.NODE_ENV === 'development';

/**
 * Hook for processing videos
 */
export function useVideoProcessing() {
  const queryClient = useQueryClient();
  const actions = useVideoActions();

  const processingMutation = useMutation({
    mutationFn: async ({ 
      videoFile, 
      prompt, 
      aspectRatio 
    }: { 
      videoFile: VideoFile; 
      prompt: string; 
      aspectRatio: AspectRatio; 
    }) => {
      actions.setProcessingStatus('uploading');
      actions.setProcessingProgress(0);

      // Use mock API in development
      const api = USE_MOCK_API ? mockApi : videoApi;
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        actions.setProcessingProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const result = await api.processVideo(videoFile.file, prompt, aspectRatio);
        clearInterval(progressInterval);
        
        actions.setProcessingProgress(100);
        actions.setProcessingStatus('completed');
        actions.setReframedVideoUrl(result.reframedVideo || null);
        
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        actions.setProcessingStatus('error');
        throw error;
      }
    },
    onError: (error) => {
      actions.setError(error instanceof Error ? error.message : 'Processing failed');
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.processingHistory() });
    },
  });

  return {
    processVideo: processingMutation.mutate,
    isProcessing: processingMutation.isPending,
    error: processingMutation.error,
    data: processingMutation.data,
    reset: processingMutation.reset,
  };
}

/**
 * Hook for polling processing status
 */
export function useProcessingStatus(jobId: string | null, enabled = false) {
  return useQuery({
    queryKey: queryKeys.processingStatus(jobId || ''),
    queryFn: () => {
      if (!jobId) throw new Error('Job ID is required');
      const api = USE_MOCK_API ? mockApi : videoApi;
      return api.getProcessingStatus(jobId);
    },
    enabled: enabled && !!jobId,
    refetchInterval: (data) => {
      // Stop polling if completed or error
      if (data?.status === 'completed' || data?.status === 'error') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook for getting processing history
 */
export function useProcessingHistory() {
  return useQuery({
    queryKey: queryKeys.processingHistory(),
    queryFn: () => videoApi.getProcessingHistory(),
    enabled: !USE_MOCK_API, // Only enable for real API
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for canceling processing
 */
export function useCancelProcessing() {
  const queryClient = useQueryClient();
  const actions = useVideoActions();

  return useMutation({
    mutationFn: (jobId: string) => videoApi.cancelProcessing(jobId),
    onSuccess: () => {
      actions.setProcessingStatus('idle');
      actions.setProcessingProgress(0);
      queryClient.invalidateQueries({ queryKey: queryKeys.processingHistory() });
    },
    onError: (error) => {
      actions.setError(error instanceof Error ? error.message : 'Failed to cancel processing');
    },
  });
}

/**
 * Hook for downloading processed videos
 */
export function useVideoDownload() {
  return useMutation({
    mutationFn: async (videoId: string) => {
      const blob = await videoApi.downloadVideo(videoId);
      const filename = `reframed-video-${videoId}.mp4`;
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { filename, size: blob.size };
    },
    onError: (error) => {
      console.error('Download failed:', error);
    },
  });
}