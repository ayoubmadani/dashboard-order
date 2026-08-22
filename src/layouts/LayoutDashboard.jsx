import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Home, Settings, BarChart3, Menu, X, ChevronDown,
    Search, Bell, Store, Box, Layers, ShoppingCart, Truck,
    LogOut, Sun, Moon, Sparkles, User,
    Palette, Wallet, Code2
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { getAccessToken, removeAccessToken } from '../services/access-token';
import { baseURL } from '../constents/const.';
import { Globe } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { MessageSquareText } from 'lucide-react';
import { LayoutTemplate } from 'lucide-react';

export default function LayoutDashboard() {
    const { t, i18n } = useTranslation('translation', { keyPrefix: 'layout' });
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
    const [myStores, setMyStores] = useState([]);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState({ name: '...', initial: '..', email: '' });

    const userDropdownRef = useRef(null);
    const isRtl = i18n.language === 'ar';

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
            const token = getAccessToken()
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
                    navigate('/auth/login');
                }
            }
        };
        verifyAndFetchUser();
    }, [navigate]);

    useEffect(() => {
        const handleMouseUp = (event) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) setUserDropdownOpen(false);
        };
        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
    }, []);

    const handleLogout = () => {
        removeAccessToken();
        navigate('/auth/login');
    };

    const [selectedProject, setSelectedProject] = useState(null);

    const navigation = [
        { name: t('nav.home', 'الرئيسية'), href: '/dashboard', icon: Home, color: '#10b981' },
        { name: t('nav.stores', 'المتجر'), href: '/dashboard/store', icon: Store, color: '#0ea5e9' },
        { name: t('nav.domain', 'الدومين'), href: '/dashboard/domain', icon: Globe, color: '#64748b' }, { name: t('nav.theme', 'الثيم'), href: '/dashboard/theme', icon: Palette, color: '#8b5cf6' },
        { name: t('nav.pixels', 'بيكسل'), href: '/dashboard/pixels', icon: Code2, color: '#6366f1' },
        { name: t('nav.categories', 'التصنيفات'), href: '/dashboard/category', icon: Layers, color: '#f59e0b' },
        { name: t('nav.products', 'المنتجات'), href: '/dashboard/products', icon: Box, color: '#f43f5e' },
        { name: t('nav.editor', 'محرر الصفحات'), href: '/dashboard/landing-pages', icon: LayoutTemplate, color: '#14b8a6' },
        { name: t('nav.orders', 'الطلبات'), href: '/dashboard/orders', icon: ShoppingCart, color: '#f97316' },
        { name: t('nav.shipping', 'الشحن'), href: '/dashboard/shipping', icon: Truck, color: '#06b6d4' },
        { name: t('nav.wallet', 'المحفظة'), href: '/dashboard/wallet', icon: Wallet, color: '#22c55e' },
        { name: t('nav.analytics', 'التحليلات'), href: '/dashboard/analytics', icon: BarChart3, color: '#d946ef' },
        { name: t('nav.messages', 'الرسائل'), href: '/dashboard/messages', icon: MessageSquareText, color: '#0000ff' },
        { name: t('nav.settings', 'الإعدادات'), href: '/dashboard/settings', icon: Settings, color: '#64748b' },

    ];

    const fetchStores = useCallback(async () => {
        try {
            const token = getAccessToken();
            const response = await axios.get(`${baseURL}/stores/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const dataStores = response.data.data;
            // ينتقل إلى dashboard عادي، سواء كان لدى المستخدم متجر أو لا
            if (response.data.success) {
                if (dataStores.length > 0) {
                    if (!localStorage.getItem('storeId')) localStorage.setItem('storeId', dataStores[0].id);
                    else {
                        const getStore = dataStores.find(s => s.id == localStorage.getItem('storeId'));
                        if (!getStore) localStorage.setItem('storeId', dataStores[0].id);
                    }
                } else {
                    // آخر متجر تم حذفه — لا تترك storeId قديم في localStorage
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

    const getStoreGradient = (name) => {
        const gradients = ['from-emerald-400 to-teal-500', 'from-blue-400 to-indigo-500', 'from-violet-400 to-purple-500', 'from-orange-400 to-pink-500'];
        return gradients[name ? name.charCodeAt(0) % gradients.length : 0];
    };

    const StoreSelector = () => (
        <div className="flex items-center gap-2 p-2 mx-3 my-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedProject ? getStoreGradient(selectedProject.name) : 'from-gray-400 to-gray-500'} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                {selectedProject?.name ? selectedProject.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t('nav.current_store', 'المتجر الحالي')}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                    {selectedProject?.name || '—'}
                </p>
            </div>
        </div>
    );

    const Navigation = ({ isMobile }) => (
        <nav className={`flex-1 overflow-y-auto py-2 ${isMobile ? 'px-2' : 'px-2'} scrollbar-thin`}>
            <div className={`${isMobile ? 'px-3 mb-1' : 'px-3 mb-1'} text-[10px] font-bold text-gray-400 uppercase tracking-wider`}>
                {t('menu', 'القائمة')}
            </div>
            <div className="space-y-0.5">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(`${item.href}/`));
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => isMobile && setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <item.icon className="w-4 h-4 shrink-0" style={{ color: isActive ? item.color : undefined }} />
                            <span className="truncate">{item.name}</span>
                            {isActive && <div className="w-1 h-1 rounded-full bg-emerald-500 ml-auto" />}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b] text-sm" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Desktop Sidebar */}
            <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col ${isRtl ? 'right-0' : 'left-0'} bg-white dark:bg-[#0f0f10] border-${isRtl ? 'l' : 'r'} border-gray-200 dark:border-white/5`}>
                <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-200 dark:border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-md">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-bold text-gray-900 dark:text-white leading-none">MdStore</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider">Dashboard</span>
                    </div>
                </div>

                <StoreSelector />
                <Navigation />
            </aside>

            {/* Main Content */}
            <div className={`${isRtl ? 'lg:pr-64' : 'lg:pl-64'} min-h-screen flex flex-col`}>

                {/* Header */}
                <header className={`sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-white/95 dark:bg-[#0a0a0b]/95 border-b border-gray-200 dark:border-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/80`}>
                    <div className="flex items-center gap-3">
                        <button className="lg:hidden p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md">
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>

                        

                        <div className="w-px h-6 bg-gray-200 dark:border-white/10 mx-1" />

                        {/* User Dropdown */}
                        <div className="relative" ref={userDropdownRef}>
                            <button
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                                    {user.initial}
                                </div>
                                <div className="hidden sm:block text-right">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{user.name}</p>
                                    <p className="text-[10px] text-gray-500">Admin</p>
                                </div>
                                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {userDropdownOpen && (
                                <div className={`absolute top-full ${isRtl ? 'left-0' : 'right-0'} mt-2 w-56 bg-white dark:bg-[#1a1a1b] rounded-lg shadow-xl border border-gray-200 dark:border-white/10 z-50 overflow-hidden`}>
                                    <div className="p-3 border-b border-gray-100 dark:border-white/5">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    <div className="p-1.5">
                                        <button
                                            onClick={() => navigate('/dashboard/settings')}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            {t('user_menu.settings', 'الإعدادات')}
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors mt-0.5"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {t('user_menu.logout', 'تسجيل الخروج')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4">
                    <Outlet context={{ myStores, fetchStores, selectedProject, setSelectedProject, user }} />
                </main>
            </div>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className={`absolute inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-64 bg-white dark:bg-[#0f0f10] shadow-xl flex flex-col`}>
                        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">MdStore</span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <StoreSelector />
                        <Navigation isMobile={true} />
                    </div>
                </div>
            )}
        </div>
    );
}