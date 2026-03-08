import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ShoppingBag, TrendingUp, Package, XCircle,
  Truck, RotateCcw, Clock, CheckCircle2,
  ArrowLeft, RefreshCcw, Loader2, MapPin,
  ChevronUp, ChevronDown, AlertCircle, Star
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../../../services/access-token';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const STATUS_META = {
  pending:   { color: '#f59e0b', bg: 'bg-amber-50   dark:bg-amber-900/20',   text: 'text-amber-600  dark:text-amber-400',   icon: Clock        },
  appl1:     { color: '#6366f1', bg: 'bg-indigo-50  dark:bg-indigo-900/20',  text: 'text-indigo-600 dark:text-indigo-400',  icon: AlertCircle  },
  appl2:     { color: '#8b5cf6', bg: 'bg-violet-50  dark:bg-violet-900/20',  text: 'text-violet-600 dark:text-violet-400',  icon: AlertCircle  },
  appl3:     { color: '#a855f7', bg: 'bg-purple-50  dark:bg-purple-900/20',  text: 'text-purple-600 dark:text-purple-400',  icon: AlertCircle  },
  confirmed: { color: '#3b82f6', bg: 'bg-blue-50    dark:bg-blue-900/20',    text: 'text-blue-600   dark:text-blue-400',    icon: CheckCircle2 },
  shipping:  { color: '#06b6d4', bg: 'bg-cyan-50    dark:bg-cyan-900/20',    text: 'text-cyan-600   dark:text-cyan-400',    icon: Truck        },
  delivered: { color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  cancelled: { color: '#ef4444', bg: 'bg-red-50     dark:bg-red-900/20',     text: 'text-red-600    dark:text-red-400',     icon: XCircle      },
  returned:  { color: '#f97316', bg: 'bg-orange-50  dark:bg-orange-900/20',  text: 'text-orange-600 dark:text-orange-400',  icon: RotateCcw    },
  postponed: { color: '#64748b', bg: 'bg-slate-50   dark:bg-slate-900/20',   text: 'text-slate-600  dark:text-slate-400',   icon: Clock        },
};

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const DAYS_AR   = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function useAuthHeaders() {
  const token = getAccessToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}

function fmt(num) {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('ar-DZ');
}

function isToday(date) {
  const d = new Date(date), t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}
function isThisWeek(date) {
  const d = new Date(date), now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}
function isThisMonth(date) {
  const d = new Date(date), now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, trend, loading }) {
  const { t } = useTranslation('analytics');
  return (
    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-xl" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 truncate">{label}</p>
          {loading ? (
            <div className="h-7 w-24 bg-gray-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{value}</p>
          )}
          {sub && <p className="text-xs text-gray-400 dark:text-zinc-600">{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      {trend !== undefined && !loading && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend >= 0 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {t('stats.trend', { pct: Math.abs(trend) })}
        </div>
      )}
    </div>
  );
}

function StatusRow({ status, count, total }) {
  const { t } = useTranslation('analytics');
  const meta = STATUS_META[status] || { color: '#94a3b8', bg: 'bg-gray-50 dark:bg-zinc-800', text: 'text-gray-500', icon: Package };
  const Icon = meta.icon;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
        <Icon className={`w-4 h-4 ${meta.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
            {t(`status.${status}`, status)}
          </span>
          <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{count}</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: meta.color }} />
        </div>
      </div>
      <span className="text-xs font-bold text-gray-400 dark:text-zinc-600 w-9 text-left tabular-nums">{pct}%</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  const { t } = useTranslation('analytics');
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="font-bold text-gray-700 dark:text-zinc-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums font-black" style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString('ar-DZ')} {p.name === t('chart.revenue') ? 'DA' : ''}
        </p>
      ))}
    </div>
  );
}

function ProductRow({ rank, name, image, orders, revenue }) {
  const { t } = useTranslation('analytics');
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-zinc-800/60 last:border-0">
      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
        rank === 1 ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' :
        rank === 2 ? 'bg-gray-100 dark:bg-zinc-800 text-gray-500' :
        rank === 3 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' :
        'bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500'
      }`}>
        {rank <= 3 ? <Star className="w-3 h-3" /> : rank}
      </span>
      {image ? (
        <img src={image} alt={name} className="w-9 h-9 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-zinc-800" />
      ) : (
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-indigo-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200 truncate">{name}</p>
        <p className="text-xs text-gray-400 dark:text-zinc-600">
          {t('products.orders_count', { count: orders })}
        </p>
      </div>
      <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums shrink-0">
        {fmt(revenue)} DA
      </span>
    </div>
  );
}

function WilayaRow({ name, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-600 shrink-0" />
      <span className="text-sm text-gray-600 dark:text-zinc-400 flex-1 truncate">{name}</span>
      <div className="w-24 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-800 dark:text-zinc-200 tabular-nums w-8 text-left">{count}</span>
    </div>
  );
}

// Skeleton loader strip
const Skeleton = ({ rows = 5, h = 'h-10' }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className={`${h} bg-gray-50 dark:bg-zinc-800/50 rounded-xl animate-pulse`} />
    ))}
  </div>
);

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function Analytics() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'analytics' });
  const isRtl = i18n.dir() === 'rtl';
  const navigate  = useNavigate();
  const storeId   = localStorage.getItem('storeId');
  const headers   = useAuthHeaders();

  const [orders,       setOrders]       = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [range,        setRange]        = useState('month');
  const [error,        setError]        = useState(null);

  /* ── Fetch ── */
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const [ordersRes, statusRes] = await Promise.all([
        axios.get(`${baseURL}/orders/${storeId}`, headers),
        axios.get(`${baseURL}/orders/get-count-status/${storeId}`, headers),
      ]);
      setOrders(ordersRes.data || []);
      setStatusCounts(statusRes.data || []);
    } catch (err) {
      console.error(err);
      setError(t('error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  /* ── Computed ── */
  const totalStatusCount = useMemo(
    () => statusCounts.reduce((s, r) => s + Number(r.count), 0),
    [statusCounts]
  );

  const stats = useMemo(() => {
    const delivered      = orders.filter(o => o.status === 'delivered');
    const todayOrders    = orders.filter(o => isToday(o.createdAt));
    const monthOrders    = orders.filter(o => isThisMonth(o.createdAt));
    const grossRevenue   = delivered.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const returnedLossAll= orders.filter(o => o.status === 'returned').reduce((s, o) => s + Number(o.priceLoss || 0), 0);
    const revenue        = grossRevenue - returnedLossAll;
    const todayRevenue   = delivered.filter(o => isToday(o.createdAt)).reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const monthRevenue   = delivered.filter(o => isThisMonth(o.createdAt)).reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const cancelledCount = statusCounts.find(s => s.status === 'cancelled')?.count || 0;
    const deliveredCount = statusCounts.find(s => s.status === 'delivered')?.count || 0;
    const shippingCount  = statusCounts.find(s => s.status === 'shipping')?.count  || 0;
    const returnedOrders     = orders.filter(o => o.status === 'returned');
    const returnedCount      = returnedOrders.length;
    const returnedLoss       = returnedOrders.reduce((s, o) => s + Number(o.priceLoss || 0), 0);
    const returnedLossMonth  = returnedOrders.filter(o => isThisMonth(o.createdAt)).reduce((s, o) => s + Number(o.priceLoss || 0), 0);
    return {
      revenue, todayRevenue, monthRevenue, totalStatusCount,
      todayOrders: todayOrders.length, monthOrders: monthOrders.length,
      cancelledCount, deliveredCount, shippingCount,
      returnedCount, returnedLoss, returnedLossMonth,
    };
  }, [orders, statusCounts]);

  const chartData = useMemo(() => {
    const now = new Date();
    if (range === 'year') {
      const map = {};
      MONTHS_AR.forEach((m, i) => { map[i] = { name: m, orders: 0, revenue: 0 }; });
      orders.forEach(o => {
        const d = new Date(o.createdAt);
        if (d.getFullYear() === now.getFullYear()) {
          const m = d.getMonth();
          map[m].orders++;
          if (o.status === 'delivered') map[m].revenue += Number(o.totalPrice || 0);
        }
      });
      return Object.values(map);
    }
    const days = range === 'week' ? 7 : 30;
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key   = d.toISOString().split('T')[0];
      const label = range === 'week' ? DAYS_AR[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`;
      map[key] = { name: label, orders: 0, revenue: 0 };
    }
    orders.forEach(o => {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (map[key]) {
        map[key].orders++;
        if (o.status === 'delivered') map[key].revenue += Number(o.totalPrice || 0);
      }
    });
    return Object.values(map);
  }, [orders, range]);

  const topProducts = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const id = o.productId;
      if (!map[id]) map[id] = {
        id,
        name:   o.product?.name || t('products.unknown'),
        image:  o.product?.productImage || o.product?.imagesProduct?.[0]?.url,
        orders: 0, revenue: 0,
      };
      map[id].orders++;
      if (o.status === 'delivered') map[id].revenue += Number(o.totalPrice || 0);
    });
    return Object.values(map).sort((a, b) => b.orders - a.orders).slice(0, 5);
  }, [orders]);

  const topReturnedWilayas = useMemo(() => {
    const map = {};
    orders.filter(o => o.status === 'returned').forEach(o => {
      const name = o.customerWilaya?.ar_name || o.customerWilaya?.name || t('wilayas.wilaya_prefix', { id: o.customerWilayaId });
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));
  }, [orders]);

  const returnedWilayaTotal = topReturnedWilayas.reduce((s, w) => s + w.count, 0);

  const returnedPhones = useMemo(() => {
    return orders
      .filter(o => o.status === 'returned')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(o => ({
        phone:  o.customerPhone,
        name:   o.customerName,
        wilaya: o.customerWilaya?.ar_name || o.customerWilaya?.name || t('wilayas.wilaya_prefix', { id: o.customerWilayaId }),
        loss:   Number(o.priceLoss || 0),
        date:   new Date(o.createdAt).toLocaleDateString('ar-DZ'),
      }));
  }, [orders]);

  const topWilayas = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const name = o.customerWilaya?.ar_name || o.customerWilaya?.name || t('wilayas.wilaya_prefix', { id: o.customerWilayaId });
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));
  }, [orders]);

  const wilayaTotal = topWilayas.reduce((s, w) => s + w.count, 0);

  const deliveryTypeData = useMemo(() => [
    { name: t('chart.home'),   value: orders.filter(o => o.typeShip === 'home').length,   color: '#6366f1' },
    { name: t('chart.office'), value: orders.filter(o => o.typeShip === 'office').length, color: '#10b981' },
  ], [orders]);

  /* ── Section title ── */
  const SectionTitle = ({ children, sub }) => (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-200">{children}</h2>
      {sub && <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );

  // ── Render ──────────────────────────────────
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all"
          >
            <ArrowLeft className={`w-5 h-5 text-gray-600 dark:text-zinc-400 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all disabled:opacity-60"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl text-sm text-red-600 dark:text-red-400 font-medium">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={ShoppingBag}
          label={t('stats.total_orders')}
          value={fmt(stats.totalStatusCount)}
          sub={t('stats.today_orders', { count: stats.todayOrders })}
          color="#6366f1"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label={t('stats.revenue')}
          value={`${fmt(stats.revenue)} DA`}
          sub={t('stats.month_revenue', { amount: fmt(stats.monthRevenue) })}
          color="#10b981"
          loading={loading}
        />
        <StatCard
          icon={Truck}
          label={t('stats.shipping')}
          value={fmt(stats.shippingCount)}
          sub={t('stats.shipping_sub')}
          color="#06b6d4"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle2}
          label={t('stats.delivered')}
          value={fmt(stats.deliveredCount)}
          sub={t('stats.today_revenue', { amount: fmt(stats.todayRevenue) })}
          color="#10b981"
          loading={loading}
        />
      </div>

      {/* ── Returned loss card ── */}
      <div className="mb-6">
        <StatCard
          icon={RotateCcw}
          label={t('stats.returned_loss')}
          value={`${fmt(stats.returnedLoss)} DA`}
          sub={t('stats.returned_sub', { count: stats.returnedCount, amount: fmt(stats.returnedLossMonth) })}
          color="#f97316"
          loading={loading}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Area chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-200">
              {t('chart.orders_revenue')}
            </h2>
            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
              {(['week', 'month', 'year']).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    range === r
                      ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {t(`range.${r}`)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-56 bg-gray-50 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{v}</span>} />
                <Area type="monotone" dataKey="orders"  name={t('chart.orders')}  stroke="#6366f1" strokeWidth={2} fill="url(#ordersGrad)"  dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="revenue" name={t('chart.revenue')} stroke="#10b981" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie – delivery type */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <SectionTitle>{t('chart.delivery_type')}</SectionTitle>
          {loading ? (
            <div className="h-56 bg-gray-50 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={deliveryTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {deliveryTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} طلب`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-5 mt-2">
                {deliveryTypeData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400">{d.name}</span>
                    <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Status breakdown */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <SectionTitle sub={t('status.total', { count: fmt(totalStatusCount) })}>
            {t('status.title')}
          </SectionTitle>
          {loading ? <Skeleton rows={5} /> : statusCounts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-10">{t('no_data')}</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-zinc-800/60">
              {statusCounts.sort((a, b) => Number(b.count) - Number(a.count)).map(row => (
                <StatusRow key={row.status} status={row.status} count={Number(row.count)} total={totalStatusCount} />
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <SectionTitle>{t('products.title')}</SectionTitle>
          {loading ? <Skeleton rows={4} h="h-12" /> : topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-10">{t('no_data')}</p>
          ) : topProducts.map((p, i) => (
            <ProductRow key={p.id} rank={i + 1} name={p.name} image={p.image} orders={p.orders} revenue={p.revenue} />
          ))}
        </div>

        {/* Top wilayas */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <SectionTitle sub={t('wilayas.subtitle')}>{t('wilayas.title')}</SectionTitle>
          {loading ? <Skeleton rows={6} h="h-8" /> : topWilayas.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-10">{t('no_data')}</p>
          ) : (
            <div className="space-y-1">
              {topWilayas.map(w => <WilayaRow key={w.name} name={w.name} count={w.count} total={wilayaTotal} />)}
            </div>
          )}
          {!loading && topWilayas.length > 0 && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={topWilayas} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`${v} طلب`, t('wilayas.orders_label')]} />
                  <Bar dataKey="count" name={t('wilayas.orders_label')} radius={[4, 4, 0, 0]}>
                    {topWilayas.map((_, i) => (
                      <Cell key={i} fill={`hsl(${240 - i * 18}, 70%, ${55 + i * 4}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Returned Analysis Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

        {/* Returned wilayas */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-200">{t('returned_wilayas.title')}</h2>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-600 mb-4">
            {t('returned_wilayas.total', { count: returnedWilayaTotal })}
          </p>
          {loading ? <Skeleton rows={5} h="h-8" /> : topReturnedWilayas.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-10">{t('no_returns')}</p>
          ) : (
            <div className="space-y-1">
              {topReturnedWilayas.map(w => (
                <div key={w.name} className="flex items-center gap-3 py-2">
                  <RotateCcw className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-zinc-400 flex-1 truncate">{w.name}</span>
                  <div className="w-24 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-400 transition-all duration-700"
                      style={{ width: `${returnedWilayaTotal > 0 ? Math.round((w.count / returnedWilayaTotal) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-800 dark:text-zinc-200 tabular-nums w-8 text-left">{w.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Returned phones */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-200">{t('returned_phones.title')}</h2>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-600 mb-4">
            {t('returned_phones.total', { count: returnedPhones.length })}
          </p>
          {loading ? <Skeleton rows={5} h="h-12" /> : returnedPhones.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-10">{t('no_returns')}</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {returnedPhones.map((r, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-zinc-800/60 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{r.wilaya} · {r.date}</p>
                  </div>
                  <div className={`shrink-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p dir="ltr" className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{r.phone}</p>
                    <p className="text-xs text-orange-500 font-semibold tabular-nums">{fmt(r.loss)} DA</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <p className="text-center text-xs text-gray-400 dark:text-zinc-700 mt-6">
        {t('last_updated', { time: new Date().toLocaleString('ar-DZ') })}
      </p>
    </div>
  );
}