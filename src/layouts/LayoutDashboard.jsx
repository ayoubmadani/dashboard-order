import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Home, Database, Settings, BarChart3, Menu, X, ChevronDown,
    Search, Bell, Store, Box, Layers, ShoppingCart, Layout, Truck, LogOut, Sun, Moon
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { getAccessToken, removeAccessToken } from '../services/access-token';
import { baseURL } from '../constents/const.';

export default function LayoutDashboard() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
    const [myStores, setMyStores] = useState(localStorage.getItem([]))

    // حالة المستخدم: تبدأ ببيانات مؤقتة حتى يتم الجلب
    const [user, setUser] = useState({ name: '...', initial: '..' });

    const dropdownRef = useRef(null);
    const isRtl = i18n.language === 'ar';

    // 1. إدارة تبديل الثيم (Dark/Light Mode)
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // 2. جلب بيانات المستخدم والتحقق من التوكن
    useEffect(() => {
        const verifyAndFetchUser = async () => {
            const URL = import.meta.env.REACT_APP_API_URL;
            const token = Cookies.get('access_token');

            if (!token) {
                navigate('/auth/');
                return;
            }

          


            try {
                const response = await axios.get(`http://localhost:7000/user/current-user`, {
                    headers: {
                        "Authorization": `bearer ${token}`
                    }
                });


                const currentUser = response.data;
                currentUser.name = currentUser.username;

                // استخراج الأحرف الأولى بشكل احترافي (مثال: "John Doe" -> "JD")
                const initials = currentUser.name
                    ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : '??';

                setUser({
                    name: currentUser.name,
                    initial: initials
                });

            } catch (error) {
                console.error("Auth Error:", error);
                // إذا انتهت الصلاحية أو حدث خطأ في التوكن، امسحه وحول المستخدم للوجين
                if (error.response?.status === 401) {
                    removeAccessToken();
                    navigate('/auth/login');
                }
            }
        };

        verifyAndFetchUser();
    }, [navigate]);

    // 3. إغلاق القوائم المنسدلة عند النقر خارجها
    useEffect(() => {
        const handleMouseUp = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProjectDropdownOpen(false);
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
        { name: t('dashboard.categories', 'التصنيفات'), href: '/dashboard/category', icon: Layers },
        { name: t('dashboard.products', 'المنتجات'), href: '/dashboard/products', icon: Box },
        { name: t('dashboard.landing', 'صفحة الهبوط'), href: '/dashboard/landing-pages', icon: Layout },
        { name: t('dashboard.orders', 'الطلبات'), href: '/dashboard/orders', icon: ShoppingCart },
        { name: t('dashboard.shipping', 'أسعار الشحن'), href: '/dashboard/shipping', icon: Truck },
        { name: t('dashboard.analytics', 'التحليلات'), href: '/dashboard/analytics', icon: BarChart3 },
        { name: t('dashboard.settings', 'الإعدادات'), href: '/dashboard/settings', icon: Settings }
    ];

    const [selectedProject, setSelectedProject] = useState();

    const fetchStores = async () => {
        try {

            const token = getAccessToken();
            const response = await axios.get(`${baseURL}/stores/user/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });




            if (response.data.success) {
                setMyStores(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching stores:', err);

        } finally {

        }
    }

    useEffect(()=>{
        
        fetchStores()
    },[])

    useEffect(() => {
    // ✅ أضفنا التحقق من أن myStores موجودة وليست null قبل قراءة length
    if (myStores && myStores.length > 0) {
        const savedStoreId = localStorage.getItem('storeId');

        if (savedStoreId) {
            // ملاحظة: تأكد هل المعرف في قاعدة بياناتك هو id أم _id
            const savedStore = myStores.find(s => 
                (s.id?.toString() === savedStoreId.toString()) || 
                (s._id?.toString() === savedStoreId.toString())
            );

            if (savedStore) {
                setSelectedProject(savedStore);
            } else {
                setSelectedProject(myStores[0]);
            }
        } else {
            setSelectedProject(myStores[0]);
        }
    }
}, [myStores]);// يعمل عندما تكتمل عملية جلب المتاجر


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] font-sans transition-colors duration-300" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Sidebar Desktop */}
            <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} border-zinc-800 bg-zinc-900 shadow-2xl transition-all`}>
                <div className="flex flex-col flex-grow overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-5 py-3 border-b border-zinc-800/50">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-[12px] font-black text-white">MD</span>
                        </div>
                        <span className={`${isRtl ? 'mr-2.5' : 'ml-2.5'} text-lg font-black text-white tracking-tight`}>
                            MdStore
                        </span>
                    </div>

                    {/* Project Selector */}
                    <div className="px-3 py-3 relative" ref={dropdownRef}>
                        <button
                            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                            className="w-full flex items-center justify-between px-2.5 py-2 bg-zinc-800/40 text-[13px] text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all border border-white/5"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-[9px] font-black text-white uppercase shadow-sm shrink-0">
                                    {/* ✅ الحماية باستخدام علامة الاستفهام ?. والقيمة البديلة */}
                                    {selectedProject?.short || (selectedProject?.name ? selectedProject.name.charAt(0) : '...')}
                                </div>
                                <span className="font-bold truncate max-w-[100px]">
                                    {/* ✅ عرض اسم المشروع أو كلمة "تحميل" مؤقتاً */}
                                    {selectedProject?.name || t('common.loading', 'جاري التحميل...')}
                                </span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {projectDropdownOpen && (
                            <div className="absolute top-14 left-3 right-3 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                                {myStores && myStores.length > 0 ? (
                                    myStores.map(store => (
                                        <button
                                            key={store.id} // تأكد أن store.id موجود، أو استخدم store._id حسب السيرفر
                                            onClick={() => {
                                                localStorage.setItem('storeId', store.id)
                                                setSelectedProject(store);
                                                setProjectDropdownOpen(false);
                                            }}
                                            className="w-full px-3 py-2 text-[13px] text-zinc-300 hover:bg-zinc-700/50 flex items-center gap-2.5 transition-colors"
                                        >
                                            {/* المربع الصغير: يعرض أول حرف من اسم المتجر */}
                                            <div className="w-5 h-5 bg-zinc-700 rounded flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase">
                                                {store.name ? store.name.charAt(0) : 'S'}
                                            </div>

                                            {/* اسم المتجر الكامل: تم تغيير project.name إلى store.name */}
                                            <span className="font-medium">{store.name}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-zinc-500 text-[12px] text-center">
                                        لا توجد متاجر متاحة
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 px-3 py-1.5 space-y-0.5">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={`group flex items-center px-2.5 py-2.5 text-[13px] font-bold rounded-lg transition-all ${isActive
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                                        }`}
                                >
                                    <item.icon className={`${isRtl ? 'ml-2.5' : 'mr-2.5'} h-4.5 w-4.5 flex-shrink-0 transition-transform group-hover:scale-105`} />
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className={`${isRtl ? 'lg:pr-64' : 'lg:pl-64'} flex flex-col flex-1`}>
                <header className="sticky top-0 z-40 flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 lg:px-8 transition-colors">
                    <button
                        className="text-zinc-500 lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="flex flex-1 items-center max-w-xl mx-4">
                        <div className="w-full relative group">
                            <div className={`pointer-events-none absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}>
                                <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                className={`block w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 py-2 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none placeholder:text-zinc-400`}
                                placeholder={t('common.search', 'البحث...')}
                                type="search"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2.5 text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
                        >
                            {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
                        </button>

                        <button className="relative rounded-xl p-2.5 text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all active:scale-90">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
                        </button>

                        <div className="h-8 w-px bg-gray-200 dark:bg-zinc-800 mx-1 sm:mx-2"></div>

                        {/* User Profile Info */}
                        <div className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all group">
                            <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-md group-hover:bg-emerald-600 transition-colors">
                                {user.initial}
                            </div>
                            <span className="hidden sm:inline text-sm font-bold text-gray-700 dark:text-zinc-300">
                                {user.name}
                            </span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center p-2.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all group active:scale-90"
                            title={t('common.logout')}
                        >
                            <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </header>

                <main className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
                    <div className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} flex w-72 flex-col bg-zinc-900 shadow-2xl animate-in ${isRtl ? 'slide-in-from-right' : 'slide-in-from-left'} duration-300`}>
                        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                    <Database className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-black text-white tracking-tighter uppercase">MdStore</span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                            {navigation.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className="flex items-center px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                                >
                                    <item.icon className={`${isRtl ? 'ml-4' : 'mr-4'} h-5 w-5`} />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}