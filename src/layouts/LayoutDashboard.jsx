import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Home, Settings, BarChart3, ChevronDown, Store, Box, Layers, ShoppingCart, Truck,
    LogOut, Sun, Moon, Palette, Wallet, Code2, Globe, MessageSquareText,
    LayoutTemplate, Languages, Check,
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

export default function LayoutDashboard() {
    const { t, i18n } = useTranslation('translation', { keyPrefix: 'layout' });
    const location = useLocation();
    const navigate = useNavigate();

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
    const [myStores, setMyStores] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState({ name: '...', initial: '..', email: '' });

    const userMenuRef = useRef(null);
    const langMenuRef = useRef(null);
    const isRtl = i18n.language === 'ar';

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
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

    const handleLogout = () => {
        removeAccessToken();
        clearPlanCache();
        navigate('/auth/login');
    };

    // --- Navigation ---
    const navGroups = [
        {
            key: 'home', title: t('nav.home', 'الرئيسية'), icon: Home,
            items: [{ name: t('nav.home', 'الرئيسية'), href: '/dashboard', icon: Home }],
        },
        {
            key: 'store', title: t('nav.group_store', 'إدارة المتجر'), icon: Store,
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
            key: 'sales', title: t('nav.group_sales', 'المبيعات'), icon: ShoppingCart,
            items: [
                { name: t('nav.orders', 'الطلبات'), href: '/dashboard/orders', icon: ShoppingCart },
                { name: t('nav.shipping', 'الشحن'), href: '/dashboard/shipping', icon: Truck },
                { name: t('nav.wallet', 'المحفظة'), href: '/dashboard/wallet', icon: Wallet },
            ],
        },
        {
            key: 'analytics', title: t('nav.group_analytics', 'التحليلات والدعم'), icon: BarChart3,
            items: [
                { name: t('nav.analytics', 'التحليلات'), href: '/dashboard/analytics', icon: BarChart3 },
                { name: t('nav.messages', 'الرسائل'), href: '/dashboard/messages', icon: MessageSquareText },
            ],
        },
        {
            key: 'system', title: t('nav.settings', 'الإعدادات'), icon: Settings,
            items: [{ name: t('nav.settings', 'الإعدادات'), href: '/dashboard/settings', icon: Settings }],
        },
    ];

    const activeGroup =
        navGroups.find(g => g.items.some(i => isItemActive(location.pathname, i.href))) || navGroups[0];

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

    return (
        <div className="min-h-screen bg-gray-50/80 dark:bg-[#030303] text-sm" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Header */}
            <header className={`sticky top-0 z-40 bg-white/90 dark:bg-[#0c0c0c]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06] transition-shadow ${scrolled ? 'shadow-sm shadow-gray-200/50 dark:shadow-black/20' : ''}`}>

                {/* Row 1: logo + store + actions */}
                <div className="max-w-7xl mx-auto h-14 px-4 lg:px-8 flex items-center gap-3">
                    <Link to="/dashboard" className="shrink-0">
                        <img src="/logo.png" alt="MdStore" className="w-8 h-8 rounded-lg" />
                    </Link>

                    <span className="text-gray-300 dark:text-gray-700">/</span>

                    <button
                        onClick={() => navigate('/dashboard/settings/stores')}
                        className="flex items-center gap-2 min-w-0 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <div className={`w-6 h-6 shrink-0 rounded-full bg-gradient-to-br ${selectedProject ? getStoreGradient(selectedProject.name) : 'from-gray-400 to-gray-500'} flex items-center justify-center text-[10px] font-bold text-white`}>
                            {selectedProject?.name ? selectedProject.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[35vw] sm:max-w-[200px]">
                            {selectedProject?.name || '—'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 rounded-full px-1.5 py-0.5">
                            {myStores.length}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </button>

                    <div className="flex-1" />

                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <div className="relative" ref={langMenuRef}>
                        <button
                            onClick={() => setLangMenuOpen(!langMenuOpen)}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <Languages className="w-5 h-5" />
                        </button>
                        {langMenuOpen && (
                            <div className="absolute top-full end-0 mt-2 w-36 bg-white dark:bg-[#1a1a1c] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 p-1">
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.code)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${i18n.language === lang.code
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

                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white"
                        >
                            {user.initial}
                        </button>
                        {userMenuOpen && (
                            <div className="absolute top-full end-0 mt-2 w-60 bg-white dark:bg-[#1a1a1c] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden">
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
                </div>

                {/* Row 2: main sections */}
                <nav className="max-w-7xl mx-auto px-4 lg:px-8 flex gap-1 overflow-x-auto scrollbar-none">
                    {navGroups.map(group => {
                        const active = group.key === activeGroup.key;
                        return (
                            <Link
                                key={group.key}
                                to={group.items[0].href}
                                className={`relative flex items-center gap-2 px-3 py-3 whitespace-nowrap transition-colors ${active
                                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                            >
                                <group.icon className="w-4 h-4" />
                                {group.title}
                                {active && <span className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-emerald-500" />}
                            </Link>
                        );
                    })}
                </nav>
            </header>

            {/* Sub pages of active section */}
            {activeGroup.items.length > 1 && (
                <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                        {activeGroup.items.map(item => {
                            const active = isItemActive(location.pathname, item.href);
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full whitespace-nowrap border transition-colors ${active
                                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                                        : 'bg-white dark:bg-[#0c0c0c] border-gray-200 dark:border-white/[0.06] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Page Content */}
            <main className="max-w-7xl mx-auto p-4 lg:p-8">
                <Outlet context={{ myStores, fetchStores, selectedProject, setSelectedProject, user }} />
            </main>
        </div>
    );
}
