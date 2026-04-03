import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { baseURL } from '../constents/const.';
import { getAccessToken } from '../services/access-token';
import { useTranslation } from 'react-i18next';

// ── Utilities ──
const compressImage = async (file, options = {}) => {
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
          width *= ratio; height *= ratio;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(new File([blob], file.name, { type, lastModified: Date.now() }));
            else reject(new Error('Compression failed'));
          }, type, quality
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('File read failed'));
  });
};

// ── Configuration ──
const foldersConfig = {
  products: {
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    color: '#3b82f6', aspectRatio: 'aspect-square', 
    gridCols: 'grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    mobileGridCols: 'grid-cols-2 xs:grid-cols-3',
  },
  productVariant: {
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    color: '#6366f1', aspectRatio: 'aspect-square', 
    gridCols: 'grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7',
    mobileGridCols: 'grid-cols-3 xs:grid-cols-4',
    compression: { maxWidth: 600, maxHeight: 600, quality: 0.75 },
  },
  category: {
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    color: '#8b5cf6', aspectRatio: 'aspect-square', 
    gridCols: 'grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    mobileGridCols: 'grid-cols-2 xs:grid-cols-3',
  },
  hero: {
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2z',
    color: '#f97316', aspectRatio: 'aspect-video', 
    gridCols: 'grid-cols-1',
    mobileGridCols: 'grid-cols-1',
  },
  logo: {
    icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
    color: '#10b981', aspectRatio: 'aspect-square', 
    gridCols: 'grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10',
    mobileGridCols: 'grid-cols-3 xs:grid-cols-4',
  },
  favicon: {
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    color: '#f59e0b', aspectRatio: 'aspect-square', 
    gridCols: 'grid-cols-4 xs:grid-cols-6 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12',
    mobileGridCols: 'grid-cols-4 xs:grid-cols-6',
  },
  landingPage: {
    icon: 'M9.75 17L9 20l-2.25 3h10.5l-2.25-3-.75-3m4.5-16.5h-10.5A2.25 2.25 0 004.5 5.25v10.5A2.25 2.25 0 006.75 18h10.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0017.25 3z',
    color: '#ec4899', aspectRatio: 'aspect-video', 
    gridCols: 'grid-cols-1 sm:grid-cols-2',
    mobileGridCols: 'grid-cols-1',
    compression: { maxWidth: 2560, maxHeight: 1440, quality: 0.82 },
  },
};

const folderIds = Object.keys(foldersConfig);

// ── Custom Hook: Mobile Detection ──
const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.visualViewport?.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.visualViewport?.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  return { isMobile, isTouch, viewportHeight };
};

// ── Custom Hook: Reduced Motion ──
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
};

// ── Main Component ──
export default function ModelImages({ isOpen, close, onSelectImage, initialFolder = 'products' }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'imageModel' });
  const isRTL = i18n.language === 'ar';
  const { isMobile, isTouch, viewportHeight } = useMobileDetect();
  const prefersReducedMotion = useReducedMotion();

  const getValidFolder = (f) => folderIds.includes(f) ? f : 'products';
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const gridRef = useRef(null);
  const touchStartY = useRef(0);

  const [currentFolder, setCurrentFolder] = useState(() => getValidFolder(initialFolder));
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [folderCounts, setFolderCounts] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState(0);
  const [countFolder, setCountFolder] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null); // Lightbox state
  const [focusedIndex, setFocusedIndex] = useState(-1); // Keyboard nav

  const currentConfig = foldersConfig[currentFolder] || foldersConfig.products;

  // Dynamic grid based on mobile/desktop
  const activeGridCols = useMemo(() => 
    isMobile ? currentConfig.mobileGridCols : currentConfig.gridCols,
  [isMobile, currentConfig]);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // ── Data Fetching ──
  const fetchFolderCounts = useCallback(async () => {
    const token = getAccessToken();
    const counts = {};
    await Promise.all(folderIds.map(async (id) => {
      try {
        const res = await axios.get(`${baseURL}/images`, { 
          params: { page: 1, limit: 1, folder: id }, 
          headers: { Authorization: `Bearer ${token}` } 
        });
        counts[id] = res.data.total || 0;
      } catch { counts[id] = 0; }
    }));
    setFolderCounts(counts);
  }, []);

  const fetchImages = useCallback(async (pageNum = 1, folder = currentFolder) => {
    const token = getAccessToken();
    setLoading(true);
    try {
      const limit = folder === 'hero' ? 6 : folder === 'favicon' ? 50 : isMobile ? 12 : 20;
      const res = await axios.get(`${baseURL}/images`, { 
        params: { page: pageNum, limit, folder }, 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = res.data;
      setImages(prev => pageNum === 1 ? data.images : [...prev, ...data.images]);
      setHasMore(data.page < data.totalPages);
      setPage(pageNum);
      setFolderCounts(prev => ({ ...prev, [folder]: data.total || 0 }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [currentFolder, isMobile]);

  const fetchSize = useCallback(async () => {
    const token = getAccessToken();
    try {
      const res = await axios.get(`${baseURL}/images/get-size`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setSize(res.data.totalSize);
      setCountFolder(res.data.count);
    } catch (e) { console.error(e); }
  }, []);

  // ── Effects ──
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => fetchImages(1, currentFolder), 100);
      fetchFolderCounts();
      return () => clearTimeout(t);
    }
  }, [isOpen, currentFolder]);

  useEffect(() => { if (isOpen) fetchSize(); }, [isOpen]);

  useEffect(() => {
    const valid = getValidFolder(initialFolder);
    if (valid !== currentFolder) { 
      setCurrentFolder(valid); 
      setImages([]); 
      setPage(1); 
    }
  }, [initialFolder]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedImage) setSelectedImage(null);
        else close();
      }
      if (e.key === 'ArrowRight' && focusedIndex < images.length - 1) {
        setFocusedIndex(prev => prev + 1);
        document.getElementById(`img-${focusedIndex + 1}`)?.focus();
      }
      if (e.key === 'ArrowLeft' && focusedIndex > 0) {
        setFocusedIndex(prev => prev - 1);
        document.getElementById(`img-${focusedIndex - 1}`)?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedImage, images.length, focusedIndex]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  // ── Handlers ──
  const handleFolderChange = (f) => {
    if (f === currentFolder || isUploading) return;
    setCurrentFolder(f); 
    setImages([]); 
    setPage(1);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) { 
      alert(t('alerts.unsupported_type')); 
      return; 
    }
    if (file.size > 50 * 1024 * 1024) { 
      alert(t('alerts.file_too_large')); 
      return; 
    }

    setIsUploading(true);
    setOriginalSize(file.size);
    let fileToUpload = file;

    if (file.size > 1024 * 1024) {
      setIsCompressing(true);
      setCompressionProgress(30);
      try {
        const opts = {
          maxWidth: currentFolder === 'hero' ? 1920 : currentFolder === 'favicon' ? 64 : currentFolder === 'logo' ? 512 : 1200,
          maxHeight: currentFolder === 'hero' ? 1080 : currentFolder === 'favicon' ? 64 : currentFolder === 'logo' ? 512 : 1200,
          quality: file.type === 'image/png' ? 0.9 : 0.85,
          type: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        };
        fileToUpload = await compressImage(file, opts);
        setCompressedSize(fileToUpload.size);
        setCompressionProgress(100);
      } catch { 
        fileToUpload = file; 
        setCompressedSize(file.size); 
      }
      finally { 
        setTimeout(() => setIsCompressing(false), prefersReducedMotion ? 0 : 500); 
      }
    } else { 
      setCompressedSize(file.size); 
    }

    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    const token = getAccessToken();

    try {
      const res = await axios.post(`${baseURL}/images/upload?folder=${currentFolder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });
      const uploaded = res.data;
      setImages(prev => [uploaded, ...prev]);
      setFolderCounts(prev => ({ ...prev, [currentFolder]: (prev[currentFolder] || 0) + 1 }));
      if (onSelectImage) { 
        onSelectImage(uploaded); 
        close(); 
      }
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || t('alerts.upload_failed'));
    } finally { 
      setIsUploading(false); 
      setCompressionProgress(0); 
    }
  };

  const handleDeleteImage = async (imageId, e) => {
    e?.stopPropagation();
    if (!window.confirm(t('alerts.confirm_delete'))) return;
    try {
      const token = getAccessToken();
      await axios.delete(`${baseURL}/images/${imageId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setImages(prev => prev.filter(img => img.id !== imageId));
      setFolderCounts(prev => ({ 
        ...prev, 
        [currentFolder]: Math.max(0, (prev[currentFolder] || 0) - 1) 
      }));
    } catch { 
      alert(t('alerts.delete_failed')); 
    }
  };

  const handleSelectImage = (image, index) => { 
    if (isMobile && isTouch) {
      // On mobile, first tap shows preview, second selects
      setSelectedImage(image);
    } else {
      if (onSelectImage) onSelectImage(image); 
      close(); 
    }
  };

  const loadMore = () => { 
    if (!loading && hasMore) fetchImages(page + 1, currentFolder); 
  };

  // Touch handlers for swipe-to-close
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!modalRef.current) return;
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY.current;
    
    // Pull down to close gesture (only when at top of scroll)
    if (diff > 80 && gridRef.current?.scrollTop === 0) {
      modalRef.current.style.transform = `translateY(${diff * 0.3}px)`;
      modalRef.current.style.opacity = `${1 - (diff / 400)}`;
    }
  };

  const handleTouchEnd = (e) => {
    if (!modalRef.current) return;
    const touchY = e.changedTouches[0].clientY;
    const diff = touchY - touchStartY.current;
    
    if (diff > 120 && gridRef.current?.scrollTop === 0) {
      close();
    } else {
      // Reset with animation
      modalRef.current.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      modalRef.current.style.transform = '';
      modalRef.current.style.opacity = '';
      setTimeout(() => {
        if (modalRef.current) modalRef.current.style.transition = '';
      }, 300);
    }
  };

  if (!isOpen) return null;

  const progress = isCompressing ? compressionProgress : uploadProgress;

  // ── Sub-components ──
  const FolderTab = ({ id, mobile = false }) => {
    const cfg = foldersConfig[id];
    const active = currentFolder === id;
    const count = folderCounts[id] || 0;

    if (mobile) {
      return (
        <button
          key={id}
          onClick={() => handleFolderChange(id)}
          disabled={isUploading}
          className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-150 active:scale-95 touch-manipulation ${
            active ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-gray-400 dark:text-zinc-500'
          }`}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: active ? cfg.color + '20' : 'transparent' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              style={{ color: active ? cfg.color : undefined }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
            </svg>
          </div>
          <span className="text-[10px] font-medium leading-none" style={{ color: active ? cfg.color : undefined }}>
            {count}
          </span>
        </button>
      );
    }

    return (
      <button
        key={id}
        onClick={() => handleFolderChange(id)}
        disabled={isUploading}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          active
            ? 'bg-white dark:bg-zinc-800 shadow-sm text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200'
        }`}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
          style={{
            backgroundColor: active ? cfg.color : 'transparent',
            boxShadow: active ? `0 0 0 3px ${cfg.color}25` : 'none',
            border: active ? 'none' : '2px solid #d1d5db',
          }}
        />
        <span className="flex-1 truncate text-start">{t(`folders.${id}.name`)}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
          active ? 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300' : 'text-gray-300 dark:text-zinc-600'
        }`}>{count}</span>
      </button>
    );
  };

  // ── Lightbox Component ──
  const Lightbox = () => {
    if (!selectedImage) return null;
    
    return (
      <div 
        className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={() => setSelectedImage(null)}
      >
        <button 
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
          onClick={() => setSelectedImage(null)}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <img 
          src={selectedImage.url} 
          alt={selectedImage.originalName}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
            <p className="font-medium truncate max-w-[200px]">{selectedImage.originalName}</p>
            <p className="text-xs text-gray-300">{formatBytes(selectedImage.size)}</p>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectImage) {
                onSelectImage(selectedImage);
                close();
              }
            }}
            className="bg-white text-black px-4 py-2 rounded-lg font-medium text-sm active:scale-95 transition-transform"
          >
            {t('ui.select')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-sm md:items-center md:justify-center md:p-4"
        dir={isRTL ? 'rtl' : 'ltr'}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Modal Card */}
        <div 
          ref={modalRef}
          className={`
            w-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden
            border-gray-200 dark:border-zinc-800
            md:flex-row md:max-w-6xl md:h-[90vh] md:rounded-2xl md:border
            ${isMobile ? 'h-[100dvh] rounded-none' : 'h-full'}
          `}
          style={{ maxHeight: isMobile ? `${viewportHeight}px` : undefined }}
        >
          {/* Sidebar - Desktop */}
          <aside className="hidden md:flex md:w-52 lg:w-56 flex-shrink-0 border-e border-gray-100 dark:border-zinc-800 flex-col bg-gray-50 dark:bg-zinc-950">
            <div className="px-4 py-5 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: currentConfig.color + '20' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: currentConfig.color }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-sm text-gray-800 dark:text-white">{t('ui.library')}</span>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
              {folderIds.map((id) => <FolderTab key={id} id={id} />)}
            </nav>

            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex-shrink-0">
              <div className="text-xs text-gray-400 dark:text-zinc-500 flex items-center justify-between">
                <span>{t('ui.storage')}</span>
                <span className="font-mono font-medium text-gray-600 dark:text-zinc-300">{formatBytes(size)}</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Header */}
            <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0 gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                  {t(`folders.${currentFolder}.name`)}
                </h2>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 hidden sm:block truncate">
                  {t(`folders.${currentFolder}.description`)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs px-2 sm:px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 font-medium hidden sm:inline-flex">
                  {countFolder} {t('ui.images')}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 font-mono md:hidden">
                  {formatBytes(size)}
                </span>
                <button
                  onClick={close}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 active:scale-95 transition-all touch-manipulation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeJoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </header>

            {/* Mobile Folder Tabs */}
            <div className="md:hidden flex-shrink-0 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 px-2 py-1.5">
              <div className="flex gap-1 overflow-x-auto scrollbar-none pb-safe">
                {folderIds.map((id) => <FolderTab key={id} id={id} mobile />)}
              </div>
            </div>

            {/* Upload Zone */}
            <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex-shrink-0">
              <input 
                type="file" 
                ref={fileInputRef} 
                hidden 
                onChange={(e) => handleFileUpload(e.target.files[0])} 
                accept="image/*" 
                disabled={isUploading}
                capture={isMobile ? "environment" : undefined} // Allow camera on mobile
              />
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files[0]); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 active:scale-[0.99] touch-manipulation ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/5'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-gray-50/50 dark:bg-zinc-800/30'
                }`}
              >
                {isUploading ? (
                  <div className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-zinc-300">
                        {isCompressing ? t('upload.compressing') : t('upload.uploading')}
                      </span>
                      <span className="text-xs font-mono font-semibold" style={{ color: currentConfig.color }}>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%`, backgroundColor: currentConfig.color }} 
                      />
                    </div>
                    {originalSize > 0 && compressedSize > 0 && originalSize !== compressedSize && (
                      <p className="text-[11px] text-green-600 dark:text-green-400 mt-1.5">
                        ✓ {t('upload.saved_size', { 
                          percent: Math.round(((originalSize - compressedSize) / originalSize) * 100), 
                          oldSize: formatBytes(originalSize), 
                          newSize: formatBytes(compressedSize) 
                        })}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4">
                    <div 
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0" 
                      style={{ backgroundColor: currentConfig.color + '15' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: currentConfig.color }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-200 truncate">
                        {isDragging ? t('upload.drop_here') : t('upload.click_or_drag')}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                        JPG, PNG, GIF, WebP · Max 50MB
                        {isMobile && <span className="ml-1 text-blue-500">· {t('upload.tap_camera')}</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Images Grid */}
            <div 
              ref={gridRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain"
            >
              {/* Skeleton - Initial Load */}
              {loading && images.length === 0 && (
                <div className={`grid ${activeGridCols} gap-2 sm:gap-3`}>
                  {[...Array(isMobile ? 8 : 12)].map((_, i) => (
                    <div key={i} className={`${currentConfig.aspectRatio} rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse`} />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && images.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                  <div 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3" 
                    style={{ backgroundColor: currentConfig.color + '15' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: currentConfig.color }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={currentConfig.icon} />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-700 dark:text-zinc-200 text-sm">{t('ui.empty_folder')}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 max-w-[240px]">
                    {t('ui.empty_folder_desc', { folder: t(`folders.${currentFolder}.name`) })}
                  </p>
                </div>
              )}

              {/* Grid */}
              {images.length > 0 && (
                <div className={`grid ${activeGridCols} gap-2 sm:gap-3`}>
                  {images.map((img, index) => (
                    <div
                      key={img.id}
                      id={`img-${index}`}
                      tabIndex={0}
                      onClick={() => handleSelectImage(img, index)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectImage(img, index)}
                      onFocus={() => setFocusedIndex(index)}
                      className={`
                        group relative ${currentConfig.aspectRatio} overflow-hidden rounded-xl 
                        bg-gray-100 dark:bg-zinc-800 cursor-pointer 
                        border-2 border-transparent hover:border-gray-300 dark:hover:border-zinc-600 
                        focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                        transition-all duration-200 
                        ${currentFolder === 'hero' ? 'col-span-full' : ''}
                        ${prefersReducedMotion ? '' : 'hover:scale-[1.02] active:scale-95'}
                        touch-manipulation
                      `}
                    >
                      <img
                        src={img.url}
                        className={`w-full h-full object-cover ${prefersReducedMotion ? '' : 'transition-transform duration-300 group-hover:scale-105'}`}
                        alt={img.originalName}
                        loading={index < 8 ? "eager" : "lazy"} // Priority load first 8
                        decoding="async"
                      />
                      
                      {/* Hover/Touch Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 group-active:bg-black/40 transition-all duration-200 flex items-end justify-between p-2 sm:p-2.5 opacity-0 group-hover:opacity-100 group-active:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        <span className="text-white text-[10px] font-medium truncate max-w-[65%] drop-shadow">
                          {(img.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          onClick={(e) => handleDeleteImage(img.id, e)}
                          className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center transition-colors flex-shrink-0 touch-manipulation"
                          title={t('ui.delete')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Mobile Selection Indicator */}
                      {isMobile && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 dark:bg-zinc-800/90 flex items-center justify-center opacity-0 group-active:opacity-100 shadow-sm">
                          <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Skeleton - Load More */}
              {loading && images.length > 0 && (
                <div className={`grid ${activeGridCols} gap-2 sm:gap-3 mt-2 sm:mt-3`}>
                  {[...Array(isMobile ? 4 : 6)].map((_, i) => (
                    <div key={i} className={`${currentConfig.aspectRatio} rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse`} />
                  ))}
                </div>
              )}

              {/* Load More */}
              {hasMore && !loading && images.length > 0 && (
                <div className="flex justify-center mt-5 sm:mt-6 pb-safe">
                  <button
                    onClick={loadMore}
                    className="px-4 sm:px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:border-gray-300 dark:hover:border-zinc-600 hover:shadow-sm active:scale-95 transition-all flex items-center gap-2 touch-manipulation min-h-[44px]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {t('ui.load_more')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Pull-to-hint (Mobile) */}
        {isMobile && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full pointer-events-none" />
        )}
      </div>
      
      {/* Lightbox */}
      <Lightbox />
    </>
  );
}