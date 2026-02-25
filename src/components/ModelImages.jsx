import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { baseURL } from '../constents/const.';
import { getAccessToken } from '../services/access-token';

// ✅ دالة ضغط الصور باستخدام Canvas API
const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    type = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        let { width, height } = img;
        
        // حساب الأبعاد الجديدة مع الحفاظ على النسبة
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; // خلفية بيضاء للصور الشفافة
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // تحويل Canvas إلى Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // إنشاء ملف جديد من الـ Blob
              const compressedFile = new File([blob], file.name, {
                type: type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('فشل ضغط الصورة'));
            }
          },
          type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
    };
    
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
  });
};

export default function ModelImages({ isOpen, close, onSelectImage, folder = 'products' }) {
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // معلومات إضافية للـ Progress
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  
  // ✅ حالة جديدة لضغط الصور
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  // تنسيق الحجم
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // تنسيق السرعة
  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${Math.round(bytesPerSecond / 1024)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
  };

  // تنسيق الوقت
  const formatTime = (seconds) => {
    if (seconds < 1) return 'أقل من ثانية';
    if (seconds < 60) return `${Math.round(seconds)} ثانية`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')} دقيقة`;
  };

  // حساب نسبة الضغط
  const getCompressionRatio = () => {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  };

  // جلب الصور من الـ API
  const fetchImages = async (pageNum = 1) => {
    const token = getAccessToken();
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/images`, {
        params: {
          page: pageNum,
          limit: 20,
          folder: folder,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      if (pageNum === 1) {
        setImages(data.images);
      } else {
        setImages(prev => [...prev, ...data.images]);
      }

      setHasMore(data.page < data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('خطأ في جلب الصور:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchImages(1);
    }
  }, [isOpen, folder]);

  // ✅ رفع الصورة مع ضغط مسبق
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // التحققات (النوع والحجم)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('نوع الملف غير مدعوم. يسمح فقط بـ: JPG, PNG, GIF, WEBP');
      return;
    }

    // التحقق من الحجم الأصلي (50MB كحد أقصى)
    if (file.size > 50 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى 50MB');
      return;
    }

    setIsUploading(true);
    setOriginalSize(file.size);
    setCurrentFileName(file.name);

    let fileToUpload = file;

    // ✅ ضغط الصور الكبيرة فقط (> 1MB)
    if (file.size > 1024 * 1024) {
      setIsCompressing(true);
      setCompressionProgress(30);
      
      try {
        // خيارات الضغط حسب نوع الصورة
        const compressionOptions = {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: file.type === 'image/png' ? 0.9 : 0.85,
          type: file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        };

        fileToUpload = await compressImage(file, compressionOptions);
        setCompressedSize(fileToUpload.size);
        setCompressionProgress(100);
        
      } catch (error) {
        console.error('فشل الضغط:', error);
        // الاستمرار بالملف الأصلي إذا فشل الضغط
        fileToUpload = file;
        setCompressedSize(file.size);
      } finally {
        setTimeout(() => setIsCompressing(false), 500);
      }
    } else {
      setCompressedSize(file.size);
    }

    // إعداد حالة الرفع
    setUploadProgress(0);
    setTotalBytes(fileToUpload.size);
    setUploadedBytes(0);
    const uploadStartTime = Date.now();
    setStartTime(uploadStartTime);

    const formData = new FormData();
    formData.append('file', fileToUpload);
    const token = getAccessToken();

    try {
      const response = await axios.post(
        `${baseURL}/images/upload?folder=${folder}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percentCompleted = Math.round((loaded * 100) / total);

            setUploadProgress(percentCompleted);
            setUploadedBytes(loaded);

            const now = Date.now();
            const elapsedTimeInSeconds = (now - uploadStartTime) / 1000;

            if (elapsedTimeInSeconds > 0.1) {
              const speed = loaded / elapsedTimeInSeconds;
              setUploadSpeed(speed);

              const remainingBytes = total - loaded;
              const timeLeft = remainingBytes / speed;
              setTimeRemaining(timeLeft);
            }
          },
        }
      );

      const uploadedImage = response.data;
      setImages(prev => [uploadedImage, ...prev]);

      if (onSelectImage) onSelectImage(uploadedImage);

      setTimeout(() => {
        close();
        resetUploadState();
      }, 500);

    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      alert(error.response?.data?.message || 'فشل رفع الصورة');
      resetUploadState();
    }
  };

  // إعادة تعيين حالة الرفع
  const resetUploadState = () => {
    setIsUploading(false);
    setIsCompressing(false);
    setUploadProgress(0);
    setCompressionProgress(0);
    setUploadedBytes(0);
    setTotalBytes(0);
    setUploadSpeed(0);
    setTimeRemaining(0);
    setCurrentFileName('');
    setOriginalSize(0);
    setCompressedSize(0);
  };

  // اختيار صورة
  const handleImageSelect = (image) => {
    if (onSelectImage) {
      onSelectImage(image);
    }
    close();
  };

  // حذف صورة
  const handleDeleteImage = async (imageId, e) => {
    e.stopPropagation();

    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      return;
    }

    try {
      const token = getAccessToken();
      await axios.delete(`${baseURL}/images/${imageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('خطأ في حذف الصورة:', error);
      alert('فشل حذف الصورة');
    }
  };

  // تحميل المزيد
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchImages(page + 1);
    }
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
              {images.length} صورة في {folder}
            </p>
          </div>
          <button
            onClick={close}
            className='p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-red-500 hover:text-white transition-all'
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='p-8 overflow-y-auto' id="images-container">
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>

            {/* Upload Button Card with Advanced Progress */}
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`group relative aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-all ${
                isUploading || isCompressing
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
                disabled={isUploading || isCompressing}
              />

              {isCompressing ? (
                // ✅ واجهة ضغط الصور
                <div className="flex flex-col items-center w-full px-3">
                  <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                    <svg className="w-full h-full transform -rotate-90 animate-pulse">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-gray-200 dark:text-zinc-800" />
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={2 * Math.PI * 36} strokeDashoffset={2 * Math.PI * 36 * (1 - compressionProgress / 100)} className="text-yellow-500 transition-all duration-300" strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  <div className="w-full text-center space-y-1">
                    <p className='text-xs font-medium text-yellow-600 animate-pulse'>
                      جاري ضغط الصورة...
                    </p>
                    <p className="text-[10px] text-gray-600 dark:text-zinc-400">
                      {formatBytes(originalSize)}
                    </p>
                  </div>
                </div>
              ) : isUploading ? (
                // Progress متقدم مع معلومات مفصلة
                <div className="flex flex-col items-center w-full px-3">
                  <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-gray-200 dark:text-zinc-800" />
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={2 * Math.PI * 36} strokeDashoffset={2 * Math.PI * 36 * (1 - uploadProgress / 100)} className="text-blue-600 transition-all duration-300" strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-lg font-bold text-blue-600">{uploadProgress}%</span>
                    </div>
                  </div>

                  <div className="w-full text-center space-y-1">
                    <p className='text-xs font-medium text-blue-600 animate-pulse truncate'>
                      جاري الرفع...
                    </p>
                    
                    {/* ✅ معلومات الضغط إذا تم الضغط */}
                    {originalSize !== compressedSize && (
                      <p className="text-[10px] text-green-600 font-medium">
                        تم توفير {getCompressionRatio()}% من الحجم
                      </p>
                    )}
                    
                    <p className="text-[10px] text-gray-600 dark:text-zinc-400">
                      {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
                    </p>
                    
                    {uploadSpeed > 0 && (
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500">
                        {formatSpeed(uploadSpeed)}
                      </p>
                    )}
                    
                    {timeRemaining > 0 && uploadProgress < 95 && (
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500">
                        متبقي: {formatTime(timeRemaining)}
                      </p>
                    )}
                  </div>

                  <div className="w-full mt-2">
                    <div className="w-full h-1 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
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
                  <span className='text-xs text-gray-500 mt-1'>
                    تلقائي الضغط للصور الكبيرة
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

                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2'>
                  <span className='bg-white text-black px-4 py-1 rounded-full text-xs font-bold'>
                    اختيار
                  </span>

                  <button
                    onClick={(e) => handleDeleteImage(img.id, e)}
                    className='bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition'
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <p className='text-white text-xs truncate'>{img.originalName}</p>
                  <p className='text-white/70 text-[10px]'>{(img.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            ))}
          </div>

          {/* زر تحميل المزيد */}
          {hasMore && !loading && (
            <div className='flex justify-center mt-6'>
              <button
                onClick={loadMore}
                className='px-6 py-2 bg-gray-200 dark:bg-zinc-800 rounded-xl hover:bg-gray-300 dark:hover:bg-zinc-700 transition'
              >
                تحميل المزيد
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className='flex justify-center items-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          )}

          {/* رسالة عدم وجود صور */}
          {!loading && images.length === 0 && (
            <div className='text-center py-12'>
              <div className='text-gray-400 dark:text-zinc-600 mb-2'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className='text-gray-600 dark:text-zinc-400 font-medium'>لا توجد صور بعد</p>
              <p className='text-gray-500 dark:text-zinc-500 text-sm mt-1'>ابدأ برفع صورتك الأولى</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-8 py-4 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center'>
          <div className='text-sm text-gray-500 dark:text-zinc-400'>
            {images.length > 0 && `${images.length} صورة`}
          </div>
          <div className='flex gap-3'>
            <button
              onClick={close}
              className='px-6 py-2 text-gray-500 font-bold hover:text-gray-700 transition'
            >
              إغلاق
            </button>
            <button
              disabled={isUploading || isCompressing}
              onClick={() => fileInputRef.current?.click()}
              className={`px-8 py-2.5 rounded-xl font-bold transition-all ${
                isUploading || isCompressing
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
              }`}
            >
              {isCompressing ? 'جاري الضغط...' : isUploading ? 'جاري التحميل...' : 'رفع صورة جديدة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}