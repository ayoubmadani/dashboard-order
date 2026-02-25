import React from 'react';

// ==================== 1. شريط تحميل دائري (Circular Progress) ====================

export function CircularProgress({ progress = 0, size = 64, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-zinc-800"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-600 transition-all duration-300"
          strokeLinecap="round"
        />
      </svg>
      {/* النسبة المئوية */}
      <span className="absolute text-xs font-bold text-blue-600">
        {Math.round(progress)}%
      </span>
    </div>
  );
}

// ==================== 2. شريط تحميل أفقي (Linear Progress) ====================

export function LinearProgress({ progress = 0, showPercentage = true, height = 'h-2' }) {
  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden ${height}`}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-center mt-1 font-medium text-gray-600 dark:text-zinc-400">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
}

// ==================== 3. شريط تحميل متدرج (Gradient Progress) ====================

export function GradientProgress({ progress = 0 }) {
  return (
    <div className="w-full space-y-2">
      <div className="relative w-full h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 transition-all duration-300 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* تأثير اللمعان */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-zinc-400">جاري الرفع...</span>
        <span className="font-bold text-blue-600">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// ==================== 4. شريط تحميل متحرك (Animated Progress) ====================

export function AnimatedProgress({ progress = 0 }) {
  return (
    <div className="w-full space-y-3">
      {/* الشريط */}
      <div className="relative w-full h-4 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all duration-500 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* النقاط المتحركة */}
          <div className="absolute inset-0 flex items-center justify-end pr-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* النسبة */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-zinc-400">
          {progress < 100 ? 'جاري الرفع...' : 'اكتمل! ✓'}
        </span>
        <span className="text-lg font-bold text-blue-600">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// ==================== 5. شريط تحميل مع حجم الملف ====================

export function ProgressWithSize({ progress = 0, uploaded = 0, total = 0 }) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-2">
      {/* الشريط */}
      <div className="relative w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* المعلومات */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-600 dark:text-zinc-400">
          {formatBytes(uploaded)} / {formatBytes(total)}
        </span>
        <span className="font-bold text-blue-600">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// ==================== 6. شريط تحميل مع وقت متبقي ====================

export function ProgressWithTime({ progress = 0, timeRemaining = 0 }) {
  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)} ثانية`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')} دقيقة`;
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="text-gray-700 dark:text-zinc-300 font-medium">
          جاري الرفع...
        </span>
        <span className="text-gray-500 dark:text-zinc-400 text-xs">
          الوقت المتبقي: {formatTime(timeRemaining)}
        </span>
      </div>

      <div className="w-full h-2.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-right">
        <span className="text-2xl font-bold text-green-600">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// ==================== 7. شريط تحميل مع خطوات ====================

export function StepProgress({ currentStep = 1, totalSteps = 3, stepLabels = [] }) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full space-y-4">
      {/* الخطوات */}
      <div className="flex justify-between items-center">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                index + 1 <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-zinc-800 text-gray-400'
              }`}
            >
              {index + 1 < currentStep ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            {stepLabels[index] && (
              <span className="text-xs mt-2 text-gray-600 dark:text-zinc-400">
                {stepLabels[index]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* الشريط */}
      <div className="w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ==================== 8. شريط تحميل دائري كبير ====================

export function LargeCircularProgress({ progress = 0 }) {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200 dark:text-zinc-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-300"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-blue-600">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 animate-pulse">
        جاري رفع الصورة...
      </p>
    </div>
  );
}

// ==================== CSS للـ Animation (أضف في tailwind.config.js) ====================
/*
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite'
      }
    }
  }
}
*/