import React, { useRef, useState } from 'react';

export default function ModelIcon({ isOpen, close, onSelectImage }) {
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(50); // نسبة التحميل
  const [isUploading, setIsUploading] = useState(true); // حالة التحميل

  const icons = {
    // all niche
    cloth : [],
    //...
  }

  const handleImageSelect = (image) => {
    if (onSelectImage) onSelectImage(image);
    close();
  };

  // محاكاة عملية الرفع
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // محاكاة الرفع باستخدام setInterval (يمكنك استبدالها بـ Axios onUploadProgress)
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        setUploadProgress(100);
        clearInterval(interval);
        
        // بعد انتهاء الرفع، نقرأ الصورة ونغلق المودال
        const reader = new FileReader();
        reader.onloadend = () => {
          setTimeout(() => {
            onSelectImage({ id: Date.now(), url: reader.result });
            setIsUploading(false);
            setUploadProgress(0);
            close();
          }, 500); // تأخير بسيط ليتمكن المستخدم من رؤية 100%
        };
        reader.readAsDataURL(file);
      } else {
        setUploadProgress(progress);
      }
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4'>
      <div className='relative w-full max-w-5xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/10'>
        
        {/* Header */}
        <div className='px-8 py-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center'>
          <div>
            <h3 className='text-2xl font-black text-gray-900 dark:text-white'>مكتبة الوسائط</h3>
          </div>
          <button onClick={close} className='p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-red-500 hover:text-white transition-all'>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='p-8 overflow-y-auto'>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            
            {/* Upload Button Card with Progress */}
            <div 
              onClick={() => !isUploading && fileInputRef.current.click()}
              className={`group relative aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-all cursor-pointer ${
                isUploading ? 'border-blue-500 bg-blue-50/20' : 'border-gray-300 dark:border-zinc-700 hover:border-blue-500'
              }`}
            >
              <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*" />
              
              {isUploading ? (
                // شكل الـ Progress (دائري بسيط)
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-zinc-800" />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - uploadProgress / 100)}
                        className="text-blue-600 transition-all duration-300" 
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-blue-600">{uploadProgress}%</span>
                  </div>
                  <span className='mt-3 text-sm font-medium text-blue-600 animate-pulse'>جاري الرفع...</span>
                </div>
              ) : (
                <>
                  <div className='p-4 bg-blue-100 dark:bg-blue-500/20 rounded-2xl text-blue-600'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <span className='mt-3 font-bold text-gray-700 dark:text-zinc-300'>رفع صورة</span>
                </>
              )}
            </div>

            {/* Images Grid */}
            {images.map((img) => (
              <div 
                key={img.id} 
                className='group relative aspect-square overflow-hidden rounded-3xl bg-gray-50 dark:bg-zinc-800 cursor-pointer border border-transparent hover:border-blue-500 transition-all'
                onClick={() => handleImageSelect(img)}
              >
                <img src={img.url} className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110' alt="product" />
                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                  <span className='bg-white text-black px-4 py-1 rounded-full text-xs font-bold'>اختيار</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className='px-8 py-4 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3'>
          <button onClick={close} className='px-6 py-2 text-gray-500 font-bold'>إغلاق</button>
          <button 
            disabled={isUploading}
            onClick={() => fileInputRef.current.click()}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'}`}
          >
            {isUploading ? 'جاري التحميل...' : 'رفع صورة جديدة'}
          </button>
        </div>
      </div>
    </div>
  );
}