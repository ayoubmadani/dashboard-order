import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Store, Plus, Search, MapPin, 
  ExternalLink, Settings, 
  CircleDot, Globe, LayoutGrid, X,
  TrendingUp, DollarSign, Users, Package,
  MoreHorizontal, Edit2, Trash2, Eye,
  ChevronDown, Filter, Download, RefreshCw,
  Loader2, AlertCircle, Power
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const Stores = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState('grid');
  const [myStores, setMyStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingStoreId, setDeletingStoreId] = useState(null);
  const [togglingStoreId, setTogglingStoreId] = useState(null); // 🆕 لحالة تحميل التفعيل

  // Fetch stores on mount
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAccessToken();
      const response = await axios.get(`${baseURL}/stores/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setMyStores(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('فشل تحميل المتاجر');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 دالة تفعيل/تعطيل المتجر
  const handleToggleStoreStatus = useCallback(async (storeId, currentStatus) => {
    try {
      setTogglingStoreId(storeId);
      const token = getAccessToken();
      console.log(token);
      
      const response = await axios.put(
        `${baseURL}/stores/${storeId}/toggle-status`,{},
        {
          headers: {
            "Authorization": `bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // تحديث الحالة محلياً بدون إعادة تحميل
        setMyStores(prev => prev.map(store => 
          store.id === storeId 
            ? { ...store, isActive: !currentStatus }
            : store
        ));
      }
    } catch (err) {
      console.error('Error toggling store status:', err);
      alert(err.response?.data?.message || 'فشل تغيير حالة المتجر');
    } finally {
      setTogglingStoreId(null);
    }
  }, []);

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المتجر؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      setDeletingStoreId(storeId);
      const token = getAccessToken();
      
      await axios.delete(`${baseURL}/stores/${storeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMyStores(myStores.filter(store => store.id !== storeId));
      alert('تم حذف المتجر بنجاح');
    } catch (err) {
      console.error('Error deleting store:', err);
      alert('فشل حذف المتجر');
    } finally {
      setDeletingStoreId(null);
    }
  };

  const filteredStores = myStores.filter(store => 
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.contact?.wilaya?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // 🆕 إعدادات الحالة المحسّنة
  const statusConfig = {
    true: {
      label: 'نشط',
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-500/20',
      icon: Power
    },
    false: {
      label: 'معطل',
      color: 'bg-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-500/10',
      textColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-500/20',
      icon: Power
    }
  };

  // 🆕 مكون Toggle Switch
  const ToggleSwitch = ({ isActive, onToggle, disabled }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900
        ${isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
      `}
      aria-label={isActive ? 'تعطيل المتجر' : 'تفعيل المتجر'}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300
          ${isActive ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  const totalProducts = myStores.reduce((acc, s) => acc + (s.products?.length || 0), 0);
  const totalOrders = myStores.reduce((acc, s) => acc + (s.orders?.length || 0), 0);
  const totalRevenue = myStores.reduce((acc, s) => acc + (s.revenue || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600 dark:text-zinc-400">جاري تحميل المتاجر...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-rose-500" />
          <p className="text-gray-900 dark:text-white font-bold mb-2">{error}</p>
          <button
            onClick={fetchStores}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 pb-20">
      {/* Header Section */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          
          {/* Title Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/20">
                <Store size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                  متاجري
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                  إدارة كافة متاجرك وفروعك من مكان واحد
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchStores}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw size={16} />
                تحديث
              </button>
              <Link 
                to={'/dashboard/stores/create'} 
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={20} />
                متجر جديد
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-500/10 dark:to-indigo-500/5 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Store size={16} className="text-white" />
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">المتاجر</span>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">{myStores.length}</p>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">
                {myStores.filter(s => s.isActive).length} نشط
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Package size={16} className="text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">المنتجات</span>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">{totalProducts}</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">في كل المتاجر</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 p-5 rounded-2xl border border-amber-100 dark:border-amber-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">الطلبات</span>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">{totalOrders}</p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">إجمالي الطلبات</p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-500/10 dark:to-rose-500/5 p-5 rounded-2xl border border-rose-100 dark:border-rose-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-rose-500 rounded-lg">
                  <Users size={16} className="text-white" />
                </div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">العملاء</span>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                {myStores.reduce((acc, s) => acc + (s.customers?.length || 0), 0)}
              </p>
              <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1">عميل نشط</p>
            </div>
          </div>

          {/* Search & View Toggle */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ابحث عن متجر، دومين، أو موقع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Grid View */}
        {viewMode === 'grid' && filteredStores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => {
              const status = statusConfig[store.isActive];
              const StatusIcon = status.icon;
              const isToggling = togglingStoreId === store.id;
              
              return (
                <div
                  key={store.id}
                  className={`group bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden transition-all duration-300 ${
                    store.isActive 
                      ? 'border-gray-200 dark:border-zinc-800 hover:shadow-xl hover:border-amber-300 dark:hover:border-amber-500/30' 
                      : 'border-gray-200 dark:border-zinc-800 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${status.bgColor}`}>
                        <Store className={status.textColor} size={24} />
                      </div>
                      
                      {/* 🆕 زر التفعيل في الهيدر */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${status.textColor}`}>
                          {status.label}
                        </span>
                        <ToggleSwitch 
                          isActive={store.isActive}
                          onToggle={() => handleToggleStoreStatus(store.id, store.isActive)}
                          disabled={isToggling}
                        />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1">
                      {store.name}
                    </h3>
                    
                    <a
                      href={`http://localhost:3000/${store.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm hover:underline group-hover:gap-3 transition-all ${
                        store.isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                      }`}
                    >
                      <Globe size={14} />
                      <span className="line-clamp-1">{store.subdomain}.mdstore.dz</span>
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    
                    {store.contact?.wilaya && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 text-sm mt-2">
                        <MapPin size={14} className="text-amber-500" />
                        {store.contact.wilaya}
                      </div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-zinc-800 border-b border-gray-100 dark:border-zinc-800">
                    <div className="p-4 text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {store.orders?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">طلب</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {store.products?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">منتج</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {store.customers?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">عميل</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex gap-2">
                    <a
                      href={`http://localhost:3000/${store.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                        store.isActive
                          ? 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                          : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={(e) => !store.isActive && e.preventDefault()}
                    >
                      <Eye size={16} />
                      زيارة
                    </a>
                    <button
                      onClick={() => navigate(`/dashboard/stores/update/${store.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors"
                    >
                      <Edit2 size={16} />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteStore(store.id)}
                      disabled={deletingStoreId === store.id}
                      className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                    >
                      {deletingStoreId === store.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add New Card */}
            <Link 
              to={'/dashboard/stores/create'}
              className="group border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-gray-400 dark:text-zinc-600 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-all min-h-[380px]"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center group-hover:border-solid group-hover:bg-amber-500 group-hover:text-white group-hover:border-transparent transition-all duration-500 group-hover:rotate-90 group-hover:scale-110">
                  <Plus size={32} />
                </div>
                <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-amber-600 transition-colors">إنشاء متجر جديد</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">ابدأ رحلتك التجارية</p>
              </div>
            </Link>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && filteredStores.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">المتجر</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">الموقع</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">المنتجات</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">الطلبات</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredStores.map((store) => {
                  const status = statusConfig[store.isActive];
                  const isToggling = togglingStoreId === store.id;
                  
                  return (
                    <tr key={store.id} className={`hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${!store.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.bgColor}`}>
                            <Store className={status.textColor} size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{store.name}</p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">{store.subdomain}.mdstore.dz</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* 🆕 عمود الحالة مع Toggle */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <ToggleSwitch 
                            isActive={store.isActive}
                            onToggle={() => handleToggleStoreStatus(store.id, store.isActive)}
                            disabled={isToggling}
                          />
                          <span className={`text-xs font-medium ${status.textColor}`}>
                            {isToggling ? 'جاري...' : status.label}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                          <MapPin size={14} className="text-amber-500" />
                          {store.contact?.wilaya || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {store.products?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {store.orders?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <a
                            href={`http://localhost:3000/${store.subdomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-lg transition-colors ${
                              store.isActive 
                                ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10' 
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            onClick={(e) => !store.isActive && e.preventDefault()}
                          >
                            <Eye size={16} />
                          </a>
                          <button
                            onClick={() => navigate(`/dashboard/stores/update/${store.id}`)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteStore(store.id)}
                            disabled={deletingStoreId === store.id}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingStoreId === store.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {filteredStores.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد متاجر'}
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 mb-6">
              {searchQuery 
                ? 'لم يتم العثور على متاجر مطابقة لبحثك'
                : 'ابدأ بإنشاء متجرك الأول'
              }
            </p>
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery("")}
                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                مسح البحث
              </button>
            ) : (
              <Link
                to="/dashboard/stores/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
              >
                <Plus size={20} />
                إنشاء متجر جديد
              </Link>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Stores;