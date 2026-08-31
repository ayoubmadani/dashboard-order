import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Home, Settings, BarChart3, Menu, X, ChevronDown,
    Store, Box, Layers, ShoppingCart, Truck,
    LogOut, Sun, Moon, User, Palette, Wallet,
    Code2, Globe, MessageSquareText, LayoutTemplate, ChevronRight, Languages
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
        'from-amber-500 to-orange-600'
    ];
    return gradients[name ? name.charCodeAt(0) % gradients.length : 0];
};

const StoreSelector = ({ t, isRtl, selectedProject, storesCount, onClick }) => (
    <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
        className="flex items-center gap-2.5 mx-4 mb-4 px-3 py-2 rounded-2xl bg-gray-50/80 dark:bg-white/[0.04] border border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors"
        title={`${storesCount} ${t('nav.stores_count', 'متاجر')}`}
    >
        <div className={`w-7 h-7 shrink-0 rounded-full bg-gradient-to-br ${selectedProject ? getStoreGradient(selectedProject.name) : 'from-gray-400 to-gray-500'} flex items-center justify-center text-[11px] font-bold text-white`}>
            {selectedProject?.name ? selectedProject.name.charAt(0).toUpperCase() : 'S'}
        </div>
        <p className="flex-1 min-w-0 text-sm font-semibold text-gray-900 dark:text-white truncate">
            {selectedProject?.name || '—'}
        </p>
        <span className="shrink-0 text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
            {storesCount}
        </span>
        <ChevronRight className={`w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
    </div>
);

const Navigation = ({ navGroups, pathname, isMobile, onNavigate }) => (
    <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 px-3">
        {navGroups.map((group, groupIdx) => (
            <div key={group.title || `group-${groupIdx}`} className={groupIdx !== 0 ? 'mt-5' : ''}>
                {group.title && (
                    <div className="px-4 mb-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            {group.title}
                        </span>
                        <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                    </div>
                )}
                <div className="space-y-0.5 px-2">
                    {group.items.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => isMobile && onNavigate?.()}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive
                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm shadow-emerald-500/5'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-md transition-colors ${isActive
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                                }`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className="truncate flex-1">{item.name}</span>
                                {isActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 shrink-0" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        ))}
    </nav>
);

export default function LayoutDashboard() {
    const { t, i18n } = useTranslation('translation', { keyPrefix: 'layout' });
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
    const [myStores, setMyStores] = useState([]);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState({ name: '...', initial: '..', email: '' });

    const userDropdownRef = useRef(null);
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

    const dateLocales = { ar: 'ar-SA', en: 'en-US', fr: 'fr-FR' };

    // --- Effects (نفس الوظائف بدون تغيير) ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!getAccessToken() || sessionStorage.getItem('sub_init')) return;
        const initSub = async () => {
            try {
                const token = getAccessToken();
                await axios.post(`${baseURL}/user/init-sub`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                sessionStorage.setItem('sub_init', '1');
            } catch (error) {
                console.error('Error initializing sub:', error.response?.data || error.message);
            }
        };
        initSub();
    }, []);

    useEffect(() => {
        const verifyAndFetchUser = async () => {
            const token = getAccessToken();
            if (!token) { navigate('/auth/'); return; }
            try {
                const response = await axios.get(`${baseURL}/user/current-user`, {
                    headers: { "Authorization": `bearer ${token}` }
                });
                const currentUser = response.data;
                currentUser.name = currentUser.username;
                const initials = currentUser.name
                    ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : '??';
                setUser({ name: currentUser.name, initial: initials, email: currentUser.email || '' });
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
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target))
                setUserDropdownOpen(false);
            if (langMenuRef.current && !langMenuRef.current.contains(event.target))
                setLangMenuOpen(false);
        };
        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const handleLogout = () => {
        removeAccessToken();
        clearPlanCache();
        navigate('/auth/login');
    };

    const [selectedProject, setSelectedProject] = useState(null);

    // --- Navigation Groups (منظمة ومقسمة) ---
    const navGroups = [
        {
            title: null,
            items: [
                { name: t('nav.home', 'الرئيسية'), href: '/dashboard', icon: Home },
            ]
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
            ]
        },
        {
            title: t('nav.group_sales', 'المبيعات'),
            items: [
                { name: t('nav.orders', 'الطلبات'), href: '/dashboard/orders', icon: ShoppingCart },
                { name: t('nav.shipping', 'الشحن'), href: '/dashboard/shipping', icon: Truck },
                { name: t('nav.wallet', 'المحفظة'), href: '/dashboard/wallet', icon: Wallet },
            ]
        },
        {
            title: t('nav.group_analytics', 'التحليلات والدعم'),
            items: [
                { name: t('nav.analytics', 'التحليلات'), href: '/dashboard/analytics', icon: BarChart3 },
                { name: t('nav.messages', 'الرسائل'), href: '/dashboard/messages', icon: MessageSquareText },
            ]
        },
        {
            title: t('nav.group_system', 'النظام'),
            items: [
                { name: t('nav.settings', 'الإعدادات'), href: '/dashboard/settings', icon: Settings },
            ]
        }
    ];

    const fetchStores = useCallback(async () => {
        try {
            const token = getAccessToken();
            const response = await axios.get(`${baseURL}/stores/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const dataStores = response.data.data;
            if (response.data.success) {
                if (dataStores.length > 0) {
                    if (!localStorage.getItem('storeId')) 
                        localStorage.setItem('storeId', dataStores[0].id);
                    else {
                        const getStore = dataStores.find(s => s.id == localStorage.getItem('storeId'));
                        if (!getStore) localStorage.setItem('storeId', dataStores[0].id);
                    }
                } else {
                    localStorage.removeItem('storeId');
                }
                setMyStores(response.data.data || []);
            }
        } catch (err) { console.error('Error:', err); }
    }, [navigate]);

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

    const getPageTitle = () => {
        for (const group of navGroups) {
            for (const item of group.items) {
                const isActive = location.pathname === item.href ||
                    (item.href !== '/dashboard' && location.pathname.startsWith(`${item.href}/`));
                if (isActive) return item.name;
            }
        }
        return 'MdStore';
    };

    return (
        <div className="min-h-screen bg-gray-50/80 dark:bg-[#030303] text-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col ${isRtl ? 'right-0' : 'left-0'} bg-white dark:bg-[#0c0c0c] ${isRtl ? 'border-l' : 'border-r'} border-gray-200 dark:border-white/[0.06] shadow-sm shadow-gray-200/50 dark:shadow-none`}>
                <div className="pt-4">
                    <StoreSelector t={t} isRtl={isRtl} selectedProject={selectedProject} storesCount={myStores.length} onClick={() => navigate('/dashboard/settings/stores')} />
                </div>
                <Navigation navGroups={navGroups} pathname={location.pathname} />

                {/* Logo */}
                <div className="flex items-center gap-3 px-6 h-16 border-t border-gray-100 dark:border-white/[0.06]">
                    <img src="/logo.png" alt="MdStore" className="w-9 h-9 rounded-xl shadow-lg shadow-indigo-500/25" />
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight tracking-tight">MdStore</span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Dashboard</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`${isRtl ? 'lg:pr-72' : 'lg:pl-72'} min-h-screen flex flex-col`}>

                {/* Header */}
                <header className={`sticky top-0 z-40 transition-all duration-200 ${scrolled ? 'shadow-sm shadow-gray-200/50 dark:shadow-black/20' : ''}`}>
                    <div className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white/80 dark:bg-[#0c0c0c]/80 border-b border-gray-200 dark:border-white/[0.06] backdrop-blur-xl">
                        
                        {/* Left: Menu + Title */}
                        <div className="flex items-center gap-4">
                            <button 
                                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors" 
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div className="hidden sm:block">
                                <h1 className="text-base font-bold text-gray-900 dark:text-white">
                                    {getPageTitle()}
                                </h1>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {new Date().toLocaleDateString(dateLocales[i18n.language] || 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Right: Theme + Language + User */}
                        <div className="flex items-center gap-2 lg:gap-4">
                            {/* Theme Toggle */}
                            <button
                                onClick={() => setIsDark(!isDark)}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {/* Language Switcher */}
                            <div className="relative" ref={langMenuRef}>
                                <button
                                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                                    title={t('language.label', 'Language')}
                                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <Languages className="w-5 h-5" />
                                </button>

                                {langMenuOpen && (
                                    <div className={`absolute top-full ${isRtl ? 'left-0' : 'right-0'} mt-2 w-36 bg-white dark:bg-[#1a1a1c] rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/50 border border-gray-100 dark:border-white/10 z-50 overflow-hidden`}>
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => handleLanguageChange(lang.code)}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${i18n.language === lang.code
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="w-px h-8 bg-gray-200 dark:bg-white/10 hidden sm:block" />

                            {/* User Dropdown */}
                            <div className="relative" ref={userDropdownRef}>
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                                        {user.initial}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user.name}</p>
                                        <p className="text-[11px] text-gray-500 font-medium">{t('user_menu.role', 'Admin')}</p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {userDropdownOpen && (
                                    <div className={`absolute top-full ${isRtl ? 'left-0' : 'right-0'} mt-2 w-64 bg-white dark:bg-[#1a1a1c] rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/50 border border-gray-100 dark:border-white/10 z-50 overflow-hidden`}>
                                        <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                                                    {user.initial}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => { navigate('/dashboard/settings'); setUserDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                                            >
                                                <div className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg">
                                                    <Settings className="w-4 h-4" />
                                                </div>
                                                {t('user_menu.settings', 'الإعدادات')}
                                            </button>
                                            <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                                            >
                                                <div className="p-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                                                    <LogOut className="w-4 h-4" />
                                                </div>
                                                {t('user_menu.logout', 'تسجيل الخروج')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
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
                    <div className={`absolute inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-72 bg-white dark:bg-[#0c0c0c] shadow-2xl flex flex-col`}>
                        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100 dark:border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <img src="/logo.png" alt="MdStore" className="w-9 h-9 rounded-xl shadow-lg" />
                                <span className="text-lg font-bold text-gray-900 dark:text-white">MdStore</span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <StoreSelector t={t} isRtl={isRtl} selectedProject={selectedProject} storesCount={myStores.length} onClick={() => { navigate('/dashboard/settings/stores'); setSidebarOpen(false); }} />
                        <Navigation navGroups={navGroups} pathname={location.pathname} isMobile={true} onNavigate={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}