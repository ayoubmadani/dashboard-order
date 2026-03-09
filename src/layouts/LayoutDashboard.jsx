import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Home, Settings, BarChart3, Menu, X, ChevronDown,
    Search, Bell, Store, Box, Layers, ShoppingCart, Layout,
    Truck, LogOut, Sun, Moon, Sparkles, ChevronRight, Wallet, Palette
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { getAccessToken, removeAccessToken } from '../services/access-token';
import { baseURL } from '../constents/const.';

export default function LayoutDashboard() {
    const { t, i18n } = useTranslation('translation', { keyPrefix: 'layout' });
    const location = useLocation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
    const [myStores, setMyStores] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState({ name: '…', initial: '..', email: '' });

    const dropdownRef = useRef(null);
    const userDropdownRef = useRef(null);

    // ── Navigation items ──────────────────────
    const navigation = [
        { name: t('nav.home'), href: '/dashboard', icon: Home },
        { name: t('nav.stores'), href: '/dashboard/stores', icon: Store },
        { name: t('nav.theme'), href: '/dashboard/theme', icon: Palette },
        { name: t('nav.categories'), href: '/dashboard/category', icon: Layers },
        { name: t('nav.products'), href: '/dashboard/products', icon: Box },
        { name: t('nav.landing'), href: '/dashboard/landing-pages', icon: Layout },
        { name: t('nav.orders'), href: '/dashboard/orders', icon: ShoppingCart },
        { name: t('nav.shipping'), href: '/dashboard/shipping', icon: Truck },
        { name: t('nav.wallet'), href: '/dashboard/wallet', icon: Wallet },
        { name: t('nav.analytics'), href: '/dashboard/analytics', icon: BarChart3 },
        { name: t('nav.settings'), href: '/dashboard/settings', icon: Settings },
    ];

    // ── Theme ─────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = saved === 'dark' || (!saved && prefersDark);
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // ── Scroll detection ──────────────────────
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ── Auth + user fetch ─────────────────────
    useEffect(() => {
        const verify = async () => {
            const token = Cookies.get('access_token');
            if (!token) { navigate('/auth/'); return; }
            try {
                const { data } = await axios.get(`${baseURL}/user/current-user`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const name = data.username || '';
                const initial = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
                setUser({ name, initial, email: data.email || '' });
            } catch (err) {
                if (err.response?.status === 401) { removeAccessToken(); navigate('/auth/login'); }
            }
        };
        verify();
    }, [navigate]);

    // ── Close dropdowns on outside click ─────
    useEffect(() => {
        const onMouseUp = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProjectDropdownOpen(false);
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) setUserDropdownOpen(false);
        };
        document.addEventListener('mouseup', onMouseUp);
        return () => document.removeEventListener('mouseup', onMouseUp);
    }, []);

    // ── Stores fetch ──────────────────────────
    const fetchStores = async () => {
        try {
            const token = getAccessToken();
            const { data } = await axios.get(`${baseURL}/stores/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const list = data.data || [];
            if (list.length === 0) { navigate('/dashboard/stores/create-first'); return; }
            if (data.success) {
                const savedId = localStorage.getItem('storeId');
                const found = list.find(s => s.id === savedId);
                localStorage.setItem('storeId', found ? found.id : list[0].id);
                setMyStores(list);
            }
        } catch (err) {
            console.error('Error fetching stores:', err);
        }
    };

    useEffect(() => { fetchStores(); }, []);

    useEffect(() => {
        if (!myStores.length) return;
        const savedId = localStorage.getItem('storeId');
        const found = myStores.find(s => s.id?.toString() === savedId?.toString() || s._id?.toString() === savedId?.toString());
        setSelectedProject(found || myStores[0]);
    }, [myStores]);

    // ── Helpers ───────────────────────────────
    const handleLogout = () => { removeAccessToken(); navigate('/auth/login'); };

    const storeGradient = (name) => {
        const list = [
            'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600',
            'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-600',
            'from-pink-500 to-rose-600', 'from-indigo-500 to-blue-600',
        ];
        return list[(name?.charCodeAt(0) || 0) % list.length];
    };

    const isActive = (href) =>
        href === '/dashboard'
            ? location.pathname === href
            : location.pathname.startsWith(href);

    // ── Shared sidebar content ─────────────────
    const SidebarContent = ({ mobile = false }) => (
        <>
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-white/5">
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        MdStore
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Dashboard</span>
                </div>
                {mobile && (
                    <button onClick={() => setSidebarOpen(false)} className="ms-auto p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Store selector */}
            <div className="px-4 py-4 relative" ref={!mobile ? dropdownRef : undefined}>

                {/* Trigger button */}
                <button
                    onClick={() => setProjectDropdownOpen(v => !v)}
                    className="w-full group relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 hover:border-emerald-500/30 transition-all duration-300"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedProject ? storeGradient(selectedProject.name) : 'from-gray-400 to-gray-500'} flex items-center justify-center text-sm font-bold text-white shadow-lg shrink-0`}>
                            {selectedProject?.name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="flex-1 min-w-0 text-start">
                            <p className="text-[10px] text-gray-400 font-medium mb-0.5">{t('store_selector.current_store')}</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {selectedProject?.name || t('store_selector.select_store')}
                            </p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {/* Dropdown — desktop: absolute / mobile: inline */}
                {projectDropdownOpen && (
                    <div className={`${mobile
                            ? 'mt-2 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5'
                            : 'absolute top-full start-4 end-4 mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 dark:border-white/10 z-50'
                        } overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                        <div className="p-2 space-y-1">
                            {myStores.length > 0 ? myStores.map((store, idx) => (
                                <button
                                    key={store.id || idx}
                                    onClick={() => {
                                        localStorage.setItem('storeId', store.id);
                                        setSelectedProject(store);
                                        setProjectDropdownOpen(false);
                                        if (mobile) setSidebarOpen(false);
                                        navigate('/dashboard');
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${storeGradient(store.name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                                        {store.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium flex-1 text-start truncate">{store.name}</span>
                                    {selectedProject?.id === store.id && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                                </button>
                            )) : (
                                <p className="px-3 py-4 text-center text-sm text-gray-400">{t('store_selector.no_stores')}</p>
                            )}
                        </div>
                        <div className="border-t border-gray-100 dark:border-white/5 p-2">
                            <button
                                onClick={() => {
                                    setProjectDropdownOpen(false);
                                    if (mobile) setSidebarOpen(false);
                                    navigate('/dashboard/stores/create');
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors font-semibold"
                            >
                                <Store className="w-4 h-4" />
                                {t('store_selector.create_store')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Nav items */}
            <nav className={`flex-1 px-4 py-2 space-y-0.5 overflow-y-auto ${mobile ? 'h-[calc(100vh-220px)]' : ''}`}>
                <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {t('nav.menu_label')}
                </p>
                {navigation.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => mobile && setSidebarOpen(false)}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${active
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-500/10'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {active && (
                                <div className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-1 h-7 bg-emerald-500 rounded-full`} />
                            )}
                            <item.icon className={`w-5 h-5 transition-transform duration-200 shrink-0 ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
                            <span className="flex-1">{item.name}</span>
                            {active && <ChevronRight className={`w-4 h-4 opacity-40 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />}
                        </Link>
                    );
                })}
            </nav>
        </>
    );

    // ─────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────
    return (
        <div
            className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0b] font-sans transition-colors duration-300"
            dir={isRtl ? 'rtl' : 'ltr'}
        >

            {/* ── Desktop Sidebar ── */}
            <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} border-gray-200 dark:border-white/5 bg-white dark:bg-[#0f0f10] shadow-xl shadow-black/5 transition-all z-30`}>
                <SidebarContent />
            </aside>

            {/* ── Main area ── */}
            <div className={`${isRtl ? 'lg:pr-72' : 'lg:pl-72'} min-h-screen flex flex-col`}>

                {/* ── Header ── */}
                <header className={`sticky top-0 z-40 flex h-16 items-center justify-between px-4 lg:px-8 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-white/5' : 'bg-transparent'}`}>

                    {/* Mobile menu button */}
                    <button
                        className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Search */}
                    <div className="flex-1 max-w-md mx-4 hidden sm:block">
                        <div className="relative group">
                            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none ${isRtl ? 'right-3' : 'left-3'}`} />
                            <input
                                type="search"
                                placeholder={t('header.search_placeholder')}
                                className={`w-full bg-gray-100/50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-white/10 focus:border-emerald-500/30 rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-gray-900 dark:text-white placeholder:text-gray-400 transition-all outline-none`}
                            />
                        </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-1.5">

                        {/* Dark mode toggle */}
                        <button
                            onClick={() => setIsDark(v => !v)}
                            title={isDark ? t('header.light') : t('header.dark')}
                            className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="relative w-5 h-5">
                                <Sun className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300 ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                                <Moon className={`absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
                            </div>
                        </button>

                        {/* Notifications */}
                        <button
                            title={t('header.notifications')}
                            className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#0a0a0b]" />
                        </button>

                        <div className="w-px h-8 bg-gray-200 dark:bg-white/10 mx-1" />

                        {/* User menu */}
                        <div className="relative" ref={userDropdownRef}>
                            <button
                                onClick={() => setUserDropdownOpen(v => !v)}
                                className="flex items-center gap-2.5 p-1.5 ps-1.5 pe-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shrink-0">
                                    {user.initial}
                                </div>
                                <div className="hidden md:block text-start">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user.name}</p>
                                    <p className="text-[10px] text-gray-400">{t('user_menu.role')}</p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {userDropdownOpen && (
                                <div className={`absolute top-full ${isRtl ? 'left-0' : 'right-0'} mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 dark:border-white/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                                    <div className="p-4 border-b border-gray-100 dark:border-white/5">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => { setUserDropdownOpen(false); navigate('/dashboard/settings'); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            {t('user_menu.settings')}
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {t('user_menu.logout')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Page content ── */}
                <main className="flex-1 p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* ── Mobile sidebar overlay ── */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <div className={`absolute inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-80 bg-white dark:bg-[#0f0f10] shadow-2xl flex flex-col transition-transform duration-300`}>
                        <SidebarContent mobile />
                    </div>
                </div>
            )}
        </div>
    );
}