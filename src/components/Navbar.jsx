import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown, Check, Sun, Moon } from 'lucide-react';

export default function NavBar() {
    const { t, i18n } = useTranslation();
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false); // حالة الوضع الليلي
    const dropdownRef = useRef(null);

    // 1. إدارة الوضع الليلي (Dark Mode)
    useEffect(() => {
        // عند تحميل الصفحة، نتحقق من localStorage أو تفضيلات النظام
        const savedMode = localStorage.getItem('theme');
        if (savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const languages = [
        { code: 'ar', name: 'العربية' },
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' }
    ];

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
        localStorage.setItem('i18nextLng', lng);
        setIsLangOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsLangOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    return (
        <nav className="w-full h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-50 transition-colors duration-300">
            {/* الشعار */}
            <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform">
                    <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-black text-gray-800 dark:text-white tracking-tighter italic">MdStore</span>
            </Link>

            {/* الروابط */}
            <div className="hidden md:flex items-center gap-8">
                {['home', 'about', 'contact','plan'].map((item) => (
                    <Link key={item} to={item === 'home' ? '/' : `/${item}`} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors">
                        {t(`nav.${item}`)}
                    </Link>
                ))}
            </div>

            {/* الأزرار */}
            <div className="flex items-center gap-3">
                
                {/* زر تبديل الوضع (Dark/Light) */}
                <button 
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-amber-400 hover:scale-110 active:scale-95 transition-all"
                >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1"></div>

                {/* قائمة اختيار اللغة */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all text-gray-700 dark:text-gray-300 font-bold text-xs border border-gray-200 dark:border-zinc-800 active:scale-95"
                    >
                        <Languages className="w-4 h-4 text-indigo-600" />
                        <span className="uppercase tracking-wider">{currentLang.code}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isLangOpen && (
                        <div className={`absolute mt-2 w-40 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-200 ${i18n.language === 'ar' ? 'left-0' : 'right-0'}`}>
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${i18n.language === lang.code ? 'text-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                                >
                                    <span className="font-bold">{lang.name}</span>
                                    {i18n.language === lang.code && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Link
                    to="/auth"
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all text-sm"
                >
                    {t('auth.login_btn', 'تسجيل الدخول')}
                </Link>
            </div>
        </nav>
    );
}