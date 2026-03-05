import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Store, Edit, Trash2, Globe, MapPin, Phone, Mail,
  Package, ShoppingBag, Users, TrendingUp, DollarSign, Calendar,
  CheckCircle, XCircle, AlertCircle, ChevronRight, ChevronLeft,
  Copy, Check, BarChart3, Settings, QrCode, Share2, Download, Loader2
} from 'lucide-react';

const Show = () => {
const { t , i18n} = useTranslation('translation', { keyPrefix: 'stores' });  
  const navigate = useNavigate();
  const { id } = useParams();
  const isRtl = i18n.language === 'ar';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRtl ? ChevronLeft : ChevronRight;

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => { fetchStoreData(); }, [id]);

  const fetchStoreData = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStore({
        id,
        name: 'متجر إيفرلين',
        domain: 'everlane-clone',
        location: 'Algiers',
        phone: '0555123456',
        email: 'contact@everlane.dz',
        address: '123 شارع الحرية، الجزائر العاصمة',
        description: 'متجر إلكتروني متخصص في الأزياء العصرية والمستدامة',
        logo: null,
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        niche: 'fashion',
        status: 'active',
        createdAt: '2024-01-15',
        stats: { totalOrders: 156, totalRevenue: 2450000, totalProducts: 48, totalCustomers: 89 },
        recentOrders: [
          { id: 'ORD-001', customer: 'أحمد محمد', amount: 15000, status: 'completed', date: '2024-02-05' },
          { id: 'ORD-002', customer: 'فاطمة علي', amount: 8500, status: 'pending', date: '2024-02-04' },
          { id: 'ORD-003', customer: 'كريم بن علي', amount: 22000, status: 'processing', date: '2024-02-03' },
        ],
        settings: { currency: 'DZD', language: 'ar', cashOnDelivery: true, onlinePayment: false },
      });
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://${store.domain}.mdstore.dz`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/dashboard/stores');
    } catch (error) {
      console.error('Error deleting store:', error);
    }
  };

  const statusStyles = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
    suspended: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  };
  const statusIcons = {
    active: <CheckCircle size={14} />,
    inactive: <XCircle size={14} />,
    suspended: <AlertCircle size={14} />,
  };
  const orderStatusStyles = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  };

  const cardClass = 'bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800';

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
          <p className="text-gray-500 font-medium">{t('show.loading')}</p>
        </div>
      </div>
    );
  }

  // ─── Not Found ────────────────────────────────────────────────────────────────
  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Store size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('show.not_found.title')}</h2>
          <p className="text-gray-500 dark:text-zinc-400 mb-6">{t('show.not_found.subtitle')}</p>
          <button
            onClick={() => navigate('/dashboard/stores')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            {t('show.not_found.back')}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: t('show.tabs.overview'), icon: BarChart3 },
    { id: 'orders', label: t('show.tabs.orders'), icon: ShoppingBag },
    { id: 'products', label: t('show.tabs.products'), icon: Package },
    { id: 'settings', label: t('show.tabs.settings'), icon: Settings },
  ];

  const statCards = [
    { icon: ShoppingBag, color: 'indigo', label: t('show.stats.orders'), val: store.stats.totalOrders },
    { icon: DollarSign, color: 'emerald', label: t('show.stats.revenue'), val: `${store.stats.totalRevenue.toLocaleString()} ${t('common.currency')}` },
    { icon: Package, color: 'amber', label: t('show.stats.products'), val: store.stats.totalProducts },
    { icon: Users, color: 'rose', label: t('show.stats.customers'), val: store.stats.totalCustomers },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Delete Modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${cardClass} p-8 max-w-md w-full shadow-2xl`}>
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-center mb-2 text-gray-900 dark:text-white">
              {t('show.delete_modal.title')}
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 text-center mb-6">
              {t('show.delete_modal.subtitle')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                className="flex-1 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {t('show.delete_modal.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
              >
                {t('show.delete_modal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className={`${cardClass} p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/stores')}
              className="p-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <BackIcon size={20} className="text-gray-600 dark:text-zinc-300" />
            </button>

            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: store.primaryColor }}
              >
                <Store size={28} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">{store.name}</h1>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusStyles[store.status]}`}>
                    {statusIcons[store.status]}
                    {t(`show.status.${store.status}`)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Globe size={14} className="text-gray-400" />
                  <a
                    href={`https://${store.domain}.mdstore.dz`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {store.domain}.mdstore.dz
                  </a>
                  <button
                    onClick={handleCopyUrl}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                    title={t('show.copy_url')}
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/dashboard/stores/update/${id}`)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Edit size={16} />
              {t('common.edit')}
            </button>
            <button
              onClick={() => setDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
            >
              <Trash2 size={16} />
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, color, label, val }) => (
          <div key={label} className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 bg-${color}-100 dark:bg-${color}-500/20 rounded-xl`}>
                <Icon size={18} className={`text-${color}-600 dark:text-${color}-400`} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{val}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
          {tabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tabId
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5'
                  : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Recent Orders */}
              <div className={`${cardClass} overflow-hidden`}>
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="font-black text-lg text-gray-900 dark:text-white">
                    {t('show.recent_orders.title')}
                  </h3>
                  <Link
                    to={`/dashboard/stores/${id}/orders`}
                    className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    {t('show.recent_orders.view_all')}
                    <ForwardIcon size={16} />
                  </Link>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {store.recentOrders.map((order) => (
                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center font-mono text-xs font-bold text-gray-500">
                          {order.id}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{order.customer}</p>
                          <p className="text-xs text-gray-400">{order.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {order.amount.toLocaleString()} {t('common.currency')}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${orderStatusStyles[order.status]}`}>
                          {t(`show.order_status.${order.status}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Chart Placeholder */}
              <div className={`${cardClass} p-6`}>
                <h3 className="font-black text-lg mb-6 text-gray-900 dark:text-white">
                  {t('show.performance.title')}
                </h3>
                <div className="h-64 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/5 dark:to-purple-500/5 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp size={48} className="text-indigo-300 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">{t('show.performance.coming_soon')}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className={`${cardClass} p-12 text-center`}>
              <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="font-black text-lg mb-2 text-gray-900 dark:text-white">{t('show.orders_tab.full_list')}</h3>
              <p className="text-gray-500 dark:text-zinc-400">{t('show.orders_tab.redirect')}</p>
            </div>
          )}

          {activeTab === 'products' && (
            <div className={`${cardClass} p-12 text-center`}>
              <Package size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="font-black text-lg mb-2 text-gray-900 dark:text-white">{t('show.products_tab.manage')}</h3>
              <p className="text-gray-500 dark:text-zinc-400">{t('show.products_tab.redirect')}</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={`${cardClass} p-6 space-y-6`}>
              <h3 className="font-black text-lg text-gray-900 dark:text-white">{t('show.settings_tab.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'currency', val: store.settings.currency },
                  { key: 'language', val: store.settings.language },
                  { key: 'cash_on_delivery', val: store.settings.cashOnDelivery ? t('common.yes') : t('common.no') },
                  { key: 'online_payment', val: store.settings.onlinePayment ? t('common.yes') : t('common.no') },
                ].map(({ key, val }) => (
                  <div key={key} className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                      {t(`show.settings_tab.${key}`)}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Store Info */}
          <div className={`${cardClass} p-6`}>
            <h3 className="font-black text-lg mb-4 text-gray-900 dark:text-white">
              {t('show.sidebar.info.title')}
            </h3>
            <div className="space-y-4">
              {[
                { icon: MapPin, key: 'location', val: store.location },
                { icon: Phone, key: 'phone', val: store.phone, ltr: true },
                { icon: Mail, key: 'email', val: store.email, ltr: true },
                { icon: Calendar, key: 'created', val: store.createdAt },
              ].map(({ icon: Icon, key, val, ltr }) => (
                <div key={key} className="flex items-start gap-3">
                  <Icon size={18} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">{t(`show.sidebar.info.${key}`)}</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm" dir={ltr ? 'ltr' : undefined}>
                      {val}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`${cardClass} p-6`}>
            <h3 className="font-black text-lg mb-4 text-gray-900 dark:text-white">
              {t('show.sidebar.actions.title')}
            </h3>
            <div className="space-y-2">
              {[
                { icon: QrCode, key: 'qr_code' },
                { icon: Share2, key: 'share' },
                { icon: Download, key: 'export' },
              ].map(({ icon: Icon, key }) => (
                <button
                  key={key}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Icon size={18} className="text-indigo-600 shrink-0" />
                  <span className="font-bold text-sm text-gray-700 dark:text-zinc-300">
                    {t(`show.sidebar.actions.${key}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className={`${cardClass} p-6`}>
            <h3 className="font-black text-lg mb-3 text-gray-900 dark:text-white">
              {t('show.sidebar.description')}
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 text-sm leading-relaxed">{store.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Show;