import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Home, Settings, BarChart3, Menu, X, Store, Box, Layers, ShoppingCart, Truck,
    LogOut, Sun, Moon, Palette, Wallet, Code2, Globe, MessageSquareText,
    LayoutTemplate, Languages, ChevronsUpDown, ChevronDown, Check,
} from 'lucide-react';
import axios from 'axios';
import { getAccessToken, removeAccessToken } from '../services/access-token';
import { clearPlanCache } from '../services/plan';
import { baseURL } from '../constents/const.';

const getStoreGradient = (name) => {
    const gradients = [
        'from-emerald-500 to-teal-600',
        'from-blue-500 to-indigo-600',
        'from-violet-500 to-purple-600',
        'from-amber-500 to-orange-600',
    ];
    return gradients[name ? name.charCodeAt(0) % gradients.length : 0];
};

const isItemActive = (pathname, href) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

/* ───────── Sidebar content (desktop + mobile) ───────── */
const SidebarContent = ({ t, navGroups, pathname, selectedProject, storesCount, onStores, onNavigate, onClose }) => (
    <div className="flex flex-col h-full">
        {/* Store */}
        <div className="flex items-center gap-2 p-3 h-16">
            <button
                onClick={onStores}
                className="flex-1 min-w-0 flex items-center gap-3 p-2 rounded-xl border border-gray-200 dark:border-white/[0.06] hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors text-start"
            >
                <div className={`w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br ${selectedProject ? getStoreGradient(selectedProject.name) : 'from-gray-400 to-gray-500'} flex items-center justify-center text-sm font-bold text-white`}>
                    {selectedProject?.name ? selectedProject.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{selectedProject?.name || '—'}</p>
                    <p className="text-[11px] text-gray-400 leading-tight">{storesCount} {t('nav.stores_count', 'متاجر')}</p>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
            {onClose && (
                <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
            {navGroups.map((group, idx) => (
                <div key={group.title || idx}>
                    {group.title && (
                        <p className="px-3 mb-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                            {group.title}
                        </p>
                    )}
                    <div className="space-y-0.5">
                        {group.items.map(item => {
                            const active = isItemActive(pathname, item.href);
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={onNavigate}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${active
                                        ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/30'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                >
                                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>

        {/* Brand footer */}
        <div className="flex items-center gap-2 px-5 h-12 border-t border-gray-100 dark:border-white/[0.06]">
            <img src="/logo.png" alt="MdStore" className="w-5 h-5 rounded-md opacity-80" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">MdStore</span>
        </div>
    </div>
);

/* ───────── Layout ───────── */
export default function LayoutDashboard() {
    const { t, i18n } = useTranslation('translation', { keyPrefix: 'layout' });
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
    const [myStores, setMyStores] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [user, setUser] = useState({ name: '...', initial: '..', email: '' });

    const userMenuRef = useRef(null);
    const langMenuRef = useRef(null);
    const isRtl = i18n.language === 'ar';
    const dateLocales = { ar: 'ar-SA', en: 'en-US', fr: 'fr-FR' };

    const languages = [
        { code: 'ar', label: t('language.ar', 'العربية') },
        { code: 'en', label: t('language.en', 'English') },
        { code: 'fr', label: t('language.fr', 'Français') },
    ];

    const handleLanguageChange = (code) => {
        i18n.changeLanguage(code);
        setLangMenuOpen(false);
    };

    // --- Effects (نفس المنطق) ---
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
                const name = response.data.username;
                const initials = name
                    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : '??';
                setUser({ name, initial: initials, email: response.data.email || '' });
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
        window.scrollTo(0, 0);
        setSidebarOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        removeAccessToken();
        clearPlanCache();
        navigate('/auth/login');
    };

    // --- Navigation ---
    const navGroups = [
        {
            title: null,
            items: [{ name: t('nav.home', 'الرئيسية'), href: '/dashboard', icon: Home }],
        },
        {
            title: t('nav.group_store', 'إدارة المتجر'),
            items: [
                { name: t('nav.stores', 'المتجر'), href: '/dashboard/store', icon: Store },
                { name: t('nav.domain', 'الدومين'), href: '/dashboard/domain', icon: Globe },
                { name: t('nav.theme', 'الثيم'), href: '/dashboard/theme', icon: Palette },
                { name: t('nav.pixels', 'بيكسل'), href: '/dashboard/pixels', icon: Code2 },
                { name: t('nav.categories', 'التصنيفات'), href: '/dashboard/category', icon: Layers },
                { name: t('nav.products', 'المنتجات'), href: '/dashboard/products', icon: Box },
                { name: t('nav.editor', 'محرر الصفحات'), href: '/dashboard/landing-pages', icon: LayoutTemplate },
            ],
        },
        {
            title: t('nav.group_sales', 'المبيعات'),
            items: [
                { name: t('nav.orders', 'الطلبات'), href: '/dashboard/orders', icon: ShoppingCart },
                { name: t('nav.shipping', 'الشحن'), href: '/dashboard/shipping', icon: Truck },
                { name: t('nav.wallet', 'المحفظة'), href: '/dashboard/wallet', icon: Wallet },
            ],
        },
        {
            title: t('nav.group_analytics', 'التحليلات والدعم'),
            items: [
                { name: t('nav.analytics', 'التحليلات'), href: '/dashboard/analytics', icon: BarChart3 },
                { name: t('nav.messages', 'الرسائل'), href: '/dashboard/messages', icon: MessageSquareText },
            ],
        },
        {
            title: t('nav.group_system', 'النظام'),
            items: [{ name: t('nav.settings', 'الإعدادات'), href: '/dashboard/settings', icon: Settings }],
        },
    ];

    const pageTitle =
        navGroups.flatMap(g => g.items).find(i => isItemActive(location.pathname, i.href))?.name || 'MdStore';

    // --- Stores ---
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

    const sidebarProps = {
        t, navGroups, selectedProject,
        pathname: location.pathname,
        storesCount: myStores.length,
        onStores: () => navigate('/dashboard/settings/stores'),
    };

    const iconBtn = 'p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors';
    const menuBox = 'absolute top-full end-0 mt-2 bg-white dark:bg-[#1a1a1c] rounded-xl shadow-xl shadow-black/10 dark:shadow-black/50 border border-gray-100 dark:border-white/10 z-50';

    return (
        <div className="min-h-screen bg-gray-50/80 dark:bg-[#030303] text-sm" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed inset-y-0 start-0 w-64 bg-white dark:bg-[#0c0c0c] border-e border-gray-200 dark:border-white/[0.06]">
                <SidebarContent {...sidebarProps} />
            </aside>

            {/* Main */}
            <div className="lg:ps-64 min-h-screen flex flex-col">

                {/* Header */}
                <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 lg:px-8 bg-white/80 dark:bg-[#0c0c0c]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06]">
                    <button className={`lg:hidden ${iconBtn}`} onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="min-w-0">
                        <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">{pageTitle}</h1>
                        <p className="hidden sm:block text-[11px] text-gray-500 dark:text-gray-400">
                            {new Date().toLocaleDateString(dateLocales[i18n.language] || 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="flex-1" />

                    {/* Theme */}
                    <button onClick={() => setIsDark(!isDark)} className={iconBtn}>
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Language */}
                    <div className="relative" ref={langMenuRef}>
                        <button onClick={() => setLangMenuOpen(o => !o)} className={`${iconBtn} flex items-center gap-1.5`}>
                            <Languages className="w-5 h-5" />
                            <span className="hidden sm:inline text-xs font-semibold uppercase">{i18n.language}</span>
                        </button>
                        {langMenuOpen && (
                            <div className={`${menuBox} w-36 p-1`}>
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.code)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${i18n.language === lang.code
                                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                    >
                                        {lang.label}
                                        {i18n.language === lang.code && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-px h-8 bg-gray-200 dark:bg-white/10 hidden sm:block" />

                    {/* User */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(o => !o)}
                            className="flex items-center gap-2.5 p-1 pe-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                                {user.initial}
                            </div>
                            <div className="hidden md:block text-start max-w-[160px]">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">{user.name}</p>
                                <p className="text-[11px] text-gray-500 leading-tight">{t('user_menu.role', 'Admin')}</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {userMenuOpen && (
                            <div className={`${menuBox} w-60 overflow-hidden`}>
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                <div className="p-1">
                                    <button
                                        onClick={() => { navigate('/dashboard/settings'); setUserMenuOpen(false); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg"
                                    >
                                        <Settings className="w-4 h-4" />
                                        {t('user_menu.settings', 'الإعدادات')}
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('user_menu.logout', 'تسجيل الخروج')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet context={{ myStores, fetchStores, selectedProject, setSelectedProject, user }} />
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute inset-y-0 start-0 w-72 bg-white dark:bg-[#0c0c0c] shadow-2xl">
                        <SidebarContent
                            {...sidebarProps}
                            onNavigate={() => setSidebarOpen(false)}
                            onClose={() => setSidebarOpen(false)}
                        />
                    </aside>
                </div>
            )}
        </div>
    );
}
