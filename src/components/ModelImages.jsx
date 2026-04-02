import React, { useRef, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { baseURL } from '../constents/const.';
import { getAccessToken } from '../services/access-token';
import { useTranslation } from 'react-i18next'; // ✅ استيراد مكتبة الترجمة

// ✅ دالة ضغط الصور (بدون تغيير)
const compressImage = async (file, options = {}) => {
  // ... (نفس كود الضغط السابق الخاص بك)
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8, type = 'image/jpeg' } = options;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: type, lastModified: Date.now() });
              resolve(compressedFile);
            } else reject(new Error('Compression failed'));
          },
          type,
          quality
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('File read failed'));
  });
};

// ✅ إعدادات المجلدات (أزلنا النصوص الثابتة لنعتمد على الترجمة لاحقاً)
const foldersConfig = {
  products: {
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    aspectRatio: 'aspect-square',
    gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  productVariant: {
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    color: 'from-indigo-500 to-blue-600',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-600',
    aspectRatio: 'aspect-square',
    gridCols: 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6', // شبكة أصغر لأنها صور تفصيلية
    compression: { 
      maxWidth: 600, // مقاس أصغر لسرعة التحميل في صفحات تفاصيل المنتج
      maxHeight: 600, 
      quality: 0.75 
    }
  },
  category: {
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600',
    aspectRatio: 'aspect-square',
    gridCols: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  },
  hero: {
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2z',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-600',
    aspectRatio: 'aspect-[21/9]',
    gridCols: 'grid-cols-1',
  },
  logo: {
    icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-600',
    aspectRatio: 'aspect-square',
    gridCols: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
  },
  favicon: {
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    aspectRatio: 'aspect-square',
    gridCols: 'grid-cols-5 md:grid-cols-8 lg:grid-cols-10',
  }
};

const folderIds = Object.keys(foldersConfig);
const defaultConfig = foldersConfig.products;

export default function ModelImages({ isOpen, close, onSelectImage, initialFolder = 'products' }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'imageModel' }); // ✅ تهيئة مكتبة الترجمة

  const getValidFolder = (folder) => folderIds.includes(folder) ? folder : 'products';

  const fileInputRef = useRef(null);
  const [currentFolder, setCurrentFolder] = useState(() => getValidFolder(initialFolder));
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [folderCounts, setFolderCounts] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [size, setSize] = useState(0);
  const [countFolder, setCountFolder] = useState(0);

  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  
  const currentConfig = foldersConfig[currentFolder] || defaultConfig;

  useEffect(() => {
    const validFolder = getValidFolder(initialFolder);
    if (validFolder !== currentFolder) {
      setCurrentFolder(validFolder);
      setImages([]);
      setPage(1);
    }
  }, [initialFolder]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const fetchFolderCounts = useCallback(async () => {
    try {
      const token = getAccessToken();
      const counts = {};
      await Promise.all(
        folderIds.map(async (id) => {
          try {
            const response = await axios.get(`${baseURL}/images`, {
              params: { page: 1, limit: 1, folder: id },
              headers: { Authorization: `Bearer ${token}` },
            });
            counts[id] = response.data.total || 0;
          } catch {
            counts[id] = 0;
          }
        })
      );
      setFolderCounts(counts);
    } catch (error) {
      console.error(t('errors.fetch_counts'), error); // ✅ ترجمة
    }
  }, [t]);

  const fetchImages = useCallback(async (pageNum = 1, folder = currentFolder) => {
    const token = getAccessToken();
    setLoading(true);
    try {
      const limit = folder === 'hero' ? 6 : folder === 'favicon' ? 50 : 20;
      const response = await axios.get(`${baseURL}/images`, {
        params: { page: pageNum, limit, folder },
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      setImages(prev => pageNum === 1 ? data.images : [...prev, ...data.images]);
      setHasMore(data.page < data.totalPages);
      setPage(pageNum);
      setFolderCounts(prev => ({ ...prev, [folder]: data.total || 0 }));
    } catch (error) {
      console.error(t('errors.fetch_images'), error); // ✅ ترجمة
    } finally {
      setLoading(false);
    }
  }, [currentFolder, t]);

  const fetchSize = useCallback(async () => {
    const token = getAccessToken();
    try {
      const response = await axios.get(`${baseURL}/images/get-size`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSize(response.data.totalSize);
      setCountFolder(response.data.count)
    } catch (error) {
      console.error(t('errors.fetch_size'), error); // ✅ ترجمة
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchImages(1, currentFolder);
      }, 100);
      fetchFolderCounts();
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentFolder, fetchImages, fetchFolderCounts]);

  useEffect(() => {
    if (isOpen) fetchSize();
  }, [isOpen, size, fetchSize , countFolder]);

  const handleFolderChange = (newFolder) => {
    if (newFolder === currentFolder || isUploading) return;
    setCurrentFolder(newFolder);
    setImages([]);
    setPage(1);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(t('alerts.unsupported_type')); // ✅ ترجمة
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert(t('alerts.file_too_large')); // ✅ ترجمة
      return;
    }

    setIsUploading(true);
    setOriginalSize(file.size);
    let fileToUpload = file;

    if (file.size > 1024 * 1024) {
      setIsCompressing(true);
      setCompressionProgress(30);

      try {
        const compressionOptions = {
          maxWidth: currentFolder === 'hero' ? 1920 : currentFolder === 'favicon' ? 64 : currentFolder === 'logo' ? 512 : 1200,
          maxHeight: currentFolder === 'hero' ? 1080 : currentFolder === 'favicon' ? 64 : currentFolder === 'logo' ? 512 : 1200,
          quality: file.type === 'image/png' ? 0.9 : 0.85,
          type: file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        };

        fileToUpload = await compressImage(file, compressionOptions);
        setCompressedSize(fileToUpload.size);
        setCompressionProgress(100);
      } catch (error) {
        console.error(t('errors.compression_failed'), error); // ✅ ترجمة
        fileToUpload = file;
        setCompressedSize(file.size);
      } finally {
        setTimeout(() => setIsCompressing(false), 500);
      }
    } else {
      setCompressedSize(file.size);
    }

    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    const token = getAccessToken();

    try {
      const response = await axios.post(
        `${baseURL}/images/upload?folder=${currentFolder}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          },
        }
      );

      const uploadedImage = response.data;
      setImages(prev => [uploadedImage, ...prev]);
      setFolderCounts(prev => ({ ...prev, [currentFolder]: (prev[currentFolder] || 0) + 1 }));

      if (onSelectImage) {
        onSelectImage(uploadedImage);
        close();
      }
    } catch (error) {
      console.error(t('errors.upload_failed'), error);
      alert(error.response?.data?.message || t('alerts.upload_failed')); // ✅ ترجمة
    } finally {
      setIsUploading(false);
      setCompressionProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDeleteImage = async (imageId, e) => {
    e.stopPropagation();
    if (!window.confirm(t('alerts.confirm_delete'))) return; // ✅ ترجمة

    try {
      const token = getAccessToken();
      await axios.delete(`${baseURL}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImages(prev => prev.filter(img => img.id !== imageId));
      setFolderCounts(prev => ({ ...prev, [currentFolder]: Math.max(0, (prev[currentFolder] || 0) - 1) }));
    } catch (error) {
      console.error(t('errors.delete_failed'), error);
      alert(t('alerts.delete_failed')); // ✅ ترجمة
    }
  };

  const handleSelectImage = (image) => {
    if (onSelectImage) onSelectImage(image);
    close();
  };

  const loadMore = () => {
    if (!loading && hasMore) fetchImages(page + 1, currentFolder);
  };

  if (!isOpen) return null;

  // تحديد اتجاه الصفحة بناءً على اللغة (RTL للعربية، LTR للغات الأخرى)
  const isRTL = i18n.language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-zinc-900 border-x border-gray-200 dark:border-zinc-800 flex flex-col transition-all duration-300 shadow-2xl`}>
        {/* Logo Area */}
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2z" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h2 className="font-black text-xl text-gray-900 dark:text-white">{t('ui.library')}</h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('ui.media_management')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Folder Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!sidebarCollapsed && (
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">{t('ui.folders')}</p>
          )}

          {folderIds.map((id) => {
            const isActive = currentFolder === id;
            const config = foldersConfig[id];
            const count = folderCounts[id] || 0;

            return (
              <button
                key={id}
                onClick={() => handleFolderChange(id)}
                disabled={isUploading}
                className={`w-full group relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${isActive
                    ? `${config.bgColor} dark:bg-opacity-20 shadow-lg scale-[1.02]`
                    : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                {isActive && (
                  <div className={`absolute ${isRTL ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b ${config.color}`} />
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive
                    ? `bg-gradient-to-br ${config.color} text-white shadow-lg`
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 group-hover:scale-110'
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                  </svg>
                </div>

                {!sidebarCollapsed && (
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <h3 className={`font-bold text-sm ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-zinc-400'}`}>
                      {t(`folders.${id}.name`)} {/* ✅ ترجمة اسم المجلد */}
                    </h3>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">{count} {t('ui.images')}</p>

                  </div>
                )}

                {!sidebarCollapsed && isActive && (
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse Button */}
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${sidebarCollapsed ? (isRTL ? 'rotate-180' : 'rotate-0') : (isRTL ? 'rotate-0' : 'rotate-180')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-zinc-950/50 backdrop-blur-xl">
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${currentConfig.color}`} />
              {t(`folders.${currentFolder}.name`)}
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t(`folders.${currentFolder}.description`)}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${currentConfig.bgColor} ${currentConfig.textColor}`}>
              {countFolder || 0} {t('ui.images')}
            </span>

            <span className="px-4 py-2 rounded-full text-sm font-bold bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              {formatBytes(size)}
            </span>

            <button onClick={close} className="p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full text-gray-400 hover:text-red-500 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Drop Zone */}
        <div
          className={`m-6 mb-0 transition-all duration-300 ${isDragging ? 'scale-[1.02]' : ''}`}
          onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
        >
          <div className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${isDragging ? `border-blue-500 ${currentConfig.bgColor} scale-[1.02]` : 'border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'}`}>
            <input type="file" ref={fileInputRef} hidden onChange={(e) => handleFileUpload(e.target.files[0])} accept="image/*" disabled={isUploading} />
            <div onClick={() => !isUploading && fileInputRef.current?.click()} className="p-8 flex flex-col items-center justify-center cursor-pointer">
              {isUploading ? (
                <div className="w-full max-w-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700 dark:text-white">
                      {isCompressing ? t('upload.compressing') : t('upload.uploading')}
                    </span>
                    <span className={`text-sm font-bold ${currentConfig.textColor}`}>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${currentConfig.color}`} style={{ width: `${isCompressing ? compressionProgress : uploadProgress}%` }} />
                  </div>
                  {originalSize > 0 && compressedSize > 0 && originalSize !== compressedSize && (
                    <p className="text-xs text-green-600 mt-2 text-center">
                      ✅ {t('upload.saved_size', { percent: Math.round(((originalSize - compressedSize) / originalSize) * 100), oldSize: formatBytes(originalSize), newSize: formatBytes(compressedSize) })}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentConfig.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {isDragging ? t('upload.drop_here') : t('upload.click_or_drag')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">JPG, PNG, GIF, WebP (Max 50MB)</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={`grid ${currentConfig.gridCols} gap-4`}>
            {images.map((img, index) => (
              <div key={img.id} onClick={() => setSelectedImage(img)} className={`group relative ${currentConfig.aspectRatio} overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${currentFolder === 'hero' ? 'col-span-full' : ''}`} style={{ animationDelay: `${index * 50}ms` }}>
                <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={img.originalName} loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                  <p className="text-white font-bold text-sm truncate mb-1">{img.originalName}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-xs">{(img.size / 1024).toFixed(0)} KB</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleSelectImage(img); }} className={`p-2 bg-white text-gray-900 rounded-lg hover:bg-gradient-to-r hover:${currentConfig.color} hover:text-white transition-all`} title={t('ui.select')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button onClick={(e) => handleDeleteImage(img.id, e)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" title={t('ui.delete')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && !loading && images.length > 0 && (
            <div className="flex justify-center mt-8">
              <button onClick={loadMore} className="px-8 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl font-bold text-gray-700 dark:text-zinc-300 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 hover:border-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                {t('ui.load_more')}
              </button>
            </div>
          )}

          {loading && (
            // ... Skeleton Loader (لم يتم تغييره)
            <div className={`grid ${currentConfig.gridCols} gap-4 mt-4`}>
              {[...Array(8)].map((_, i) => <div key={i} className={`${currentConfig.aspectRatio} rounded-2xl bg-gray-200 dark:bg-zinc-800 animate-pulse`} />)}
            </div>
          )}

          {!loading && images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className={`w-32 h-32 rounded-full ${currentConfig.bgColor} flex items-center justify-center mb-6`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${currentConfig.textColor} opacity-50`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={currentConfig.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('ui.empty_folder')}</h3>
              <p className="text-gray-500 dark:text-zinc-400 max-w-sm">
                {t('ui.empty_folder_desc', { folder: t(`folders.${currentFolder}.name`) })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}