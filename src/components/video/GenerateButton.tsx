'use client';

import React from 'react';
import { GenerateButtonProps } from '@/types';
import { cn } from '@/lib/utils';

export function GenerateButton({ 
  onClick, 
  disabled = false, 
  loading = false 
}: GenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        disabled || loading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
      )}
    >
      {loading ? (
        <>
          {/* Loading spinner */}
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
          <span>Processing Video...</span>
        </>
      ) : (
        <>
          {/* Generate icon */}
          <svg 
            className="w-5 h-5 mr-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
          <span>Generate Reframed Video</span>
        </>
      )}
    </button>
  );
}