import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ShoppingBag, TrendingUp, Truck, CheckCircle2,
  RotateCcw, XCircle, Clock, AlertCircle, Package,
  ChevronRight, RefreshCcw, ArrowUpRight, Settings,
  BarChart2, Layers, Plus, AlertTriangle, Store
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const STATUS_META = {
  pending:   { color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600 dark:text-amber-400',      border: 'border-amber-200 dark:border-amber-500/30',     icon: Clock        },
  appl1:     { color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20',   text: 'text-indigo-600 dark:text-indigo-400',    border: 'border-indigo-200 dark:border-indigo-500/30',   icon: AlertCircle  },
  appl2:     { color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/20',   text: 'text-violet-600 dark:text-violet-400',    border: 'border-violet-200 dark:border-violet-500/30',   icon: AlertCircle  },
  appl3:     { color: '#a855f7', bg: 'bg-purple-50 dark:bg-purple-900/20',   text: 'text-purple-600 dark:text-purple-400',    border: 'border-purple-200 dark:border-purple-500/30',   icon: AlertCircle  },
  confirmed: { color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-600 dark:text-blue-400',        border: 'border-blue-200 dark:border-blue-500/30',       icon: CheckCircle2 },
  shipping:  { color: '#06b6d4', bg: 'bg-cyan-50 dark:bg-cyan-900/20',       text: 'text-cyan-600 dark:text-cyan-400',        border: 'border-cyan-200 dark:border-cyan-500/30',       icon: Truck        },
  delivered: { color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400',  border: 'border-emerald-200 dark:border-emerald-500/30', icon: CheckCircle2 },
  cancelled: { color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-600 dark:text-red-400',          border: 'border-red-200 dark:border-red-500/30',         icon: XCircle      },
  returned:  { color: '#f97316', bg: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-600 dark:text-orange-400',    border: 'border-orange-200 dark:border-orange-500/30',   icon: RotateCcw    },
  postponed: { color: '#64748b', bg: 'bg-slate-50 dark:bg-slate-900/20',     text: 'text-slate-600 dark:text-slate-400',      border: 'border-slate-200 dark:border-slate-500/30',     icon: Clock        },
};

const DAYS_AR = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];

const STORE_COLORS = ['#6366f1','#10b981','#f59e0b','#06b6d4','#f97316','#8b5cf6','#3b82f6','#ec4899'];

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function useAuthHeaders() {
  const token = getAccessToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}

function fmt(num) {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString('ar-DZ');
}

function isToday(date) {
  const d = new Date(date), n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
function isThisMonth(date) {
  const d = new Date(date), n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
function isThisWeek(date) {
  const d = new Date(date), now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return d >= start;
}

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-xl ${className}`} />
);

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, loading, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.07] blur-2xl pointer-events-none" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      {loading ? (
        <Skeleton className="h-7 w-28 mt-1" />
      ) : (
        <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{value}</p>
      )}
      {loading
        ? <Skeleton className="h-3 w-24 mt-2" />
        : sub && <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-1">{sub}</p>
      }
    </div>
  );
}

function StatusBadge({ status }) {
  const { t } = useTranslation('dashboard');
  const meta = STATUS_META[status] || { bg: 'bg-gray-50 dark:bg-zinc-800', text: 'text-gray-500', border: 'border-gray-200 dark:border-zinc-700', icon: Package };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black border ${meta.bg} ${meta.text} ${meta.border}`}>
      <Icon className="w-2.5 h-2.5" />
      {t(`status.${status}`, status)}
    </span>
  );
}

function MiniStatusBar({ status, count, total }) {
  const { t } = useTranslation('dashboard');
  const meta = STATUS_META[status] || { color: '#94a3b8' };
  const pct  = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-xs text-gray-500 dark:text-zinc-400 w-16 shrink-0 truncate">{t(`status.${status}`, status)}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: meta.color }} />
      </div>
      <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 tabular-nums w-8 text-left shrink-0">{count}</span>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all group"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 text-center leading-tight">{label}</span>
    </button>
  );
}

// Per-store row in the breakdown table
function StoreBreakdownRow({ store, orders, statusCounts, color }) {
  const { t } = useTranslation('dashboard');
  const delivered  = orders.filter(o => o.status === 'delivered');
  const returned   = orders.filter(o => o.status === 'returned');
  const gross      = delivered.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
  const losses     = returned.reduce((s, o)  => s + Number(o.priceLoss  || 0), 0);
  const net        = gross - losses;
  const total      = statusCounts.reduce((s, r) => s + Number(r.count), 0);
  const dCount     = Number(statusCounts.find(r => r.status === 'delivered')?.count || 0);
  const rCount     = returned.length;

  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-50 dark:border-zinc-800/60 last:border-0">
      {/* Store color dot + name */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-sm font-bold text-gray-700 dark:text-zinc-200 truncate">{store.name}</span>
      </div>
      {/* Stats */}
      <div className="flex items-center gap-6 shrink-0">
        <div className="text-center">
          <p className="text-[10px] text-gray-400 dark:text-zinc-600">{t('store_orders')}</p>
          <p className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{fmt(total)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400 dark:text-zinc-600">{t('store_delivered')}</p>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{fmt(dCount)}</p>
        </div>
        <div className="text-center hidden sm:block">
          <p className="text-[10px] text-gray-400 dark:text-zinc-600">{t('store_returned')}</p>
          <p className="text-sm font-black text-orange-500 tabular-nums">{fmt(rCount)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400 dark:text-zinc-600">{t('store_revenue')}</p>
          <p className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{fmt(net)} DA</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function Dashboard() {
    const { t, i18n } = useTranslation('translation', { keyPrefix: 'dashboard' });
  const isRtl    = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const headers  = useAuthHeaders();

  // ✅ استخدام الـ stores من context بدل re-fetch
  const { myStores } = useOutletContext();
  const stores = myStores || [];

  // ── State ─────────────────────────────────
  const [storeData,    setStoreData]    = useState({});
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [period,       setPeriod]       = useState('today');

  // ✅ fetchData: فقط orders + statusCounts (بدون re-fetch stores)
  const fetchData = async (silent = false) => {
    if (stores.length === 0) { setLoading(false); return; }
    if (!silent) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const results = await Promise.all(
        stores.map(s =>
          Promise.all([
            axios.get(`${baseURL}/orders/${s.id}`, headers).then(r => r.data || []).catch(() => []),
            axios.get(`${baseURL}/orders/get-count-status/${s.id}`, headers).then(r => r.data || []).catch(() => []),
          ]).then(([orders, statusCounts]) => ({ storeId: s.id, orders, statusCounts }))
        )
      );

      const map = {};
      results.forEach(r => { map[r.storeId] = { orders: r.orders, statusCounts: r.statusCounts }; });
      setStoreData(map);
    } catch (err) {
      console.error(err);
      setError(t('error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [stores.length]);

  // ── Aggregate ALL orders across all stores ─
  const allOrders = useMemo(
    () => Object.values(storeData).flatMap(d => d.orders),
    [storeData]
  );

  const allStatusCounts = useMemo(() => {
    const map = {};
    Object.values(storeData).forEach(d => {
      d.statusCounts.forEach(r => {
        map[r.status] = (map[r.status] || 0) + Number(r.count);
      });
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [storeData]);

  // ── Period filter ─────────────────────────
  const periodOrders = useMemo(() => {
    if (period === 'today') return allOrders.filter(o => isToday(o.createdAt));
    if (period === 'week')  return allOrders.filter(o => isThisWeek(o.createdAt));
    return allOrders.filter(o => isThisMonth(o.createdAt));
  }, [allOrders, period]);

  // ── Aggregate stats ───────────────────────
  const stats = useMemo(() => {
    const delivered  = allOrders.filter(o => o.status === 'delivered');
    const returned   = allOrders.filter(o => o.status === 'returned');
    const gross      = delivered.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const losses     = returned.reduce((s, o)  => s + Number(o.priceLoss  || 0), 0);
    const net        = gross - losses;
    const monthNet   = delivered.filter(o => isThisMonth(o.createdAt)).reduce((s, o) => s + Number(o.totalPrice || 0), 0)
                     - returned.filter(o => isThisMonth(o.createdAt)).reduce((s, o)  => s + Number(o.priceLoss  || 0), 0);
    const todayRev   = delivered.filter(o => isToday(o.createdAt)).reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const todayCount = allOrders.filter(o => isToday(o.createdAt)).length;
    const total      = allStatusCounts.reduce((s, r) => s + Number(r.count), 0);
    const cnt        = (st) => Number(allStatusCounts.find(r => r.status === st)?.count || 0);
    return {
      net, monthNet, todayRev, todayCount, total,
      shipping:  cnt('shipping'),
      delivered: cnt('delivered'),
      cancelled: cnt('cancelled'),
      returned:  returned.length,
      losses,
    };
  }, [allOrders, allStatusCounts]);

  // ── Area chart — last 7 days (all stores) ─
  const chartData = useMemo(() => {
    const now = new Date();
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      map[key] = { name: DAYS_AR[d.getDay()], orders: 0, revenue: 0 };
    }
    allOrders.forEach(o => {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (map[key]) {
        map[key].orders++;
        if (o.status === 'delivered') map[key].revenue += Number(o.totalPrice || 0);
      }
    });
    return Object.values(map);
  }, [allOrders]);

  // ── Recent orders (last 10, all stores) ───
  const recentOrders = useMemo(() => {
    // Attach store name to each order
    const withStore = Object.entries(storeData).flatMap(([sid, d]) =>
      d.orders.map(o => ({ ...o, _storeName: stores.find(s => s.id === sid)?.name || sid }))
    );
    return withStore.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  }, [storeData, stores]);

  // ── Top products (all stores) ─────────────
  const topProducts = useMemo(() => {
    const map = {};
    allOrders.forEach(o => {
      const id = o.productId;
      if (!map[id]) map[id] = {
        id, name: o.product?.name || t('unknown_product'),
        image: o.product?.productImage || o.product?.imagesProduct?.[0]?.url,
        count: 0, revenue: 0,
      };
      map[id].count++;
      if (o.status === 'delivered') map[id].revenue += Number(o.totalPrice || 0);
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [allOrders]);

  // ── Status breakdown (sorted top 6) ───────
  const totalCount   = allStatusCounts.reduce((s, r) => s + Number(r.count), 0);
  const sortedStatus = [...allStatusCounts].sort((a, b) => Number(b.count) - Number(a.count)).slice(0, 6);

  const periodLabel  = { today: t('today'), week: t('this_week'), month: t('this_month') };

  // ─────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50/40 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 space-y-6 font-sans">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('welcome')}</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            {stores.length === 1
              ? t('summary_one')
              : t('summary_other', { count: stores.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period tabs */}
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-1 gap-1 shadow-sm">
            {['today', 'week', 'month'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  period === p
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow'
                    : 'text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                }`}
              >
                {periodLabel[p]}
              </button>
            ))}
          </div>
          {/* Stores badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm text-xs font-bold text-gray-500 dark:text-zinc-400">
            <Store className="w-3.5 h-3.5" />
            {t('stores_count', { count: stores.length })}
          </div>
          {/* Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCcw className={`w-4 h-4 text-gray-500 dark:text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl text-sm text-red-600 dark:text-red-400 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stat cards row 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}   label={t('stats.net_revenue')}  value={`${fmt(stats.net)} DA`}       sub={t('stats.net_revenue_sub', { amount: fmt(stats.monthNet) })}         color="#10b981" loading={loading} onClick={() => navigate('/dashboard/analytics')} />
        <StatCard icon={ShoppingBag}  label={t('stats.total_orders')} value={fmt(stats.total)}              sub={t('stats.total_orders_sub', { count: stats.todayCount })}            color="#6366f1" loading={loading} onClick={() => navigate('/dashboard/orders')} />
        <StatCard icon={Truck}        label={t('stats.shipping')}      value={fmt(stats.shipping)}           sub={t('stats.shipping_sub')}                                             color="#06b6d4" loading={loading} />
        <StatCard icon={CheckCircle2} label={t('stats.delivered')}    value={fmt(stats.delivered)}          sub={t('stats.delivered_sub', { amount: fmt(stats.todayRev) })}          color="#10b981" loading={loading} />
      </div>

      {/* ── Stat cards row 2 ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={XCircle}   label={t('stats.cancelled')}     value={fmt(stats.cancelled)}            color="#ef4444" loading={loading} />
        <StatCard icon={RotateCcw} label={t('stats.returned')}      value={fmt(stats.returned)}             sub={t('stats.returned_loss_sub', { count: stats.returned })} color="#f97316" loading={loading} />
        <StatCard icon={RotateCcw} label={t('stats.returned_loss')} value={`${fmt(stats.losses)} DA`}       color="#f97316" loading={loading} />
      </div>

      {/* ── Chart + Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Area chart — 7 days */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-black text-gray-800 dark:text-zinc-200">نشاط آخر 7 أيام</h2>
              <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5">{t('all_stores')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />الطلبات
              </span>
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />الإيراد
              </span>
            </div>
          </div>
          {loading ? <Skeleton className="h-52 w-full" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gOrders"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} labelStyle={{ fontWeight: 700, marginBottom: 4 }} />
                <Area type="monotone" dataKey="orders"  name="الطلبات" stroke="#6366f1" strokeWidth={2} fill="url(#gOrders)"  dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="revenue" name="الإيراد" stroke="#10b981" strokeWidth={2} fill="url(#gRevenue)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-black text-gray-800 dark:text-zinc-200">{t('status_breakdown')}</h2>
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5">{t('status_total', { count: fmt(totalCount) })}</p>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}</div>
          ) : sortedStatus.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-10">{t('no_orders')}</p>
          ) : (
            sortedStatus.map(r => (
              <MiniStatusBar key={r.status} status={r.status} count={Number(r.count)} total={totalCount} />
            ))
          )}
        </div>
      </div>

      {/* ── Per-store breakdown ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-black text-gray-800 dark:text-zinc-200">{t('store_breakdown')}</h2>
          </div>
          <button onClick={() => navigate('/dashboard/stores')} className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all">
            {t('view_all')} <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="px-6 py-2">
          {loading ? (
            <div className="space-y-4 py-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : stores.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-8">{t('no_stores')}</p>
          ) : (
            stores.map((store, i) => (
              <StoreBreakdownRow
                key={store.id}
                store={store}
                orders={storeData[store.id]?.orders || []}
                statusCounts={storeData[store.id]?.statusCounts || []}
                color={STORE_COLORS[i % STORE_COLORS.length]}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Recent orders + Top products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-black text-gray-800 dark:text-zinc-200">{t('recent_orders')}</h2>
            </div>
            <button onClick={() => navigate('/dashboard/orders')} className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all">
              {t('view_all')} <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-10 h-10 text-gray-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-zinc-600">{t('no_orders')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 dark:bg-zinc-800/50 border-b border-gray-50 dark:border-zinc-800">
                  <tr>
                    {[t('col_order'), t('col_store'), t('col_customer'), t('col_wilaya'), t('col_status'), t('col_total'), t('col_date')].map(h => (
                      <th key={h} className="px-4 py-3 text-start text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-t border-gray-50 dark:border-zinc-800/60 hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-black text-indigo-600 dark:text-indigo-400 tabular-nums whitespace-nowrap">
                        #{order.id?.slice(-6)?.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          {order._storeName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300 whitespace-nowrap">{order.customerName}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-500 whitespace-nowrap">
                        {order.customerWilaya?.ar_name || order.customerWilaya?.name || order.customerWilayaId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 font-black text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                        {fmt(order.totalPrice)} DA
                        {order.status === 'returned' && Number(order.priceLoss) > 0 && (
                          <span className="block text-[10px] font-semibold text-red-400">-{fmt(order.priceLoss)} DA</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-zinc-600 whitespace-nowrap" dir="ltr">
                        {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-black text-gray-800 dark:text-zinc-200">{t('top_products')}</h2>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-10">{t('no_products')}</p>
          ) : (
            topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-zinc-800/60 last:border-0">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0
                  ${i === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                    i === 1 ? 'bg-gray-100 dark:bg-zinc-800 text-gray-500' :
                    i === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-500' :
                    'bg-gray-50 dark:bg-zinc-800/60 text-gray-400'}`}>
                  {i + 1}
                </span>
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-9 h-9 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-zinc-800" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 dark:text-zinc-200 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-600">{t('product_orders', { count: p.count })}</p>
                </div>
                <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums shrink-0">{fmt(p.revenue)} DA</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Quick actions + Inventory ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-black text-gray-800 dark:text-zinc-200">{t('quick_actions')}</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
            <QuickAction icon={Store}     label={t('action_stores')}    color="#6366f1" onClick={() => navigate('/dashboard/stores')} />
            <QuickAction icon={ShoppingBag} label={t('action_orders')}  color="#8b5cf6" onClick={() => navigate('/dashboard/orders')} />
            <QuickAction icon={Plus}      label={t('action_new_order')} color="#10b981" onClick={() => navigate('/dashboard/orders/new')} />
            <QuickAction icon={Layers}    label={t('action_products')}  color="#f59e0b" onClick={() => navigate('/dashboard/products')} />
            <QuickAction icon={Truck}     label={t('action_shipping')}  color="#06b6d4" onClick={() => navigate('/dashboard/shipping')} />
            <QuickAction icon={BarChart2} label={t('action_analytics')} color="#f97316" onClick={() => navigate('/dashboard/analytics')} />
            <QuickAction icon={Settings}  label={t('action_settings')}  color="#64748b" onClick={() => navigate('/dashboard/settings')} />
          </div>
        </div>
      </div>

    </div>
  );
}