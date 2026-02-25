import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Package, ArrowLeft, Edit2, Trash2, Eye,
    Tag, DollarSign, Archive, ShoppingCart,
    Calendar, BarChart3, Box, AlertCircle,
    CheckCircle2, XCircle, Clock, TrendingUp,
    Image as ImageIcon, FileText, Layers,
    Share2, Printer, MoreVertical, ChevronRight,
    Store, MapPin, Phone, Mail, Globe,
    Star, Heart, MessageSquare, Activity,
    Download, Copy, ExternalLink, Palette,
    Ruler, Sparkles, Percent, Grid3X3,
    ChevronDown, ChevronUp, Tag as TagIcon
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const API_BASE_URL = baseURL;

const ProductShow = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const token = getAccessToken();

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [storeId, setStoreId] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [expandedAttrs, setExpandedAttrs] = useState({});
    const [selectedVariant, setSelectedVariant] = useState(null);

    // Get storeId from localStorage
    useEffect(() => {
        const storedStoreId = localStorage.getItem('storeId');
        if (storedStoreId) {
            setStoreId(storedStoreId);
        } else {
            toast.error('لم يتم العثور على معرف المتجر');
            navigate('/dashboard/products');
        }
    }, [navigate]);

    // Fetch product details
    useEffect(() => {
        if (storeId && id) {
            fetchProductDetails();
        }
    }, [storeId, id]);

    const fetchProductDetails = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/stores/${storeId}/products/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(response.data);

            setProduct(response.data);
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('فشل في تحميل تفاصيل المنتج');
            navigate('/dashboard/products');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(
                `${API_BASE_URL}/stores/${storeId}/products/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            toast.success('تم حذف المنتج بنجاح');
            navigate('/dashboard/products');
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('فشل في حذف المنتج');
        }
    };

    const toggleProductStatus = async () => {
        try {
            await axios.patch(
                `${API_BASE_URL}/stores/${storeId}/products/${id}/toggle-active`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            toast.success(product?.isActive ? 'تم تعطيل المنتج' : 'تم تفعيل المنتج');
            fetchProductDetails();
        } catch (error) {
            toast.error('فشل في تغيير حالة المنتج');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ar-DZ', {
            style: 'currency',
            currency: 'DZD',
            minimumFractionDigits: 0
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusConfig = (product) => {
        if (!product?.isActive) return {
            icon: XCircle,
            style: 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700',
            label: 'معطل',
            desc: 'المنتج غير متاح للعرض في المتجر'
        };
        if (product?.stock === 0) return {
            icon: AlertCircle,
            style: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
            label: 'نفذت الكمية',
            desc: 'المنتج غير متوفر حالياً'
        };
        if (product?.stock < 5) return {
            icon: Clock,
            style: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
            label: 'كمية قليلة',
            desc: 'الكمية المتبقية أقل من 5 وحدات'
        };
        return {
            icon: CheckCircle2,
            style: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
            label: 'نشط',
            desc: 'المنتج متاح ويعمل بشكل طبيعي'
        };
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('تم النسخ إلى الحافظة');
    };

    const toggleAttrExpand = (attrId) => {
        setExpandedAttrs(prev => ({
            ...prev,
            [attrId]: !prev[attrId]
        }));
    };

    const getAttributeIcon = (type) => {
        switch (type) {
            case 'color': return Palette;
            case 'size': return Ruler;
            default: return TagIcon;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center" dir="rtl">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-200 dark:border-zinc-800 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-zinc-400">جاري تحميل تفاصيل المنتج...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center" dir="rtl">
                <div className="text-center">
                    <Package size={48} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">المنتج غير موجود</h2>
                    <p className="text-gray-500 dark:text-zinc-400 mb-4">لم يتم العثور على المنتج المطلوب</p>
                    <Link
                        to="/dashboard/products"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <ArrowLeft size={18} />
                        العودة للمنتجات
                    </Link>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(product);
    const StatusIcon = statusConfig.icon;
    const images = product.imagesProduct || [];
    console.log(images);

    const hasDiscount = product.priceOriginal && product.priceOriginal > product.price;
    const discountPercentage = hasDiscount
        ? Math.round(((product.priceOriginal - product.price) / product.priceOriginal) * 100)
        : 0;

    // Calculate total variants count
    const totalVariants = product.attributes?.reduce((acc, attr) => acc + (attr.variants?.length || 0), 0) || 0;

    // Check if has active offers
    const hasOffers = product.offers && product.offers.length > 0;
    const activeOffers = product.offers?.filter(o => o.isActive) || [];

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 pb-12" dir="rtl">
            <Toaster position="top-center" richColors />

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-xl">
                        <div className="flex items-center gap-3 text-rose-600 mb-4">
                            <AlertCircle size={24} />
                            <h3 className="text-lg font-bold">تأكيد الحذف</h3>
                        </div>
                        <p className="text-gray-600 dark:text-zinc-400 mb-6">
                            هل أنت متأكد من حذف المنتج <span className="font-semibold text-gray-900 dark:text-white">"{product.name}"</span>؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                            >
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-30">
                <div className="max-w-[1400px] mx-auto px-6 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/dashboard/products"
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {product.name}
                                    </h1>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.style}`}>
                                        {statusConfig.label}
                                    </span>
                                    {hasOffers && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 flex items-center gap-1">
                                            <Sparkles size={12} />
                                            عروض
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                                    <span className="font-mono">{product.sku || 'بدون SKU'}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span>تم الإضافة: {formatDate(product.createdAt)}</span>
                                    {totalVariants > 0 && (
                                        <>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>{totalVariants} متغير</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                to={`/store/${product.store?.subdomain || 'preview'}/products/${product.slug || product.id}`}
                                target="_blank"
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <Eye size={16} />
                                معاينة
                            </Link>
                            <button
                                onClick={() => copyToClipboard(window.location.href)}
                                className="p-2.5 text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                title="نسخ الرابط"
                            >
                                <Copy size={16} />
                            </button>
                            <button
                                onClick={toggleProductStatus}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${product.isActive
                                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100'
                                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100'
                                    }`}
                            >
                                {product.isActive ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                {product.isActive ? 'تعطيل' : 'تفعيل'}
                            </button>
                            <Link
                                to={`/dashboard/products/edit/${product.id}`}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <Edit2 size={16} />
                                تعديل
                            </Link>
                            <button
                                onClick={() => setDeleteModal(true)}
                                className="p-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Images & Quick Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Main Image */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                            <div className="aspect-square relative bg-gray-100 dark:bg-zinc-800">
                                <img
                                    src={images[selectedImage]?.imageUrl || images[selectedImage] || product.productImage || '/placeholder-product.png'}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = '/placeholder-product.png';
                                    }}
                                />
                                {hasDiscount && (
                                    <div className="absolute top-4 left-4 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                        خصم {discountPercentage}%
                                    </div>
                                )}
                                {selectedVariant && (
                                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                                        {selectedVariant.name}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="p-4 flex gap-2 overflow-x-auto">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setSelectedImage(idx);
                                                setSelectedVariant(null);
                                            }}
                                            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === idx && !selectedVariant
                                                ? 'border-indigo-600 dark:border-indigo-400'
                                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <img
                                                src={img.imageUrl}
                                                alt={`${product.name} - ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Variant Preview (if attributes exist) */}
                        {product.attributes && product.attributes.length > 0 && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Grid3X3 size={16} className="text-indigo-600" />
                                    خيارات المنتج
                                </h3>

                                <div className="space-y-6">
                                    {product.attributes.map((attr) => {
                                        const AttrIcon = getAttributeIcon(attr.type);
                                        return (
                                            <div key={attr.id} className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-zinc-400">
                                                    {AttrIcon && <AttrIcon size={14} />}
                                                    {attr.name}
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    {attr.variants?.map((variant) => (
                                                        <React.Fragment key={variant.id}>
                                                            {/* فحص إذا كان النوع لون أو صورة */}
                                                            {(attr.displayMode === 'color' || attr.displayMode === 'image') ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedVariant(variant)}
                                                                    className={`relative w-10 h-10 rounded-full border-2 transition-all p-0.5 flex items-center justify-center ${selectedVariant?.id === variant.id
                                                                        ? 'border-indigo-600 scale-110 ring-2 ring-indigo-100 dark:ring-indigo-900/30'
                                                                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-400'
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className="w-full h-full rounded-full shadow-inner bg-center bg-cover bg-no-repeat border border-black/5"
                                                                        style={{
                                                                            // المنطق الجديد: إذا كان Mode صورة استخدم backgroundImage، وإذا كان لون استخدم backgroundColor
                                                                            backgroundImage: attr.displayMode === 'image' ? `url("${variant.value}")` : 'none',
                                                                            backgroundColor: attr.displayMode === 'color' ? variant.value : 'transparent',
                                                                            width: '100%',
                                                                            height: '100%'
                                                                        }}
                                                                    />
                                                                    {selectedVariant?.id === variant.id && (
                                                                        <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 border border-white dark:border-zinc-900 z-10 shadow-sm">
                                                                            <CheckCircle2 size={10} strokeWidth={3} />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                /* عرض المقاسات العادية */
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedVariant(variant)}
                                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedVariant?.id === variant.id
                                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm'
                                                                        : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                                                        }`}
                                                                >
                                                                    {variant.name}
                                                                </button>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* قسم العروض - Offers Section */}
                                {product.offers && product.offers.length > 0 && (
                                    <div className="pt-6 border-t border-gray-100 dark:border-zinc-800">
                                        <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Tag size={14} className="text-rose-500" />
                                            عروض الكميات المتاحة
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {product.offers.map((offer) => (
                                                <div
                                                    key={offer.id}
                                                    className="flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-rose-100 dark:border-rose-900/20 bg-rose-50/30 dark:bg-rose-500/5 group hover:border-rose-500 transition-colors"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                            اشترِ {offer.quantity} قطع
                                                        </span>
                                                        <span className="text-xs text-rose-600 font-medium">
                                                            سعر القطعة: {offer.price} د.ج
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs bg-rose-600 text-white px-2 py-1 rounded-lg font-bold">
                                                            وفر {Math.round(((product.price - offer.price) / product.price) * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Activity size={16} className="text-indigo-600" />
                                إحصائيات سريعة
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                                        <ShoppingCart size={16} />
                                        <span className="text-sm">المبيعات</span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">{product.salesCount || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                                        <Eye size={16} />
                                        <span className="text-sm">المشاهدات</span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">{product.views || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                                        <Heart size={16} />
                                        <span className="text-sm">المفضلة</span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">{product.wishlistCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Tabs */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                            <div className="border-b border-gray-200 dark:border-zinc-800">
                                <div className="flex overflow-x-auto">
                                    {['overview', 'variants', 'offers', 'inventory', 'seo'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                                                }`}
                                        >
                                            {tab === 'overview' && 'نظرة عامة'}
                                            {tab === 'variants' && `المتغيرات (${totalVariants})`}
                                            {tab === 'offers' && `العروض (${activeOffers.length})`}
                                            {tab === 'inventory' && 'المخزون'}
                                            {tab === 'seo' && 'SEO'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* Price Card */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                                                    <DollarSign size={18} />
                                                    <span className="text-sm font-medium">السعر الحالي</span>
                                                </div>
                                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                                    {formatPrice(product.price)}
                                                </p>
                                                {hasDiscount && (
                                                    <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 line-through mt-1">
                                                        {formatPrice(product.priceOriginal)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className={`p-4 rounded-xl border ${statusConfig.style}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <StatusIcon size={18} />
                                                    <span className="text-sm font-medium">حالة المنتج</span>
                                                </div>
                                                <p className="text-lg font-bold">{statusConfig.label}</p>
                                                <p className="text-xs opacity-80 mt-1">{statusConfig.desc}</p>
                                            </div>
                                        </div>

                                        {/* Active Offers Summary */}
                                        {activeOffers.length > 0 && (
                                            <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20">
                                                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-3">
                                                    <Sparkles size={18} />
                                                    <span className="text-sm font-semibold">العروض النشطة</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {activeOffers.slice(0, 2).map((offer, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-sm">
                                                            <span className="text-purple-700 dark:text-purple-400">{offer.name}</span>
                                                            <span className="font-bold text-purple-800 dark:text-purple-300">
                                                                {offer.discountType === 'percentage' ? `${offer.value}%` : formatPrice(offer.value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {activeOffers.length > 2 && (
                                                        <button
                                                            onClick={() => setActiveTab('offers')}
                                                            className="text-xs text-purple-600 hover:text-purple-700 underline"
                                                        >
                                                            +{activeOffers.length - 2} عرض آخر
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Description */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <FileText size={16} className="text-indigo-600" />
                                                الوصف
                                            </h3>
                                            <div className="prose dark:prose-invert max-w-none">
                                                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                                    {product.desc || 'لا يوجد وصف للمنتج'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Category & Tags */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <Layers size={16} className="text-indigo-600" />
                                                    التصنيف
                                                </h3>
                                                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                                        <Tag size={18} className="text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {product.category?.name || 'غير مصنف'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                                                            {product.category?.description || 'بدون وصف'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <Box size={16} className="text-indigo-600" />
                                                    المخزون
                                                </h3>
                                                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${product.stock === 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600' :
                                                        product.stock < 5 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
                                                            'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'
                                                        }`}>
                                                        <Archive size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {product.stock} وحدة
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                                                            {product.stock === 0 ? 'نفذت الكمية' :
                                                                product.stock < 5 ? 'كمية قليلة' : 'متوفر'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'variants' && (
                                    <div className="space-y-6">
                                        {product.attributes?.map((attribute) => {
                                            const AttrIcon = getAttributeIcon(attribute.type);
                                            const isExpanded = expandedAttrs[attribute.id];

                                            return (
                                                <div key={attribute.id} className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                                                    <button
                                                        onClick={() => toggleAttrExpand(attribute.id)}
                                                        className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-zinc-800/30 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-xl shadow-sm flex items-center justify-center border border-gray-100 dark:border-zinc-700">
                                                                <AttrIcon size={22} className="text-indigo-600 dark:text-indigo-400" />
                                                            </div>
                                                            <div className="text-right text-balance">
                                                                <p className="font-bold text-gray-900 dark:text-white leading-none mb-1">{attribute.name}</p>
                                                                <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium tracking-tight">
                                                                    {attribute.variants?.length || 0} خيارات • {attribute.type}
                                                                    {attribute.displayMode && <span className="mr-1 inline-flex items-center px-1.5 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 uppercase scale-90">{attribute.displayMode}</span>}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                                                                {isExpanded ? 'إغلاق' : 'توسيع'}
                                                            </span>
                                                            <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                                <ChevronDown size={18} className="text-gray-400" />
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="p-4 bg-white dark:bg-transparent border-t border-gray-100 dark:border-zinc-800">
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                                {attribute.variants?.map((variant) => (
                                                                    <div
                                                                        key={variant.id}
                                                                        onClick={() => setSelectedVariant(variant)}
                                                                        className={`group relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedVariant?.id === variant.id
                                                                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/5 ring-4 ring-indigo-50 dark:ring-indigo-900/10'
                                                                                : 'border-gray-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-zinc-700 bg-gray-50/30 dark:bg-zinc-900/20'
                                                                            }`}
                                                                    >
                                                                        <div className="flex flex-col items-center text-center gap-3">
                                                                            {/* التعامل مع اللون أو الصورة بناءً على displayMode */}
                                                                            {(attribute.displayMode === 'color' || attribute.displayMode === 'image') ? (
                                                                                <div
                                                                                    className="w-12 h-12 rounded-full shadow-md border-2 border-white dark:border-zinc-800 bg-center bg-cover bg-no-repeat transition-transform group-hover:scale-110"
                                                                                    style={{
                                                                                        backgroundColor: attribute.displayMode === 'color' ? variant.value : 'transparent',
                                                                                        backgroundImage: attribute.displayMode === 'image' ? `url("${variant.value}")` : 'none'
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs">
                                                                                    {variant.name.substring(0, 2)}
                                                                                </div>
                                                                            )}

                                                                            <div>
                                                                                <p className="font-bold text-xs text-gray-900 dark:text-white truncate max-w-[80px]">
                                                                                    {variant.name}
                                                                                </p>

                                                                                {variant.priceAdjustment !== 0 && (
                                                                                    <div className={`mt-1 inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold ${variant.priceAdjustment > 0
                                                                                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
                                                                                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                                                                                        }`}>
                                                                                        {variant.priceAdjustment > 0 ? '+' : ''}{formatPrice(variant.priceAdjustment)}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* مؤشر الاختيار */}
                                                                        {selectedVariant?.id === variant.id && (
                                                                            <div className="absolute -top-2 -left-2 bg-indigo-600 text-white rounded-full p-1 shadow-lg border-2 border-white dark:border-zinc-900">
                                                                                <Check size={12} strokeWidth={4} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {product.variantDetails && product.variantDetails.length > 0 && (
                                            <div className="mt-6">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">تفاصيل التوليفات</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50 dark:bg-zinc-800">
                                                            <tr>
                                                                <th className="px-4 py-2 text-right">التوليفة</th>
                                                                <th className="px-4 py-2 text-right">السعر</th>
                                                                <th className="px-4 py-2 text-right">المخزون</th>
                                                                <th className="px-4 py-2 text-right">SKU</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                                                            {product.variantDetails.map((detail, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                                                    <td className="px-4 py-3 font-medium">{detail.combinationName}</td>
                                                                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                                        {formatPrice(detail.price)}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`${detail.stock === 0 ? 'text-rose-600' :
                                                                            detail.stock < 5 ? 'text-amber-600' : 'text-gray-900 dark:text-white'
                                                                            }`}>
                                                                            {detail.stock}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{detail.sku || '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'offers' && (
                                    <div className="space-y-4">
                                        {product.offers?.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                                                <Percent size={48} className="mx-auto mb-3 opacity-50" />
                                                <p>لا توجد عروض لهذا المنتج</p>
                                            </div>
                                        ) : (
                                            product.offers?.map((offer, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-4 rounded-xl border ${offer.isActive
                                                        ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20'
                                                        : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 opacity-60'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${offer.isActive
                                                                ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
                                                                : 'bg-gray-200 dark:bg-zinc-700 text-gray-500'
                                                                }`}>
                                                                <Percent size={24} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-white">{offer.name}</h4>
                                                                <p className="text-sm text-gray-500 dark:text-zinc-400">
                                                                    {offer.startDate && formatDate(offer.startDate)} - {offer.endDate && formatDate(offer.endDate)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                                                                {offer.discountType === 'percentage' ? `${offer.value}%` : formatPrice(offer.value)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-zinc-400">
                                                                {offer.discountType === 'percentage' ? 'نسبة خصم' : 'خصم ثابت'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {offer.description && (
                                                        <p className="mt-3 text-sm text-gray-600 dark:text-zinc-400">{offer.description}</p>
                                                    )}
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${offer.isActive
                                                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                                            : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400'
                                                            }`}>
                                                            {offer.isActive ? 'نشط' : 'غير نشط'}
                                                        </span>
                                                        {offer.minQuantity && (
                                                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                                                                الحد الأدنى: {offer.minQuantity} قطع
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'inventory' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-center">
                                                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                                                    {product.stock}
                                                </p>
                                                <p className="text-sm text-indigo-600/70 dark:text-indigo-400/70">الكمية المتوفرة</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl text-center">
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                                    {product.minStock || 0}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-zinc-400">الحد الأدنى</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl text-center">
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                                    {product.maxStock || '∞'}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-zinc-400">الحد الأقصى</p>
                                            </div>
                                        </div>

                                        {/* Variant Inventory Summary */}
                                        {product.variantDetails && product.variantDetails.length > 0 && (
                                            <div className="mt-6">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">مخزون المتغيرات</h4>
                                                <div className="space-y-2">
                                                    {product.variantDetails.map((detail, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                                            <span className="text-sm text-gray-700 dark:text-zinc-300">{detail.combinationName}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-sm font-medium ${detail.stock === 0 ? 'text-rose-600' :
                                                                    detail.stock < 5 ? 'text-amber-600' : 'text-emerald-600'
                                                                    }`}>
                                                                    {detail.stock} وحدة
                                                                </span>
                                                                <div className={`w-2 h-2 rounded-full ${detail.stock === 0 ? 'bg-rose-500' :
                                                                    detail.stock < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                                                    }`} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                                                <div>
                                                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">
                                                        تنبيه المخزون
                                                    </h4>
                                                    <p className="text-sm text-amber-700 dark:text-amber-400/80">
                                                        {product.stock < (product.minStock || 5)
                                                            ? 'الكمية الحالية أقل من الحد الأدنى المسموح به. يُنصح بإعادة الطلب.'
                                                            : 'المخزون في حالة جيدة.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'seo' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">معلومات SEO</h3>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">العنوان (Title)</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {product.seoTitle || product.name}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">الوصف (Meta Description)</p>
                                                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                                                        {product.seoDescription || product.desc || 'لا يوجد وصف'}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">الرابط المخصص (Slug)</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                                                            {product.slug || product.id}
                                                        </p>
                                                        <button
                                                            onClick={() => copyToClipboard(`${window.location.origin}/store/${product.store?.subdomain}/products/${product.slug || product.id}`)}
                                                            className="text-indigo-600 hover:text-indigo-700"
                                                        >
                                                            <Copy size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Store Info */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Store size={16} className="text-indigo-600" />
                                معلومات المتجر
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                        {product.store?.name?.charAt(0) || 'S'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {product.store?.name || 'متجري'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                                        {product.store?.subdomain || 'store'}.example.com
                                    </p>
                                </div>
                                <Link
                                    to={`/store/${product.store?.subdomain}`}
                                    target="_blank"
                                    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                >
                                    زيارة
                                    <ExternalLink size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductShow;