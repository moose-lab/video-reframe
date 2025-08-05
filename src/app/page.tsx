'use client';

import { VideoUpload } from '@/components/video/VideoUpload';
import { PromptInput } from '@/components/video/PromptInput';
import { AspectRatioSelector } from '@/components/video/AspectRatioSelector';
import { GenerateButton } from '@/components/video/GenerateButton';
import { VideoPreview } from '@/components/video/VideoPreview';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { 
  useVideoFile, 
  usePrompt, 
  useAspectRatio, 
  useProcessingState, 
  useReframedVideo, 
  useError,
  useVideoActions 
} from '@/stores/videoReframeStore';
import { ASPECT_RATIO_OPTIONS, ACCEPTED_VIDEO_FORMATS, MAX_FILE_SIZE } from '@/types';

export default function HomePage() {
  const videoFile = useVideoFile();
  const prompt = usePrompt();
  const aspectRatio = useAspectRatio();
  const { isProcessing, status, progress } = useProcessingState();
  const reframedVideoUrl = useReframedVideo();
  const error = useError();
  const actions = useVideoActions();

  const handleGenerate = async () => {
    if (!videoFile || !prompt.trim()) {
      actions.setError('Please upload a video and enter a prompt');
      return;
    }

    try {
      actions.setProcessingStatus('processing');
      actions.setProcessingProgress(0);
      actions.setError(null);

      // Simulate processing with progress updates
      // In a real implementation, this would be replaced with actual API calls
      const intervals = [10, 30, 50, 70, 90, 100];
      for (let i = 0; i < intervals.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        actions.setProcessingProgress(intervals[i]);
      }

      // For demo purposes, use the original video as the result
      actions.setReframedVideoUrl(videoFile.url);
    } catch (err) {
      actions.setError('Failed to process video. Please try again.');
      actions.setProcessingStatus('error');
    }
  };

  const canGenerate = videoFile && prompt.trim() && !isProcessing;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Video Reframe
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your videos to different aspect ratios using AI-powered reframing technology
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
          {/* Left Sidebar - Controls */}
          <div className="lg:w-1/3 space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Video
              </h2>
              <VideoUpload
                onVideoSelect={actions.setVideoFile}
                acceptedFormats={ACCEPTED_VIDEO_FORMATS}
                maxSize={MAX_FILE_SIZE}
                disabled={isProcessing}
              />
              
              {videoFile && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center text-sm text-green-800">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Video uploaded successfully
                    </div>
                  </div>
                  
                  {/* 512x512 Preview in Left Panel */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Original Video</h3>
                    <div className="w-full h-64 max-w-64 mx-auto">
                      <video
                        src={videoFile.url}
                        className="w-full h-full object-contain bg-black rounded-md"
                        muted
                        loop
                        playsInline
                        controls
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Reframing Prompt
              </h2>
              <PromptInput
                value={prompt}
                onChange={actions.setPrompt}
                placeholder="Describe how you want the video to be reframed..."
                disabled={isProcessing}
              />
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Target Aspect Ratio
              </h2>
              <AspectRatioSelector
                value={aspectRatio}
                onChange={actions.setAspectRatio}
                options={ASPECT_RATIO_OPTIONS}
                disabled={isProcessing}
              />
            </div>

            <GenerateButton
              onClick={handleGenerate}
              disabled={!canGenerate}
              loading={isProcessing}
            />

            {/* Progress Bar */}
            {isProcessing && (
              <div className="card">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Processing Video...
                </h3>
                <ProgressBar progress={progress} />
                <p className="text-xs text-gray-500 mt-1">
                  {status === 'uploading' ? 'Uploading video...' : 
                   status === 'processing' ? `Processing... ${progress}%` : 
                   'Preparing...'}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <ErrorMessage 
                message={error} 
                onDismiss={() => actions.setError(null)} 
              />
            )}
          </div>

          {/* Right Preview Area */}
          <div className="lg:w-2/3">
            <div className="card h-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Video Preview
              </h2>
              <div className="flex justify-center items-center min-h-[600px]">
                <div className="w-full max-w-[1024px] max-h-[1024px] mx-auto">
                  <VideoPreview
                    videoUrl={reframedVideoUrl || (videoFile?.url || null)}
                    aspectRatio={aspectRatio}
                    className="w-full h-full"
                  />
                </div>
              </div>
              
              {!videoFile && (
                <div className="text-center text-gray-500 mt-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg">Upload a video to see the preview</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Supported formats: MP4, WebM, MOV (any dimensions)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}