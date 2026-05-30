// ─── LoadingSpinner.jsx ───────────────────────────────────────────────────────
import React from 'react';

export function LoadingSpinner({ fullScreen, size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div className={`${sizes[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
  );
  if (fullScreen) return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">
        {spinner}
        <p className="text-gray-500 text-sm">Loading BookVerse…</p>
      </div>
    </div>
  );
  return <div className="flex justify-center p-8">{spinner}</div>;
}

export default LoadingSpinner;
