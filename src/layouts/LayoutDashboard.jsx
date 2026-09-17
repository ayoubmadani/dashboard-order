import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Home, Settings, BarChart3, X, Store, Box, Layers, ShoppingCart, Truck,
    LogOut, Sun, Moon, Palette, Wallet, Code2, Globe, MessageSquareText,
    LayoutTemplate, ChevronsLeft, ChevronsRight, Languages, Search,
    LayoutGrid, CornerDownLeft, ArrowUpDown, Check,
} from 'lucide-react';
import axios from 'axios';
import { getAccessToken, removeAccessToken } from '../services/access-token';
import { clearPlanCache } from '../services/plan';
import { baseURL } from '../constents/const.';

/* ───────── Tokens ─────────
   rail     #0F2240 / dark #08121F   (كحلي عميق)
   accent   #F2B33D                   (زعفراني)
   surface  #F4F6F9 / dark #0A111C
   panel    #FFFFFF / dark #0D1726
   ink      #16202F / dark #E6EAF0
   muted    #6B7587 / dark #8A94A6
*/
const RAIL_W = 76;
const PANEL_W = 240;

const isItemActive = (pathname, href) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

/* ───────── Rail button ───────── */
const RailButton = ({ icon: Icon, label, active, onClick, isRtl }) => (
    <button
        onClick={onClick}
        aria-label={label}
        className={`group relative w-11 h-11 flex items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B33D]
            ${active ? 'bg-white/10 text-[#F2B33D]' : 'text-white/55 hover:text-white hover:bg-white/5'}`}
    >
        {active && <span className="absolute -start-[16px] top-2 bottom-2 w-[3px] rounded-e-full bg-[#F2B33D]" />}
        <Icon className="w-[20px] h-[20px]" strokeWidth={active ? 2.2 : 1.8} />
        <span
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 start-full ms-3 whitespace-nowrap rounded-lg bg-[#16202F] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50
                ${isRtl ? 'origin-right' : 'origin-left'}`}
        >
            {label}
        </span>
    </button>
);

/* ───────── Store switcher ───────── */
const StoreSwitcher = ({ t, selectedProject, storesCount, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-2 rounded-xl text-start hover:bg-[#F4F6F9] dark:hover:bg-white/[0.04] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B33D]"
    >
        <div className="w-9 h-9 shrink-0 rounded-[10px] bg-[#0F2240] dark:bg-[#F2B33D] text-[#F2B33D] dark:text-[#0F2240] flex items-center justify-center text-sm font-bold">
            {selectedProject?.name ? selectedProject.name.charAt(0).toUpperCase() : '—'}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#16202F] dark:text-[#E6EAF0] truncate">
                {selectedProject?.name || t('store.none', 'لا يوجد متجر')}
            </p>
            <p className="text-[11px] text-[#6B7587] dark:text-[#8A94A6]">
                {storesCount} {t('nav.stores_count', 'متاجر')} · {t('store.switch', 'تبديل')}
            </p>
        </div>
        <ArrowUpDown className="w-4 h-4 text-[#6B7587] shrink-0" />
    </button>
);

/* ───────── Command palette (Ctrl/⌘ + K) ───────── */
const CommandPalette = ({ open, onClose, entries, t }) => {
    const [query, setQuery] = useState('');
    const [index, setIndex] = useState(0);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setQuery('');
            setIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return entries;
        return entries.filter(e => `${e.label} ${e.hint || ''}`.toLowerCase().includes(q));
    }, [query, entries]);

    useEffect(() => { setIndex(0); }, [query]);

    if (!open) return null;

    const run = (entry) => { if (!entry) return; onClose(); entry.run(); };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i + 1, filtered.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); run(filtered[index]); }
        else if (e.key === 'Escape') { onClose(); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
            <div className="absolute inset-0 bg-[#0F2240]/40 dark:bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-[#0D1726] shadow-[0_24px_60px_-12px_rgba(15,34,64,0.45)] ring-1 ring-[#0F2240]/10 dark:ring-white/10">
                <div className="flex items-center gap-3 px-4 h-14 border-b border-[#0F2240]/[0.07] dark:border-white/[0.06]">
                    <Search className="w-5 h-5 text-[#6B7587]" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={t('palette.placeholder', 'اكتب اسم صفحة أو أمر…')}
                        className="flex-1 bg-transparent text-[15px] text-[#16202F] dark:text-[#E6EAF0] placeholder:text-[#6B7587] outline-none"
                    />
                    <kbd className="text-[10px] font-semibold text-[#6B7587] border border-[#0F2240]/10 dark:border-white/10 rounded-md px-1.5 py-0.5">Esc</kbd>
                </div>
                <ul className="max-h-[50vh] overflow-y-auto p-2">
                    {filtered.length === 0 && (
                        <li className="px-3 py-8 text-center text-sm text-[#6B7587]">
                            {t('palette.empty', 'لا توجد نتيجة. جرّب كلمة أخرى.')}
                        </li>
                    )}
                    {filtered.map((e, i) => (
                        <li key={e.id}>
                            <button
                                onMouseEnter={() => setIndex(i)}
                                onClick={() => run(e)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-colors
                                    ${i === index ? 'bg-[#0F2240] text-white dark:bg-[#F2B33D] dark:text-[#0F2240]' : 'text-[#16202F] dark:text-[#E6EAF0]'}`}
                            >
                                <e.icon className="w-4 h-4 shrink-0 opacity-80" />
                                <span className="flex-1 truncate text-sm font-medium">{e.label}</span>
                                {e.hint && <span className={`text-[11px] ${i === index ? 'opacity-70' : 'text-[#6B7587]'}`}>{e.hint}</span>}
                                {i === index && <CornerDownLeft className="w-3.5 h-3.5 opacity-70" />}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

/* ───────── Layout ───────── */
export default function LayoutDashboard() {
    const { t, i18n } = useTranslation('translation', { keyPrefix: 'layout' });
    const location = useLocation();
    const navigate = useNavigate();

    const [sheetOpen, setSheetOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [panelOpen, setPanelOpen] = useState(localStorage.getItem('navPanel') !== 'closed');
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
    const [myStores, setMyStores] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [user, setUser] = useState({ name: '...', initial: '..', email: '' });

    const userMenuRef = useRef(null);
    const langMenuRef = useRef(null);
    const isRtl = i18n.language === 'ar';

    const languages = [
        { code: 'ar', label: t('language.ar', 'العربية') },
        { code: 'en', label: t('language.en', 'English') },
        { code: 'fr', label: t('language.fr', 'Français') },
    ];
    const dateLocales = { ar: 'ar-DZ', en: 'en-US', fr: 'fr-FR' };

    const handleLanguageChange = (code) => {
        i18n.changeLanguage(code);
        setLangMenuOpen(false);
    };

    /* --- Effects (نفس المنطق) --- */
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    useEffect(() => {
        localStorage.setItem('navPanel', panelOpen ? 'open' : 'closed');
    }, [panelOpen]);

    useEffect(() => {
        if (!getAccessToken() || sessionStorage.getItem('sub_init')) return;
        (async () => {
            try {
                await axios.post(`${baseURL}/user/init-sub`, {}, {
                    headers: { Authorization: `Bearer ${getAccessToken()}` },
                });
                sessionStorage.setItem('sub_init', '1');
            } catch (error) {
                console.error('Error initializing sub:', error.response?.data || error.message);
            }
        })();
    }, []);

    useEffect(() => {
        const verifyAndFetchUser = async () => {
            const token = getAccessToken();
            if (!token) { navigate('/auth/'); return; }
            try {
                const response = await axios.get(`${baseURL}/user/current-user`, {
                    headers: { Authorization: `bearer ${token}` },
                });
                const currentUser = response.data;
                const name = currentUser.username;
                const initials = name
                    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : '??';
                setUser({ name, initial: initials, email: currentUser.email || '' });
            } catch (error) {
                if (error.response?.status === 401) {
                    removeAccessToken();
                    clearPlanCache();
                    navigate('/auth/login');
                }
            }
        };
        verifyAndFetchUser();
    }, [navigate]);

    useEffect(() => {
        const handleMouseUp = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setUserMenuOpen(false);
            if (langMenuRef.current && !langMenuRef.current.contains(event.target)) setLangMenuOpen(false);
        };
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen(o => !o);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        setSheetOpen(false);
    }, [location.pathname]);

    const handleLogout = useCallback(() => {
        removeAccessToken();
        clearPlanCache();
        navigate('/auth/login');
    }, [navigate]);

    /* --- Navigation --- */
    const navGroups = [
        {
            key: 'home', icon: Home, title: t('nav.home', 'الرئيسية'),
            items: [{ name: t('nav.home', 'الرئيسية'), href: '/dashboard', icon: Home }],
        },
        {
            key: 'store', icon: Store, title: t('nav.group_store', 'إدارة المتجر'),
            items: [
                { name: t('nav.stores', 'المتجر'), href: '/dashboard/store', icon: Store },
                { name: t('nav.products', 'المنتجات'), href: '/dashboard/products', icon: Box },
                { name: t('nav.categories', 'التصنيفات'), href: '/dashboard/category', icon: Layers },
                { name: t('nav.theme', 'الثيم'), href: '/dashboard/theme', icon: Palette },
                { name: t('nav.editor', 'محرر الصفحات'), href: '/dashboard/landing-pages', icon: LayoutTemplate },
                { name: t('nav.domain', 'الدومين'), href: '/dashboard/domain', icon: Globe },
                { name: t('nav.pixels', 'بيكسل'), href: '/dashboard/pixels', icon: Code2 },
            ],
        },
        {
            key: 'sales', icon: ShoppingCart, title: t('nav.group_sales', 'المبيعات'),
            items: [
                { name: t('nav.orders', 'الطلبات'), href: '/dashboard/orders', icon: ShoppingCart },
                { name: t('nav.shipping', 'الشحن'), href: '/dashboard/shipping', icon: Truck },
                { name: t('nav.wallet', 'المحفظة'), href: '/dashboard/wallet', icon: Wallet },
            ],
        },
        {
            key: 'insights', icon: BarChart3, title: t('nav.group_analytics', 'التحليلات والدعم'),
            items: [
                { name: t('nav.analytics', 'التحليلات'), href: '/dashboard/analytics', icon: BarChart3 },
                { name: t('nav.messages', 'الرسائل'), href: '/dashboard/messages', icon: MessageSquareText },
            ],
        },
        {
            key: 'system', icon: Settings, title: t('nav.group_system', 'النظام'),
            items: [{ name: t('nav.settings', 'الإعدادات'), href: '/dashboard/settings', icon: Settings }],
        },
    ];

    const allItems = navGroups.flatMap(g => g.items.map(i => ({ ...i, group: g.title })));
    const activeItem = allItems.find(i => isItemActive(location.pathname, i.href));
    const activeGroupKey = navGroups.find(g => g.items.some(i => isItemActive(location.pathname, i.href)))?.key || 'home';

    const [openGroupKey, setOpenGroupKey] = useState(activeGroupKey);
    useEffect(() => { setOpenGroupKey(activeGroupKey); }, [activeGroupKey]);

    const openGroup = navGroups.find(g => g.key === openGroupKey) || navGroups[0];
    const showPanel = panelOpen && openGroup.items.length > 1;

    const onRailClick = (group) => {
        if (group.items.length === 1) {
            navigate(group.items[0].href);
            return;
        }
        if (openGroupKey === group.key && panelOpen) setPanelOpen(false);
        else { setOpenGroupKey(group.key); setPanelOpen(true); }
    };

    /* --- Stores --- */
    const fetchStores = useCallback(async () => {
        try {
            const response = await axios.get(`${baseURL}/stores/user/me`, {
                headers: { Authorization: `Bearer ${getAccessToken()}` },
            });
            const dataStores = response.data.data;
            if (response.data.success) {
                if (dataStores.length > 0) {
                    const saved = localStorage.getItem('storeId');
                    if (!saved || !dataStores.find(s => s.id == saved)) {
                        localStorage.setItem('storeId', dataStores[0].id);
                    }
                } else {
                    localStorage.removeItem('storeId');
                }
                setMyStores(dataStores || []);
            }
        } catch (err) { console.error('Error:', err); }
    }, []);

    useEffect(() => { fetchStores(); }, [fetchStores]);

    useEffect(() => {
        if (myStores?.length > 0) {
            const savedStoreId = localStorage.getItem('storeId');
            const savedStore = savedStoreId ? myStores.find(s => s.id?.toString() === savedStoreId.toString()) : null;
            setSelectedProject(savedStore || myStores[0]);
        } else {
            setSelectedProject(null);
        }
    }, [myStores]);

    const goStores = () => navigate('/dashboard/settings/stores');

    /* --- Palette entries --- */
    const paletteEntries = [
        ...allItems.map(i => ({ id: i.href, icon: i.icon, label: i.name, hint: i.group, run: () => navigate(i.href) })),
        { id: 'act-theme', icon: isDark ? Sun : Moon, label: isDark ? t('palette.light', 'الوضع الفاتح') : t('palette.dark', 'الوضع الداكن'), run: () => setIsDark(d => !d) },
        ...languages.filter(l => l.code !== i18n.language).map(l => ({
            id: `lang-${l.code}`, icon: Languages, label: l.label, hint: t('language.label', 'اللغة'), run: () => handleLanguageChange(l.code),
        })),
        { id: 'act-stores', icon: ArrowUpDown, label: t('store.switch_store', 'تبديل المتجر'), run: goStores },
        { id: 'act-logout', icon: LogOut, label: t('user_menu.logout', 'تسجيل الخروج'), run: handleLogout },
    ];

    const mobileTabs = [
        { name: t('nav.home', 'الرئيسية'), href: '/dashboard', icon: Home },
        { name: t('nav.orders', 'الطلبات'), href: '/dashboard/orders', icon: ShoppingCart },
        { name: t('nav.products', 'المنتجات'), href: '/dashboard/products', icon: Box },
        { name: t('nav.analytics', 'التحليلات'), href: '/dashboard/analytics', icon: BarChart3 },
    ];

    const contentOffset = RAIL_W + (showPanel ? PANEL_W : 0);
    const shortcut = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘K' : 'Ctrl K';

    return (
        <div
            className="min-h-screen bg-[#F4F6F9] dark:bg-[#0A111C] text-[#16202F] dark:text-[#E6EAF0] text-sm"
            dir={isRtl ? 'rtl' : 'ltr'}
            style={{ fontFamily: "'IBM Plex Sans Arabic', 'IBM Plex Sans', system-ui, sans-serif" }}
        >
            {/* ── Desktop rail ── */}
            <aside
                className="hidden lg:flex fixed inset-y-0 start-0 z-40 flex-col items-center py-4 bg-[#0F2240] dark:bg-[#08121F]"
                style={{ width: RAIL_W }}
            >
                <Link to="/dashboard" className="mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B33D] rounded-xl">
                    <img src="/logo.png" alt="MdStore" className="w-10 h-10 rounded-xl" />
                </Link>

                <nav className="flex flex-col items-center gap-2 flex-1">
                    {navGroups.map(g => (
                        <RailButton
                            key={g.key}
                            icon={g.icon}
                            label={g.title}
                            isRtl={isRtl}
                            active={activeGroupKey === g.key}
                            onClick={() => onRailClick(g)}
                        />
                    ))}
                </nav>

                <div className="flex flex-col items-center gap-2">
                    <RailButton icon={isDark ? Sun : Moon} label={isDark ? t('palette.light', 'الوضع الفاتح') : t('palette.dark', 'الوضع الداكن')} isRtl={isRtl} onClick={() => setIsDark(d => !d)} />

                    <div className="relative" ref={langMenuRef}>
                        <RailButton icon={Languages} label={t('language.label', 'اللغة')} isRtl={isRtl} onClick={() => setLangMenuOpen(o => !o)} />
                        {langMenuOpen && (
                            <div className="absolute bottom-0 start-full ms-3 w-40 p-1.5 rounded-xl bg-white dark:bg-[#0D1726] shadow-[0_16px_40px_-10px_rgba(15,34,64,0.35)] ring-1 ring-[#0F2240]/10 dark:ring-white/10 z-50">
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.code)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-[#F4F6F9] dark:hover:bg-white/5"
                                    >
                                        {lang.label}
                                        {i18n.language === lang.code && <Check className="w-4 h-4 text-[#F2B33D]" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative mt-2" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(o => !o)}
                            className="w-10 h-10 rounded-full bg-[#F2B33D] text-[#0F2240] text-xs font-bold flex items-center justify-center ring-2 ring-white/10 hover:ring-[#F2B33D]/60 transition focus:outline-none focus-visible:ring-[#F2B33D]"
                            aria-label={user.name}
                        >
                            {user.initial}
                        </button>
                        {userMenuOpen && (
                            <div className="absolute bottom-0 start-full ms-3 w-64 rounded-2xl bg-white dark:bg-[#0D1726] shadow-[0_16px_40px_-10px_rgba(15,34,64,0.35)] ring-1 ring-[#0F2240]/10 dark:ring-white/10 z-50 overflow-hidden">
                                <div className="p-4 border-b border-[#0F2240]/[0.07] dark:border-white/[0.06]">
                                    <p className="text-sm font-semibold truncate">{user.name}</p>
                                    <p className="text-xs text-[#6B7587] truncate">{user.email}</p>
                                </div>
                                <div className="p-1.5">
                                    <button
                                        onClick={() => { navigate('/dashboard/settings'); setUserMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#F4F6F9] dark:hover:bg-white/5"
                                    >
                                        <Settings className="w-4 h-4 text-[#6B7587]" />
                                        {t('user_menu.settings', 'الإعدادات')}
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('user_menu.logout', 'تسجيل الخروج')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Desktop contextual panel ── */}
            {showPanel && (
                <aside
                    className="hidden lg:flex fixed inset-y-0 z-30 flex-col bg-white dark:bg-[#0D1726] border-e border-[#0F2240]/[0.07] dark:border-white/[0.06]"
                    style={{ width: PANEL_W, insetInlineStart: RAIL_W }}
                >
                    <div className="p-3 border-b border-[#0F2240]/[0.07] dark:border-white/[0.06]">
                        <StoreSwitcher t={t} selectedProject={selectedProject} storesCount={myStores.length} onClick={goStores} />
                    </div>

                    <div className="flex items-center justify-between px-5 pt-5 pb-2">
                        <h2 className="text-[15px] font-bold">{openGroup.title}</h2>
                        <button
                            onClick={() => setPanelOpen(false)}
                            aria-label={t('nav.collapse', 'إخفاء القائمة')}
                            className="p-1.5 rounded-lg text-[#6B7587] hover:bg-[#F4F6F9] dark:hover:bg-white/5"
                        >
                            {isRtl ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
                        {openGroup.items.map(item => {
                            const active = isItemActive(location.pathname, item.href);
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B33D]
                                        ${active
                                            ? 'bg-[#0F2240]/[0.06] dark:bg-white/[0.06] font-semibold text-[#0F2240] dark:text-white'
                                            : 'text-[#6B7587] dark:text-[#8A94A6] hover:text-[#16202F] dark:hover:text-white hover:bg-[#F4F6F9] dark:hover:bg-white/[0.03]'}`}
                                >
                                    {active && <span className="absolute start-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-[#F2B33D]" />}
                                    <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>
            )}

            {/* ── Main ── */}
            <div className="min-h-screen flex flex-col lg:transition-[padding] lg:duration-200 lg:[padding-inline-start:var(--offset)]" style={{ '--offset': `${contentOffset}px` }}>
                <header className="sticky top-0 z-20 bg-[#F4F6F9]/85 dark:bg-[#0A111C]/85 backdrop-blur-md">
                    <div className="h-16 flex items-center gap-3 px-4 lg:px-8">
                        {/* Mobile: store */}
                        <button onClick={goStores} className="lg:hidden flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 shrink-0 rounded-[9px] bg-[#0F2240] text-[#F2B33D] flex items-center justify-center text-xs font-bold">
                                {selectedProject?.name?.charAt(0).toUpperCase() || '—'}
                            </div>
                            <span className="font-semibold truncate max-w-[40vw]">{selectedProject?.name || 'MdStore'}</span>
                        </button>

                        {/* Desktop: panel toggle + title */}
                        <div className="hidden lg:flex items-center gap-3 min-w-0">
                            {!showPanel && openGroup.items.length > 1 && (
                                <button
                                    onClick={() => setPanelOpen(true)}
                                    aria-label={t('nav.expand', 'إظهار القائمة')}
                                    className="p-1.5 rounded-lg text-[#6B7587] hover:bg-white dark:hover:bg-white/5"
                                >
                                    {isRtl ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
                                </button>
                            )}
                            <div className="min-w-0">
                                <h1 className="text-lg font-bold leading-tight truncate">{activeItem?.name || 'MdStore'}</h1>
                                <p className="text-[11px] text-[#6B7587] dark:text-[#8A94A6]">
                                    {new Date().toLocaleDateString(dateLocales[i18n.language] || 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1" />

                        {/* Search trigger */}
                        <button
                            onClick={() => setPaletteOpen(true)}
                            className="flex items-center gap-2 h-10 px-3 lg:w-72 rounded-xl bg-white dark:bg-[#0D1726] ring-1 ring-[#0F2240]/[0.08] dark:ring-white/[0.06] text-[#6B7587] hover:ring-[#0F2240]/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B33D]"
                        >
                            <Search className="w-4 h-4" />
                            <span className="hidden lg:inline flex-1 text-start">{t('palette.trigger', 'ابحث أو انتقل إلى…')}</span>
                            <kbd className="hidden lg:inline text-[10px] font-semibold border border-[#0F2240]/10 dark:border-white/10 rounded-md px-1.5 py-0.5" dir="ltr">{shortcut}</kbd>
                        </button>
                    </div>
                </header>

                <main className="flex-1 px-4 pt-2 pb-28 lg:px-8 lg:pb-10">
                    <div className="max-w-7xl mx-auto">
                        <Outlet context={{ myStores, fetchStores, selectedProject, setSelectedProject, user }} />
                    </div>
                </main>
            </div>

            {/* ── Mobile bottom bar ── */}
            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0F2240] dark:bg-[#08121F] pb-[env(safe-area-inset-bottom)]">
                <div className="grid grid-cols-5 h-16">
                    {mobileTabs.map(tab => {
                        const active = isItemActive(location.pathname, tab.href);
                        return (
                            <Link key={tab.href} to={tab.href} className={`relative flex flex-col items-center justify-center gap-1 ${active ? 'text-[#F2B33D]' : 'text-white/55'}`}>
                                {active && <span className="absolute top-0 w-8 h-[3px] rounded-b-full bg-[#F2B33D]" />}
                                <tab.icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
                                <span className="text-[10px] font-medium">{tab.name}</span>
                            </Link>
                        );
                    })}
                    <button onClick={() => setSheetOpen(true)} className={`flex flex-col items-center justify-center gap-1 ${sheetOpen ? 'text-[#F2B33D]' : 'text-white/55'}`}>
                        <LayoutGrid className="w-5 h-5" strokeWidth={1.8} />
                        <span className="text-[10px] font-medium">{t('nav.more', 'المزيد')}</span>
                    </button>
                </div>
            </nav>

            {/* ── Mobile sheet ── */}
            {sheetOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-[#0F2240]/40 backdrop-blur-[2px]" onClick={() => setSheetOpen(false)} />
                    <div className="absolute bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-[#0D1726] pb-[calc(env(safe-area-inset-bottom)+16px)]">
                        <div className="sticky top-0 bg-white dark:bg-[#0D1726] px-5 pt-3 pb-3">
                            <div className="mx-auto mb-3 w-10 h-1 rounded-full bg-[#0F2240]/15 dark:bg-white/15" />
                            <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <StoreSwitcher t={t} selectedProject={selectedProject} storesCount={myStores.length} onClick={goStores} />
                                </div>
                                <button onClick={() => setSheetOpen(false)} aria-label="close" className="p-2 rounded-lg text-[#6B7587] hover:bg-[#F4F6F9] dark:hover:bg-white/5">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="px-5 space-y-5">
                            {navGroups.filter(g => g.key !== 'home').map(g => (
                                <section key={g.key}>
                                    <h3 className="text-xs font-semibold text-[#6B7587] dark:text-[#8A94A6] mb-2">{g.title}</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {g.items.map(item => {
                                            const active = isItemActive(location.pathname, item.href);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    to={item.href}
                                                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-center
                                                        ${active ? 'bg-[#0F2240] text-[#F2B33D]' : 'bg-[#F4F6F9] dark:bg-white/[0.04] text-[#16202F] dark:text-[#E6EAF0]'}`}
                                                >
                                                    <item.icon className="w-5 h-5" />
                                                    <span className="text-[11px] leading-tight px-1 line-clamp-2">{item.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}

                            <section className="flex items-center gap-2 pt-2 border-t border-[#0F2240]/[0.07] dark:border-white/[0.06]">
                                <button onClick={() => setIsDark(d => !d)} className="p-2.5 rounded-xl bg-[#F4F6F9] dark:bg-white/[0.04]" aria-label="theme">
                                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>
                                <div className="flex flex-1 rounded-xl bg-[#F4F6F9] dark:bg-white/[0.04] p-1">
                                    {languages.map(l => (
                                        <button
                                            key={l.code}
                                            onClick={() => handleLanguageChange(l.code)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${i18n.language === l.code ? 'bg-white dark:bg-[#0F2240] shadow-sm' : 'text-[#6B7587]'}`}
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={handleLogout} className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600" aria-label="logout">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} entries={paletteEntries} t={t} />
        </div>
    );
}
