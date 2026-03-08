import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Home, Database, Settings, BarChart3, Menu, X, ChevronDown,
    Search, Bell, Store, Box, Layers, ShoppingCart, Layout, Truck, 
    LogOut, Sun, Moon, Sparkles, ChevronRight, User
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { getAccessToken, removeAccessToken } from '../services/access-token';
import { baseURL } from '../constents/const.';
import { Palette } from 'lucide-react';
import { Wallet } from 'lucide-react';

export default function LayoutDashboard() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
    const [myStores, setMyStores] = useState([]);
    const [scrolled, setScrolled] = useState(false);

    const [user, setUser] = useState({ name: '...', initial: '..', email: '' });

    const dropdownRef = useRef(null);
    const userDropdownRef = useRef(null);
    const isRtl = i18n.language === 'ar';

    // Theme management with system preference detection
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
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

    // Scroll detection for header styling
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // User authentication and data fetching
    useEffect(() => {
        const verifyAndFetchUser = async () => {
            const token = Cookies.get('access_token');
            if (!token) {
                navigate('/auth/');
                return;
            }
            try {
                const response = await axios.get(`${baseURL}/user/current-user`, {
                    headers: { "Authorization": `bearer ${token}` }
                });

                const currentUser = response.data;
                currentUser.name = currentUser.username;

                const initials = currentUser.name
                    ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : '??';

                setUser({
                    name: currentUser.name,
                    initial: initials,
                    email: currentUser.email || ''
                });
            } catch (error) {
                console.error("Auth Error:", error);
                if (error.response?.status === 401) {
                    removeAccessToken();
                    navigate('/auth/login');
                }
            }
        };
        verifyAndFetchUser();
    }, [navigate]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleMouseUp = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProjectDropdownOpen(false);
            }
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setUserDropdownOpen(false);
            }
        };
        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
    }, []);

    const handleLogout = () => {
        removeAccessToken();
        navigate('/auth/login');
    };

    const navigation = [
        { name: t('nav.home', 'الرئيسية'), href: '/dashboard', icon: Home },
        { name: t('dashboard.stores', 'المتاجر'), href: '/dashboard/stores', icon: Store },
        { name: t('dashboard.theme', 'Theme'), href: '/dashboard/theme', icon: Palette },
        { name: t('dashboard.categories', 'التصنيفات'), href: '/dashboard/category', icon: Layers },
        { name: t('dashboard.products', 'المنتجات'), href: '/dashboard/products', icon: Box },
        { name: t('dashboard.landing', 'صفحة الهبوط'), href: '/dashboard/landing-pages', icon: Layout },
        { name: t('dashboard.orders', 'الطلبات'), href: '/dashboard/orders', icon: ShoppingCart },
        { name: t('dashboard.shipping', 'أسعار الشحن'), href: '/dashboard/shipping', icon: Truck },
        { name: t('dashboard.Wallet', ' Wallet'), href: '/dashboard/Wallet', icon: Wallet },
        { name: t('dashboard.analytics', 'التحليلات'), href: '/dashboard/analytics', icon: BarChart3 },
        { name: t('dashboard.settings', 'الإعدادات'), href: '/dashboard/settings', icon: Settings },
    ];

    const [selectedProject, setSelectedProject] = useState(null);

    const fetchStores = async () => {
        try {
            const token = getAccessToken();
            const response = await axios.get(`${baseURL}/stores/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const dataStores = response.data.data;
            console.log(dataStores[0].id);
            

            if (dataStores.length === 0) {
                navigate('/dashboard/stores/create-first');
            }

            if (response.data.success) {
                if (!localStorage.getItem('storeId') || localStorage.getItem('storeId') === '') {
                    localStorage.setItem('storeId',dataStores[0].id)  
                }else{
                    const getStore = dataStores.find(s => s.id == localStorage.getItem('storeId'))
                    !getStore 
                        ? localStorage.setItem('storeId',dataStores[0].id)
                        : localStorage.setItem('storeId',getStore.id)
                }

                setMyStores(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching stores:', err);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        if (myStores && myStores.length > 0) {
            const savedStoreId = localStorage.getItem('storeId');
            if (savedStoreId) {
                const savedStore = myStores.find(s =>
                    (s.id?.toString() === savedStoreId.toString()) ||
                    (s._id?.toString() === savedStoreId.toString())
                );
                setSelectedProject(savedStore || myStores[0]);
            } else {
                setSelectedProject(myStores[0]);
            }
        }
    }, [myStores]);

    // Get gradient based on store name for visual variety
    const getStoreGradient = (name) => {
        const gradients = [
            'from-violet-500 to-purple-600',
            'from-blue-500 to-cyan-600',
            'from-emerald-500 to-teal-600',
            'from-orange-500 to-amber-600',
            'from-pink-500 to-rose-600',
            'from-indigo-500 to-blue-600',
        ];
        const index = name ? name.charCodeAt(0) % gradients.length : 0;
        return gradients[index];
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0b] font-sans transition-colors duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
            
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col ${isRtl ? 'right-0' : 'left-0'} bg-white dark:bg-[#0f0f10] border-${isRtl ? 'l' : 'r'} border-gray-200 dark:border-white/5 shadow-xl shadow-black/5 transition-all`}>
                
                {/* Logo Section */}
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
                </div>

                {/* Store Selector */}
                <div className="px-4 py-4 relative" ref={dropdownRef}>
                    <button
                        onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                        className="w-full group relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-300"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedProject ? getStoreGradient(selectedProject.name) : 'from-gray-400 to-gray-500'} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
                                {selectedProject?.name ? selectedProject.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-xs text-gray-400 font-medium mb-0.5">Current Store</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {selectedProject?.name || 'Select Store'}
                                </p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {projectDropdownOpen && (
                        <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-[#1a1a1b] rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 dark:border-white/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-2 space-y-1">
                                {myStores.length > 0 ? (
                                    myStores.map((store, idx) => (
                                        <button
                                            key={store.id || idx}
                                            onClick={() => {
                                                localStorage.setItem('storeId', store.id);
                                                setSelectedProject(store);
                                                setProjectDropdownOpen(false);
                                                navigate('/dashboard/stores');
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                                        >
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getStoreGradient(store.name)} flex items-center justify-center text-xs font-bold text-white`}>
                                                {store.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium flex-1 text-left">{store.name}</span>
                                            {selectedProject?.id === store.id && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-center text-sm text-gray-400">
                                        No stores available
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-gray-100 dark:border-white/5 p-2">
                                <button 
                                    onClick={() => navigate('/dashboard/stores/create')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors font-medium"
                                >
                                    <Store className="w-4 h-4" />
                                    Create New Store
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Menu
                    </div>
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href || 
                            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                        
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${isActive
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {isActive && (
                                    <div className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-full`} />
                                )}
                                <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className="relative z-10">{item.name}</span>
                                {isActive && (
                                    <ChevronRight className={`w-4 h-4 ml-auto opacity-50 ${isRtl ? 'rotate-180' : ''}`} />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                {/* <div className="p-4 border-t border-gray-100 dark:border-white/5">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white/10 dark:to-white/5 rounded-2xl p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
                        <h4 className="text-white font-semibold text-sm mb-1 relative z-10">Pro Plan</h4>
                        <p className="text-gray-300 text-xs mb-3 relative z-10">Get more features</p>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors relative z-10">
                            Upgrade Now
                        </button>
                    </div>
                </div> */}
            </aside>

            {/* Main Content Area */}
            <div className={`${isRtl ? 'lg:pr-72' : 'lg:pl-72'} min-h-screen flex flex-col`}>
                
                {/* Header */}
                <header className={`sticky top-0 z-40 flex h-16 items-center justify-between px-4 lg:px-8 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
                    
                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-md mx-4 hidden sm:block">
                        <div className="relative group">
                            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors ${isRtl ? 'right-3' : 'left-3'} group-focus-within:text-emerald-500`} />
                            <input
                                type="search"
                                placeholder={t('common.search', 'Search anything...')}
                                className={`w-full bg-gray-100/50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-white/5 focus:border-emerald-500/30 rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-gray-900 dark:text-white placeholder:text-gray-400 transition-all outline-none`}
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <div className="relative w-5 h-5">
                                <Sun className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300 ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                                <Moon className={`absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
                            </div>
                        </button>

                        {/* Notifications */}
                        <button className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#0a0a0b]" />
                        </button>

                        <div className="w-px h-8 bg-gray-200 dark:border-white/10 mx-1" />

                        {/* User Menu */}
                        <div className="relative" ref={userDropdownRef}>
                            <button 
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                    {user.initial}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user.name}</p>
                                    <p className="text-xs text-gray-400">Admin</p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* User Dropdown */}
                            {userDropdownOpen && (
                                <div className={`absolute top-full ${isRtl ? 'left-0' : 'right-0'} mt-2 w-64 bg-white dark:bg-[#1a1a1b] rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 dark:border-white/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                                    <div className="p-4 border-b border-gray-100 dark:border-white/5">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button 
                                            onClick={() => navigate('/dashboard/settings')}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </button>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors mt-1"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => setSidebarOpen(false)} 
                    />
                    <div className={`absolute inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-80 bg-white dark:bg-[#0f0f10] shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'}`}>
                        
                        {/* Mobile Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">MdStore</span>
                            </div>
                            <button 
                                onClick={() => setSidebarOpen(false)}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mobile Store Selector */}
                        <div className="p-4 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedProject ? getStoreGradient(selectedProject.name) : 'from-gray-400 to-gray-500'} flex items-center justify-center text-sm font-bold text-white`}>
                                    {selectedProject?.name?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400">Current Store</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedProject?.name || 'No Store'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Navigation */}
                        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href || 
                                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}