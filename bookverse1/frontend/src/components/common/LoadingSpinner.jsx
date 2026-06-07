import React from 'react';
import { BookOpen } from 'lucide-react';

export function LoadingSpinner({ fullScreen, size = 'md' }) {
  const sizes = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-[3px]', lg: 'w-12 h-12 border-4' };
  const spinner = (
    <div className={`${sizes[size]} border-primary-100 border-t-primary-600 rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-primary-600" />
            </div>
            <div className="absolute -bottom-1 -right-1">{spinner}</div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Loading BookVerse…</p>
        </div>
      </div>
    );
  }

  return <div className="flex justify-center p-8">{spinner}</div>;
}

export default LoadingSpinner;
