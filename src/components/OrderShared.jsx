import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Lock, Loader2, X } from 'lucide-react';

// ─── Enums & Constants ────────────────────────────────────────────
export const StatusEnum = {
  PENDING: 'pending', APPL1: 'appl1', APPL2: 'appl2', APPL3: 'appl3',
  CONFIRMED: 'confirmed', CANCELLED: 'cancelled', RETURNED: 'returned',
  DELIVERED: 'delivered', POSTPONED: 'postponed', SHIPPING: 'shipping',
};

export const TypeShipEnum = { HOME: 'home', OFFICE: 'office' };

export const LOCKED_STATUSES = [
  StatusEnum.CONFIRMED, StatusEnum.SHIPPING, StatusEnum.DELIVERED,
  StatusEnum.CANCELLED, StatusEnum.RETURNED,
];

export const ALL_FILTER = '__all__';

export const typeShipOptions = [
  { value: TypeShipEnum.HOME,   label: 'المنزل' },
  { value: TypeShipEnum.OFFICE, label: 'المكتب' },
];

export const platformOptions = [
  { value: 'facebook',  label: 'Facebook',  color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' },
  { value: 'tiktok',    label: 'TikTok',    color: 'bg-gray-50 dark:bg-zinc-700/30 text-gray-800 dark:text-zinc-200 border-gray-200 dark:border-zinc-600' },
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-500/20' },
  { value: 'mdtest',    label: 'MdTest',    color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' },
  { value: 'mdstore',   label: 'MdStore',   color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20' },
  { value: 'google',    label: 'Google',    color: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' },
  { value: 'website',   label: 'Website',   color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' },
  { value: 'other',     label: 'أخرى',      color: 'bg-gray-50 dark:bg-zinc-700/30 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-600' },
];

export const statusOptions = [
  { value: StatusEnum.PENDING,   label: 'قيد الانتظار', pill: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',       dot: 'bg-amber-500',              menuDot: 'bg-amber-400' },
  { value: StatusEnum.APPL1,     label: 'محاولة 1',     pill: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20', dot: 'bg-orange-500',             menuDot: 'bg-orange-400' },
  { value: StatusEnum.APPL2,     label: 'محاولة 2',     pill: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20', dot: 'bg-orange-500',             menuDot: 'bg-orange-400' },
  { value: StatusEnum.APPL3,     label: 'محاولة 3',     pill: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20', dot: 'bg-orange-500',             menuDot: 'bg-orange-400' },
  { value: StatusEnum.CONFIRMED, label: 'مؤكد',         pill: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',             dot: 'bg-blue-500',               menuDot: 'bg-blue-400' },
  { value: StatusEnum.SHIPPING,  label: 'يتم الشحن',    pill: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',             dot: 'bg-cyan-500 animate-pulse', menuDot: 'bg-cyan-400' },
  { value: StatusEnum.CANCELLED, label: 'ملغى',         pill: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',             dot: 'bg-rose-500',               menuDot: 'bg-rose-400' },
  { value: StatusEnum.RETURNED,  label: 'مرتجع',        pill: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20', dot: 'bg-purple-500',             menuDot: 'bg-purple-400' },
  { value: StatusEnum.DELIVERED, label: 'تم التوصيل',   pill: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500',       menuDot: 'bg-emerald-400' },
  { value: StatusEnum.POSTPONED, label: 'مؤجل',         pill: 'bg-gray-50 dark:bg-zinc-500/10 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-500/20',             dot: 'bg-gray-400',               menuDot: 'bg-gray-400' },
];

// ─── Pure Helpers ─────────────────────────────────────────────────
export const getStatus   = (val) => statusOptions.find(s => s.value === val) || statusOptions[0];
export const getPlatform = (val) => platformOptions.find(p => p.value === val) || platformOptions[platformOptions.length - 1];
export const getInitials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
export const isLocked    = (status) => LOCKED_STATUSES.includes(status);
export const fmtDate     = (iso) => iso
  ? new Date(iso).toLocaleDateString('ar-DZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : null;

export const formatVariant = (variantDetail) => {
  if (!variantDetail?.name) return '';
  if (typeof variantDetail.name === 'string') return variantDetail.name;
  return Object.entries(variantDetail.name).map(([k, v]) => `${k}: ${v}`).join(' | ');
};

export const mapApiOrder = (raw) => ({
  id:              raw.id,
  name:            raw.customerName || '',
  phone:           raw.customerPhone || '',
  product:         raw.product?.name || '',
  productId:       raw.productId,
  unityPrice:      parseFloat(raw.unityPrice) || parseFloat(raw.variantDetail?.price) || 0,
  priceShip:       parseFloat(raw.priceShip) || 0,
  totalPrice:      parseFloat(raw.totalPrice) || 0,
  quantity:        raw.offer?.quantity || raw.quantity || 1,
  wilaya:          raw.customerWilaya?.ar_name || raw.customerWilaya?.name || '',
  wilayaId:        raw.customerWilayaId   ?? null,
  wilayaObj:       raw.customerWilaya     ?? null,
  commune:         raw.customerCommune?.ar_name || raw.customerCommune?.name || '',
  communeId:       raw.customerCommuneId  ?? null,
  communeObj:      raw.customerCommune    ?? null,
  typeShip:        raw.typeShip || TypeShipEnum.HOME,
  variant:         formatVariant(raw.variantDetail),
  variantDetail:   raw.variantDetail || null,
  variantDetailId: raw.variantDetailId || null,
  offer:           raw.offer?.name || '',
  offerId:         raw.offerId || null,
  offerObj:        raw.offer || null,
  platform:        raw.platform || raw.paltform || 'other',
  status:          raw.status || StatusEnum.PENDING,
  isUploadedShipping: raw.isUploadedShipping || false,
  createdAt:       raw.createdAt,
  confirmedAt:     raw.confirmedAt,
  shippingAt:      raw.shippingAt,
  deliveredAt:     raw.deliveredAt,
  postponedUntil:  raw.postponedUntil,
});

// ─── StatusPill ───────────────────────────────────────────────────
export const StatusPill = ({ status }) => {
  const s = getStatus(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${s.pill}`}>
      {s.label}
    </span>
  );
};

// ─── PlatformBadge ────────────────────────────────────────────────
export const PlatformBadge = ({ platform }) => {
  const p = getPlatform(platform);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-bold ${p.color}`}>
      {p.label}
    </span>
  );
};

// ─── StatusDropdown ───────────────────────────────────────────────
export const StatusDropdown = ({ value, onChange, loading }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = getStatus(value);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button disabled={loading} onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[12px] font-bold transition-all hover:brightness-105 active:scale-95 ${current.pill} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
        {loading ? <Loader2 size={12} className="animate-spin" /> : <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${current.dot}`} />}
        {current.label}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-44 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
          {statusOptions.map(s => (
            <button key={s.value} onClick={() => { onChange(s.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-bold transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 ${value === s.value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.menuDot}`} />
              {s.label}
              {value === s.value && <span className="mr-auto text-emerald-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── StatusFilterBar ──────────────────────────────────────────────
export const StatusFilterBar = ({ activeFilter, onChange, counts }) => {
  const filters = [
    { value: ALL_FILTER, label: 'الكل', dot: null, pill: null },
    ...statusOptions.map(s => ({ value: s.value, label: s.label, dot: s.dot, pill: s.pill })),
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map(f => {
        const isActive = activeFilter === f.value;
        const count = counts[f.value] ?? 0;
        return (
          <button key={f.value} onClick={() => onChange(isActive && f.value !== ALL_FILTER ? ALL_FILTER : f.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all active:scale-95
              ${isActive
                ? (f.pill ? `${f.pill} shadow-sm` : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-sm')
                : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600'
              }`}>
            {f.dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'opacity-60 bg-current' : f.dot}`} />}
            {f.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black min-w-[18px] text-center
              ${isActive ? 'bg-black/10 dark:bg-white/20' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─── FieldLabel ───────────────────────────────────────────────────
export const FieldLabel = ({ children, locked }) => (
  <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
    {children}
    {locked && <Lock size={9} className="text-gray-300 dark:text-zinc-600" />}
  </label>
);

// ─── ReadonlyField ────────────────────────────────────────────────
export const ReadonlyField = ({ value }) => (
  <div className="w-full px-3 py-2.5 text-[13px] rounded-xl border font-medium select-none bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800 text-gray-400 dark:text-zinc-500">
    {value || '—'}
  </div>
);

// ─── LockBanner ───────────────────────────────────────────────────
export const LockBanner = ({ status }) => {
  const s = getStatus(status);
  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 py-3">
      <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
        <Lock size={13} className="text-gray-500 dark:text-zinc-400" />
      </div>
      <div>
        <p className="text-[12px] font-black text-gray-700 dark:text-zinc-200">بيانات الطلب مقفلة</p>
        <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
          الطلبات التي وصلت إلى <span className="font-bold">«{s.label}»</span> — لا يمكن تعديل البيانات، لكن يمكن تغيير الحالة
        </p>
      </div>
    </div>
  );
};

// ─── ColorSwatch ──────────────────────────────────────────────────
export const ColorSwatch = ({ hex }) => {
  const isHex = /^#[0-9a-f]{3,8}$/i.test(hex);
  if (!isHex) return <span>{hex}</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-3.5 h-3.5 rounded-full border border-white shadow-sm flex-shrink-0" style={{ background: hex }} />
      {hex}
    </span>
  );
};

// ─── VariantDisplay ───────────────────────────────────────────────
export const VariantDisplay = ({ variantDetail }) => {
  if (!variantDetail?.name) return <span className="text-gray-400">—</span>;
  const entries = typeof variantDetail.name === 'string'
    ? [['Variant', variantDetail.name]]
    : Object.entries(variantDetail.name);
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-[11px] font-bold text-gray-600 dark:text-zinc-300">
          <span className="text-gray-400 dark:text-zinc-500 font-medium">{k}:</span>
          <ColorSwatch hex={v} />
        </span>
      ))}
    </div>
  );
};

// ─── SearchableSelect ─────────────────────────────────────────────
export const SearchableSelect = ({ value, onChange, options, placeholder, loading, disabled, renderOption }) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref      = useRef(null);
  const inputRef = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()) || o.sub?.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled || loading} onClick={() => { setOpen(o => !o); setQuery(''); }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-[13px] rounded-xl border outline-none transition-all
          ${disabled || loading
            ? 'bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800 text-gray-400 cursor-not-allowed'
            : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 hover:border-emerald-400'
          }`}>
        <span className={`truncate flex items-center gap-1.5 ${!selected ? 'text-gray-400 dark:text-zinc-500' : ''}`}>
          {selected?.hexColors?.length > 0 && (
            <span className="flex gap-0.5 flex-shrink-0">
              {selected.hexColors.map((c, i) => <span key={i} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: c }} />)}
            </span>
          )}
          {loading ? 'جار التحميل…' : (selected?.label || placeholder || 'اختر...')}
        </span>
        {loading
          ? <Loader2 size={13} className="animate-spin text-gray-400 flex-shrink-0" />
          : <ChevronDown size={13} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      {open && !loading && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-gray-50 dark:border-zinc-800">
            <div className="relative">
              <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث..."
                className="w-full pr-8 pl-3 py-2 text-[12px] bg-gray-50 dark:bg-zinc-800 rounded-lg outline-none placeholder:text-gray-400 dark:text-zinc-100 dark:placeholder:text-zinc-600" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0
              ? <p className="px-4 py-3 text-[12px] text-gray-400 dark:text-zinc-500 text-center">لا توجد نتائج</p>
              : filtered.map(o => (
                <button key={o.value} type="button" onClick={() => { onChange(o); setOpen(false); setQuery(''); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[12px] transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800
                    ${value === o.value ? 'font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5' : 'text-gray-700 dark:text-zinc-300 font-medium'}`}>
                  <span className="flex-1 min-w-0">
                    {renderOption ? renderOption(o) : <span className="truncate">{o.label}</span>}
                  </span>
                  <span className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {o.sub && <span className="text-[10px] text-gray-400 dark:text-zinc-500">{o.sub}</span>}
                    {value === o.value && <span className="text-emerald-500 text-[10px]">✓</span>}
                  </span>
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};