import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CircularProgress, 
  LinearProgress, 
  AnimatedProgress,
  ProgressWithSize,
  LargeCircularProgress 
} from './ProgressBars';

export default function ModelImagesWithProgress({ isOpen, close, onSelectImage, folder = 'products' }) {
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') || '';

  // جلب الصور
  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/images`, {
        params: { page: 1, limit: 20, folder },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setImages(response.data.images);
    } catch (error) {
      console.error('خطأ في جلب الصور:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchImages();
  }, [isOpen, folder]);

  // رفع الصورة مع تتبع مفصل
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // التحقق من نوع وحجم الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('نوع الملف غير مدعوم');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى: 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setTotalBytes(file.size);
    setUploadedBytes(0);
    setStartTime(Date.now());

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `/api/images/upload?folder=${folder}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${getToken()}`,
          },
          onUploadProgress: (progressEvent) => {
            const loaded = progressEvent.loaded;
            const total = progressEvent.total;
            const percentCompleted = Math.round((loaded * 100) / total);
            
            setUploadProgress(percentCompleted);
            setUploadedBytes(loaded);

            // حساب سرعة الرفع
            const elapsedTime = (Date.now() - startTime) / 1000; // بالثواني
            const speed = loaded / elapsedTime; // بايت/ثانية
            setUploadSpeed(speed);
          },
        }
      );

      const uploadedImage = response.data;
      setImages(prev => [uploadedImage, ...prev]);
      
      if (onSelectImage) {
        onSelectImage(uploadedImage);
      }

      setTimeout(() => {
        close();
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      alert(error.response?.data?.message || 'فشل رفع الصورة');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageSelect = (image) => {
    if (onSelectImage) onSelectImage(image);
    close();
  };

  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${Math.round(bytesPerSecond / 1024)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4'>
      <div className='relative w-full max-w-5xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/10'>
        
        {/* Header */}
        <div className='px-8 py-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center'>
          <div>
            <h3 className='text-2xl font-black text-gray-900 dark:text-white'>مكتبة الوسائط</h3>
            <p className='text-sm text-gray-500 dark:text-zinc-400 mt-1'>
              {images.length} صورة
            </p>
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
            
            {/* Upload Button Card مع أنواع مختلفة من Progress */}
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`group relative aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-all ${
                isUploading 
                  ? 'border-blue-500 bg-blue-50/20 cursor-not-allowed' 
                  : 'border-gray-300 dark:border-zinc-700 hover:border-blue-500 cursor-pointer'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                hidden 
                onChange={handleFileUpload} 
                accept="image/*"
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center w-full px-4">
                  {/* اختر نوع Progress Bar هنا */}
                  
                  {/* الخيار 1: دائري بسيط */}
                  <CircularProgress progress={uploadProgress} size={64} strokeWidth={6} />
                  
                  {/* الخيار 2: شريط أفقي */}
                  {/* <div className="w-full">
                    <LinearProgress progress={uploadProgress} />
                  </div> */}
                  
                  {/* الخيار 3: متحرك */}
                  {/* <div className="w-full">
                    <AnimatedProgress progress={uploadProgress} />
                  </div> */}
                  
                  {/* الخيار 4: مع حجم الملف */}
                  {/* <div className="w-full">
                    <ProgressWithSize 
                      progress={uploadProgress}
                      uploaded={uploadedBytes}
                      total={totalBytes}
                    />
                  </div> */}
                  
                  {/* الخيار 5: دائري كبير */}
                  {/* <LargeCircularProgress progress={uploadProgress} /> */}
                  
                  <div className="mt-3 text-center">
                    <span className='text-sm font-medium text-blue-600 animate-pulse'>
                      جاري الرفع...
                    </span>
                    {uploadSpeed > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatSpeed(uploadSpeed)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className='p-4 bg-blue-100 dark:bg-blue-500/20 rounded-2xl text-blue-600'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <span className='mt-3 font-bold text-gray-700 dark:text-zinc-300'>
                    رفع صورة
                  </span>
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
                <img 
                  src={img.url} 
                  className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110' 
                  alt={img.originalName || 'product'} 
                  loading="lazy"
                />
                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                  <span className='bg-white text-black px-4 py-1 rounded-full text-xs font-bold'>
                    اختيار
                  </span>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className='flex justify-center items-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          )}

          {!loading && images.length === 0 && (
            <div className='text-center py-12'>
              <p className='text-gray-600 dark:text-zinc-400 font-medium'>
                لا توجد صور بعد
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-8 py-4 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center'>
          <div className='text-sm text-gray-500 dark:text-zinc-400'>
            {images.length > 0 && `${images.length} صورة`}
          </div>
          <div className='flex gap-3'>
            <button onClick={close} className='px-6 py-2 text-gray-500 font-bold'>
              إغلاق
            </button>
            <button 
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className={`px-8 py-2.5 rounded-xl font-bold transition-all ${
                isUploading 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
              }`}
            >
              {isUploading ? 'جاري التحميل...' : 'رفع صورة جديدة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}