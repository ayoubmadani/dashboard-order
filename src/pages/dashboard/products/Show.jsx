import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft, ArrowRight, Edit2, Loader2, RefreshCw, AlertCircle,
  ShoppingBag, CheckCircle2, Truck, Package, Wallet, Eye, Percent, Receipt,
  Tag, Layers, Globe, LayoutTemplate, Store, ToggleLeft, ToggleRight, Trophy,
} from 'lucide-react';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const RANGES = [7, 30, 90, 0]; // 0 = كل الفترة

const STATUS_COLORS = {
  pending: '#f59e0b', appl1: '#6366f1', appl2: '#8b5cf6', appl3: '#a855f7',
  confirmed: '#3b82f6', shipping: '#06b6d4', delivered: '#10b981',
  cancelled: '#ef4444', returned: '#f97316', postponed: '#64748b',
};

/* ── KPI card ── */
const Kpi = ({ icon: Icon, label, value, hint, color }) => (
  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums truncate">{value}</p>
      </div>
    </div>
    {hint && <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-2">{hint}</p>}
  </div>
);

/* ── Section card ── */
const Section = ({ icon: Icon, title, subtitle, children }) => (
  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
      <Icon size={17} className="text-indigo-500" />
      <div>
        <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 dark:text-zinc-500">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

/* ── Share bar (نسبة من إجمالي الوحدات/الطلبات) ── */
const ShareBar = ({ value, total }) => {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 dark:text-zinc-500 tabular-nums w-8">{pct}%</span>
    </div>
  );
};

const Rank = ({ index, hasSales }) => (
  <span className={`inline-flex w-6 h-6 items-center justify-center rounded-lg text-xs font-bold ${
    index === 0 && hasSales
      ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
      : 'bg-gray-50 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500'
  }`}>
    {index === 0 && hasSales ? <Trophy size={12} /> : index + 1}
  </span>
);

const ActiveToggle = ({ active, busy, onClick, labels }) => (
  <button
    onClick={onClick}
    disabled={busy}
    className="flex items-center gap-1.5 group/toggle disabled:opacity-50"
  >
    {busy ? (
      <Loader2 size={18} className="animate-spin text-gray-400" />
    ) : active ? (
      <ToggleRight size={22} className="text-emerald-500 group-hover/toggle:text-emerald-600 transition-colors" />
    ) : (
      <ToggleLeft size={22} className="text-gray-300 dark:text-zinc-600 group-hover/toggle:text-gray-400 transition-colors" />
    )}
    <span className={`text-xs font-medium ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-zinc-500'}`}>
      {active ? labels.on : labels.off}
    </span>
  </button>
);

/* ── خانة رقمية قابلة للتعديل: تُحفظ عند Enter أو مغادرة الخانة، Esc يلغي ── */
const NumberCell = ({ value, min = 0, integer = false, placeholder, suffix, onSave }) => {
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(value ?? ''); }, [value]);

  const commit = async () => {
    const n = Number(draft);
    const invalid = draft === '' || Number.isNaN(n) || n < min || (integer && !Number.isInteger(n));
    if (invalid) { setDraft(value ?? ''); return; }
    if (n === Number(value)) return;
    setSaving(true);
    const ok = await onSave(n);
    setSaving(false);
    if (!ok) setDraft(value ?? '');
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="number"
        inputMode={integer ? 'numeric' : 'decimal'}
        min={min}
        step={integer ? 1 : 'any'}
        value={draft}
        placeholder={placeholder}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') { setDraft(value ?? ''); setTimeout(() => e.target.blur()); }
        }}
        className="w-24 px-2 py-1.5 rounded-lg border border-transparent bg-gray-50 dark:bg-zinc-800 text-sm tabular-nums text-gray-800 dark:text-zinc-100
          hover:border-gray-200 dark:hover:border-zinc-700 focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-900 outline-none transition-colors disabled:opacity-50"
      />
      {suffix && <span className="ms-1 text-[11px] text-gray-400">{suffix}</span>}
      {saving && <Loader2 size={12} className="absolute -end-4 animate-spin text-gray-400" />}
    </div>
  );
};

const Th = ({ children, className = '' }) => (
  <th className={`px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500 whitespace-nowrap ${className}`}>
    {children}
  </th>
);

/* ══════════════════════════════════════════════════════ */
export default function ShowProduct() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'products.insights' });
  const navigate = useNavigate();
  const { id } = useParams();
  const isRtl = i18n.dir() === 'rtl';
  const storeId = localStorage.getItem('storeId');

  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const formatPrice = (price) =>
    new Intl.NumberFormat(isRtl ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(price || 0);
  const formatNumber = (n) => new Intl.NumberFormat(isRtl ? 'ar-DZ' : 'fr-DZ').format(n || 0);

  const fetchAnalytics = useCallback(async () => {
    if (!storeId) { navigate('/dashboard/products'); return; }
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${baseURL}/stores/${storeId}/products/${id}/analytics`, {
        params: days ? { days } : {},
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      setData(res.data?.data || res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 404 ? t('not_found') : t('load_failed'));
    } finally {
      setLoading(false);
    }
  }, [storeId, id, days, navigate, t]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  /* ── تفعيل/تعطيل عرض أو اختيار ── */
  /* ── تعديل سعر/كمية عرض أو اختيار ── */
  const saveOption = async (kind, optionId, field, value) => {
    const listKey = kind === 'offers' ? 'offers' : 'variants';
    try {
      const res = await axios.patch(
        `${baseURL}/stores/${storeId}/products/${id}/${kind}/${optionId}`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${getAccessToken()}` } },
      );
      const saved = res.data?.data || res.data;
      setData((prev) => ({
        ...prev,
        [listKey]: prev[listKey].map((o) => (o.id === optionId ? { ...o, [field]: saved?.[field] ?? value } : o)),
      }));
      toast.success(t('toast.saved'));
      return true;
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message?.[0] || err.response?.data?.message || t('toast.save_failed'));
      return false;
    }
  };

  const toggleOption = async (kind, optionId) => {
    const listKey = kind === 'offers' ? 'offers' : 'variants';
    setBusyId(optionId);
    try {
      const res = await axios.patch(
        `${baseURL}/stores/${storeId}/products/${id}/${kind}/${optionId}/toggle-active`,
        {},
        { headers: { Authorization: `Bearer ${getAccessToken()}` } },
      );
      const isActive = (res.data?.data || res.data)?.isActive;
      setData((prev) => ({
        ...prev,
        [listKey]: prev[listKey].map((o) => (o.id === optionId ? { ...o, isActive } : o)),
      }));
      toast.success(isActive ? t('toast.enabled') : t('toast.disabled'));
    } catch (err) {
      console.error(err);
      toast.error(t('toast.toggle_failed'));
    } finally {
      setBusyId(null);
    }
  };

  /* ── تفعيل/تعطيل قيمة كاملة (مثل الأحمر) في كل تركيباتها ── */
  const toggleAttributeValue = async (group) => {
    const key = `${group.attrName}::${group.value}`;
    // القيمة معطّلة فقط إذا كانت كل تركيباتها معطّلة؛ تعطيل جزئي (بسبب قيمة
    // من صنف آخر مثل المقاس M) لا يجعلها معطّلة
    const isActive = group.activeCount === 0;
    setBusyId(key);
    try {
      const res = await axios.patch(
        `${baseURL}/stores/${storeId}/products/${id}/variants/attribute-value`,
        { attrName: group.attrName, value: group.value, isActive },
        { headers: { Authorization: `Bearer ${getAccessToken()}` } },
      );
      const ids = new Set((res.data?.data || res.data)?.variantIds ?? []);
      setData((prev) => ({
        ...prev,
        variants: prev.variants.map((v) => (ids.has(v.id) ? { ...v, isActive } : v)),
      }));
      toast.success(isActive ? t('toast.enabled') : t('toast.disabled'));
    } catch (err) {
      console.error(err);
      toast.error(t('toast.toggle_failed'));
    } finally {
      setBusyId(null);
    }
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-400">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
        <p className="text-sm">{t('loading')}</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center px-4">
        <AlertCircle size={36} className="mx-auto text-rose-400 mb-3" />
        <p className="text-sm text-gray-600 dark:text-zinc-300 mb-5">{error}</p>
        <div className="flex justify-center gap-2">
          <button onClick={fetchAnalytics} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
            {t('retry')}
          </button>
          <Link to="/dashboard/products" className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm text-gray-600 dark:text-zinc-300">
            {t('back')}
          </Link>
        </div>
      </div>
    );
  }

  const { product, summary, daily, statuses, offers, variants, pages } = data;
  const offerUnits = offers.reduce((s, o) => s + o.units, 0);
  const variantUnits = variants.reduce((s, v) => s + v.units, 0);

  // تجميع حسب الخاصية ثم القيمة: { Color: [{ value: '#f00', total, activeCount, units, ... }] }
  const valueGroups = {};
  for (const v of variants) {
    for (const e of v.name) {
      const list = (valueGroups[e.attrName] ||= []);
      let g = list.find((x) => x.value === e.value);
      if (!g) {
        g = { attrName: e.attrName, value: e.value, displayMode: e.displayMode, total: 0, activeCount: 0, orders: 0, units: 0, revenue: 0 };
        list.push(g);
      }
      g.total += 1;
      g.activeCount += v.isActive ? 1 : 0;
      g.orders += v.orders;
      g.units += v.units;
      g.revenue += v.revenue;
    }
  }
  Object.values(valueGroups).forEach((list) => list.sort((a, b) => b.units - a.units || b.orders - a.orders));
  const pageOrders = pages.reduce((s, p) => s + p.orders, 0);
  const statusTotal = statuses.reduce((s, x) => s + x.orders, 0);
  const toggleLabels = { on: t('active'), off: t('inactive') };

  const pageIcon = { landing: Globe, builder: LayoutTemplate, store: Store };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <Toaster position="top-center" richColors />

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/dashboard/products')}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800"
            aria-label={t('back')}
          >
            <BackIcon size={16} />
          </button>
          <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800">
            {product.image
              ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              : <Package size={20} className="m-auto mt-3.5 text-gray-300" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{product.name}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
              <span>{formatPrice(product.price)}</span>
              <span>·</span>
              <span className={product.isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                {product.isActive ? t('active') : t('inactive')}
              </span>
              {product.category && (<><span>·</span><span>{product.category.name}</span></>)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  days === r
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
                }`}
              >
                {r ? t('range.days', { count: r }) : t('range.all')}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800"
            aria-label={t('refresh')}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link
            to={`/dashboard/products/edit/${product.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            <Edit2 size={14} />{t('edit')}
          </Link>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={ShoppingBag} color="#6366f1" label={t('kpi.orders')} value={formatNumber(summary.orders)} />
        <Kpi icon={CheckCircle2} color="#3b82f6" label={t('kpi.confirmed')} value={formatNumber(summary.confirmed)} />
        <Kpi icon={Truck} color="#10b981" label={t('kpi.delivered')} value={formatNumber(summary.delivered)} />
        <Kpi icon={Package} color="#8b5cf6" label={t('kpi.units')} value={formatNumber(summary.units)} />
        <Kpi icon={Wallet} color="#059669" label={t('kpi.revenue')} value={formatPrice(summary.revenue)} hint={t('kpi.revenue_hint')} />
        <Kpi icon={Receipt} color="#0ea5e9" label={t('kpi.aov')} value={formatPrice(summary.averageOrderValue)} />
        <Kpi icon={Eye} color="#f59e0b" label={t('kpi.views')} value={formatNumber(summary.views)} />
        <Kpi icon={Percent} color="#ec4899" label={t('kpi.conversion')}
          value={summary.conversionRate === null ? '—' : `${summary.conversionRate}%`} />
      </div>

      {/* ── Chart + statuses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 mb-4">{t('chart.title')}</h2>
          {daily.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-16">{t('empty_sales')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pOrdersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} reversed={isRtl} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} orientation={isRtl ? 'right' : 'left'} />
                <Tooltip
                  formatter={(value, name) => [name === 'revenue' ? formatPrice(value) : value, t(`chart.${name}`)]}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} fill="url(#pOrdersGrad)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="units" stroke="#10b981" strokeWidth={2} fillOpacity={0} dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 mb-4">{t('statuses_title')}</h2>
          {statuses.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-16">{t('empty_sales')}</p>
          ) : (
            <div className="space-y-3">
              {[...statuses].sort((a, b) => b.orders - a.orders).map((s) => (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-zinc-300 font-medium">{t(`status.${s.status}`, s.status)}</span>
                    <span className="text-gray-400 tabular-nums">{s.orders}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${statusTotal ? (s.orders / statusTotal) * 100 : 0}%`,
                      background: STATUS_COLORS[s.status] || '#94a3b8',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Offers ── */}
      <Section icon={Tag} title={t('offers.title')} subtitle={t('offers.subtitle')}>
        {offers.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">{t('offers.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60 dark:bg-zinc-800/40">
                <tr>
                  <Th>#</Th><Th>{t('offers.name')}</Th><Th>{t('offers.price')}</Th><Th>{t('offers.quantity')}</Th>
                  <Th>{t('col.orders')}</Th><Th>{t('col.units')}</Th><Th>{t('col.revenue')}</Th>
                  <Th>{t('col.share')}</Th><Th>{t('col.status')}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {offers.map((o, i) => (
                  <tr key={o.id} className={o.isActive ? '' : 'opacity-60'}>
                    <td className="px-4 py-3"><Rank index={i} hasSales={o.units > 0} /></td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800 dark:text-zinc-100">{o.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">
                        {o.subTitle || (o.shippingFree ? t('offers.free_shipping') : '')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <NumberCell value={o.price} suffix={t('currency')}
                        onSave={(n) => saveOption('offers', o.id, 'price', n)} />
                    </td>
                    <td className="px-4 py-3">
                      <NumberCell value={o.quantity} min={1} integer
                        onSave={(n) => saveOption('offers', o.id, 'quantity', n)} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(o.orders)}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold">{formatNumber(o.units)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatPrice(o.revenue)}</td>
                    <td className="px-4 py-3"><ShareBar value={o.units} total={offerUnits} /></td>
                    <td className="px-4 py-3">
                      <ActiveToggle active={o.isActive} busy={busyId === o.id} labels={toggleLabels}
                        onClick={() => toggleOption('offers', o.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Variants ── */}
      <Section icon={Layers} title={t('variants.title')} subtitle={t('variants.subtitle')}>
        {variants.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">{t('variants.empty')}</p>
        ) : (
          <>
          {/* ── حسب القيمة ── */}
          <div className="p-5 border-b border-gray-100 dark:border-zinc-800 space-y-5">
            <p className="text-xs text-gray-400 dark:text-zinc-500">{t('variants.by_value_hint')}</p>
            {Object.entries(valueGroups).map(([attrName, list]) => {
              const attrUnits = list.reduce((s, g) => s + g.units, 0);
              return (
                <div key={attrName}>
                  <h3 className="text-xs font-bold text-gray-600 dark:text-zinc-300 mb-2">{attrName}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {list.map((g) => {
                      const allOff = g.activeCount === 0;
                      return (
                        <div key={g.value}
                          className={`flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 ${allOff ? 'opacity-60' : ''}`}>
                          {g.displayMode === 'color' ? (
                            <span className="w-7 h-7 rounded-lg border border-black/10 shrink-0" style={{ background: g.value }} />
                          ) : g.displayMode === 'image' ? (
                            <img src={g.value} alt={attrName} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                          ) : (
                            <span className="min-w-7 h-7 px-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800 text-xs font-bold text-gray-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                              {g.value}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-zinc-400 tabular-nums">
                              {t('variants.value_units', { count: g.units })} · {formatPrice(g.revenue)}
                            </p>
                            <ShareBar value={g.units} total={attrUnits} />
                          </div>
                          <ActiveToggle
                            active={!allOff}
                            busy={busyId === `${g.attrName}::${g.value}`}
                            labels={toggleLabels}
                            onClick={() => toggleAttributeValue(g)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60 dark:bg-zinc-800/40">
                <tr>
                  <Th>#</Th><Th>{t('variants.name')}</Th><Th>{t('variants.price')}</Th><Th>{t('variants.stock')}</Th>
                  <Th>{t('col.orders')}</Th><Th>{t('col.units')}</Th><Th>{t('col.revenue')}</Th>
                  <Th>{t('col.share')}</Th><Th>{t('col.status')}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {variants.map((v, i) => (
                  <tr key={v.id} className={v.isActive ? '' : 'opacity-60'}>
                    <td className="px-4 py-3"><Rank index={i} hasSales={v.units > 0} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {v.name.map((e, k) => (
                          <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 dark:bg-zinc-800 text-xs text-gray-700 dark:text-zinc-300">
                            {e.displayMode === 'color' && (
                              <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: e.value }} />
                            )}
                            {e.displayMode === 'image' ? (
                              <img src={e.value} alt={e.attrName} className="w-4 h-4 rounded object-cover" />
                            ) : (
                              <span>{e.displayMode === 'color' ? e.attrName : e.value}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {/* سعر ≤ 0 = يستعمل سعر المنتج */}
                      <NumberCell value={v.price > 0 ? v.price : ''} placeholder={String(product.price)} suffix={t('currency')}
                        onSave={(n) => saveOption('variants', v.id, 'price', n)} />
                    </td>
                    <td className="px-4 py-3">
                      <NumberCell value={v.stock} integer
                        onSave={(n) => saveOption('variants', v.id, 'stock', n)} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(v.orders)}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold">{formatNumber(v.units)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatPrice(v.revenue)}</td>
                    <td className="px-4 py-3"><ShareBar value={v.units} total={variantUnits} /></td>
                    <td className="px-4 py-3">
                      <ActiveToggle active={v.isActive} busy={busyId === v.id} labels={toggleLabels}
                        onClick={() => toggleOption('variants', v.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Section>

      {/* ── Landing pages ── */}
      <Section icon={Globe} title={t('pages.title')} subtitle={t('pages.subtitle')}>
        {pages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">{t('pages.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60 dark:bg-zinc-800/40">
                <tr>
                  <Th>#</Th><Th>{t('pages.page')}</Th><Th>{t('pages.views')}</Th>
                  <Th>{t('col.orders')}</Th><Th>{t('pages.conversion')}</Th><Th>{t('col.revenue')}</Th>
                  <Th>{t('col.share')}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {pages.map((p, i) => {
                  const Icon = pageIcon[p.type] || Globe;
                  return (
                    <tr key={`${p.type}-${p.id}`} className={p.isActive ? '' : 'opacity-60'}>
                      <td className="px-4 py-3"><Rank index={i} hasSales={p.orders > 0} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon size={15} className="text-gray-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-zinc-100 truncate max-w-[260px]" dir="ltr">
                              {p.type === 'store' ? t('pages.direct') : p.name}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">
                              {t(`pages.type.${p.type}`)}
                              {p.platform ? ` · ${p.platform}` : ''}
                              {p.type !== 'store' && !p.isActive ? ` · ${t('inactive')}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{p.type === 'store' ? '—' : formatNumber(p.views)}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold">{formatNumber(p.orders)}</td>
                      <td className="px-4 py-3 tabular-nums">{p.conversionRate === null ? '—' : `${p.conversionRate}%`}</td>
                      <td className="px-4 py-3 tabular-nums">{formatPrice(p.revenue)}</td>
                      <td className="px-4 py-3"><ShareBar value={p.orders} total={pageOrders} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
