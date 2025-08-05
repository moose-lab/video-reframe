'use client';

import React, { useCallback } from 'react';
import { AspectRatioSelectorProps, AspectRatio } from '@/types';
import { formatAspectRatio, getAspectRatioDimensions } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function AspectRatioSelector({ 
  value, 
  onChange, 
  options, 
  disabled = false 
}: AspectRatioSelectorProps) {
  const handleSelect = useCallback((ratio: AspectRatio) => {
    if (!disabled) {
      onChange(ratio);
    }
  }, [onChange, disabled]);

  // Visual representation of aspect ratios
  const AspectRatioPreview = ({ ratio }: { ratio: AspectRatio }) => {
    const dimensions = getAspectRatioDimensions(ratio);
    const maxSize = 40;
    const scale = Math.min(maxSize / dimensions.width, maxSize / dimensions.height);
    const width = dimensions.width * scale;
    const height = dimensions.height * scale;

    return (
      <div 
        className="bg-primary-200 rounded-sm flex-shrink-0"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Grid of aspect ratio options */}
      <div className="grid grid-cols-1 gap-3">
        {options.map((ratio) => {
          const isSelected = value === ratio;
          const dimensions = getAspectRatioDimensions(ratio);
          
          return (
            <button
              key={ratio}
              type="button"
              onClick={() => handleSelect(ratio)}
              disabled={disabled}
              className={cn(
                'flex items-center justify-between p-4 border-2 rounded-lg transition-all text-left',
                'hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isSelected 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 bg-white hover:bg-gray-50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center space-x-3">
                <AspectRatioPreview ratio={ratio} />
                <div>
                  <div className="font-medium text-gray-900">
                    {ratio}
                  </div>
                  <div className="text-sm text-gray-500">
                    {dimensions.width} × {dimensions.height}px
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                {isSelected && (
                  <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Current selection info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              Selected: {formatAspectRatio(value)}
            </h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p>Your 512×512 video will be reframed to this aspect ratio.</p>
              <p>The AI will intelligently crop and focus on the most important content.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aspect ratio descriptions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Common Use Cases:</h4>
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span className="font-medium">1:1 (Square)</span>
            <span>Instagram posts, profile pictures</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">9:16 (Vertical)</span>
            <span>Instagram Stories, TikTok, Reels</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">16:9 (Widescreen)</span>
            <span>YouTube, TV, presentations</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">4:3 (Standard)</span>
            <span>Traditional TV, presentations</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">3:4 (Portrait)</span>
            <span>Mobile screens, vertical content</span>
          </div>
        </div>
      </div>
    </div>
  );
}