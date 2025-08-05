'use client';

import React, { useCallback, useState } from 'react';
import { PromptInputProps } from '@/types';
import { cn } from '@/lib/utils';

export function PromptInput({ 
  value, 
  onChange, 
  placeholder = "Describe how you want the video to be reframed...", 
  disabled = false 
}: PromptInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const maxLength = 500;
  const remainingChars = maxLength - value.length;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  }, [onChange, maxLength]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Sample prompts for inspiration
  const samplePrompts = [
    "Focus on the main subject and crop to center",
    "Keep the action in the center of the frame",
    "Maintain the most important visual elements",
    "Center the subject while preserving context",
    "Focus on the face and upper body area"
  ];

  const insertSamplePrompt = useCallback((prompt: string) => {
    if (prompt.length <= maxLength) {
      onChange(prompt);
    }
  }, [onChange, maxLength]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={cn(
            'textarea-field',
            isFocused && 'ring-2 ring-primary-500 border-primary-500',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
          )}
        />
        
        {/* Character counter */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {remainingChars < 50 && (
            <span className={cn(
              remainingChars < 0 ? 'text-red-500' : 
              remainingChars < 20 ? 'text-yellow-500' : 
              'text-gray-400'
            )}>
              {remainingChars} characters remaining
            </span>
          )}
        </div>
      </div>

      {/* Sample prompts */}
      {!disabled && value.trim() === '' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 font-medium">
            Try these examples:
          </p>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt, index) => (
              <button
                key={index}
                type="button"
                onClick={() => insertSamplePrompt(prompt)}
                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          Prompting Tips:
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Be specific about what should remain in focus</li>
          <li>• Mention important objects or people that should stay visible</li>
          <li>• Describe the desired composition or framing</li>
          <li>• Use clear, descriptive language about the visual elements</li>
        </ul>
      </div>

      {/* Validation feedback */}
      {value.trim() !== '' && (
        <div className="flex items-center text-sm">
          {value.trim().length < 10 ? (
            <div className="flex items-center text-yellow-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Try to be more descriptive for better results
            </div>
          ) : (
            <div className="flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Good prompt length
            </div>
          )}
        </div>
      )}
    </div>
  );
}