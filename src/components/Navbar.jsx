import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown, Check, Sun, Moon, Menu, X } from 'lucide-react';

export default function NavBar() {
    const { t, i18n } = useTranslation();
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const dropdownRef = useRef(null);
    const isRtl = i18n.language === 'ar';

    useEffect(() => {
        const savedMode = localStorage.getItem('theme');
        if (savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                closeMobileMenu();
                setIsLangOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isMobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMobileOpen]);

    const closeMobileMenu = () => {
        setIsMobileOpen(false);
        setIsMobileLangOpen(false);
    };

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
        setIsMobileLangOpen(false);
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
    const navLinks = ['home', 'about', 'contact', 'plan'];

    return (
        <>
            <nav className="w-full h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-5 md:px-8 sticky top-0 z-50 transition-colors duration-300">

                {/* الشعار */}
                <Link dir="ltr" to="/" className="flex items-center gap-0.5 group" onClick={closeMobileMenu}>
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform">
                        <span className="text-white font-bold text-lg">MD</span>
                    </div>
                    <span className="text-xl font-black text-gray-800 dark:text-white tracking-tighter italic">Store</span>
                </Link>

                {/* روابط Desktop */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((item) => (
                        <Link
                            key={item}
                            to={item === 'home' ? '/' : `/${item}`}
                            className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
                        >
                            {t(`nav.${item}`)}
                        </Link>
                    ))}
                </div>

                {/* أزرار Desktop */}
                <div className="hidden md:flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-amber-400 hover:scale-110 active:scale-95 transition-all"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1"></div>

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
                            <div className={`absolute mt-2 w-40 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-200 ${isRtl ? 'left-0' : 'right-0'}`}>
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

                {/* زر فتح المنيو - Mobile فقط */}
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="md:hidden p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
                    aria-label="Toggle menu"
                >
                    {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </nav>

            {/* Overlay */}
            {isMobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Mobile Drawer */}
            <div
                className={`md:hidden fixed top-20 left-0 right-0 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 z-40 transition-all duration-300 ease-in-out shadow-2xl ${
                    isMobileOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
            >
                <div className="flex flex-col px-5 py-4 gap-1">

                    {/* روابط التنقل */}
                    {navLinks.map((item) => (
                        <Link
                            key={item}
                            to={item === 'home' ? '/' : `/${item}`}
                            onClick={closeMobileMenu}
                            className="flex items-center px-4 py-3.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors text-base"
                        >
                            {t(`nav.${item}`)}
                        </Link>
                    ))}

                    {/* فاصل */}
                    <div className="h-px bg-gray-100 dark:bg-zinc-800 my-2" />

                    {/* Dark Mode + اللغة في صف واحد */}
                    <div className="flex items-center gap-3">

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-3 flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-amber-400 transition-all active:scale-95"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                                {isDarkMode ? t('nav.light_mode', 'فاتح') : t('nav.dark_mode', 'داكن')}
                            </span>
                        </button>

                        {/* Language Selector Mobile - state منفصل */}
                        <div className="relative flex-1">
                            <button
                                onClick={() => setIsMobileLangOpen(!isMobileLangOpen)}
                                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 font-bold text-sm transition-all active:scale-95"
                            >
                                <div className="flex items-center gap-2">
                                    <Languages className="w-4 h-4 text-indigo-600" />
                                    <span className="uppercase tracking-wider">{currentLang.code}</span>
                                </div>
                                <ChevronDown className={`w-3 h-3 transition-transform ${isMobileLangOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isMobileLangOpen && (
                                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl py-1.5 z-50">
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
                    </div>

                    {/* زر تسجيل الدخول */}
                    <Link
                        to="/auth"
                        onClick={closeMobileMenu}
                        className="mt-1 w-full text-center py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-lg shadow-indigo-100 dark:shadow-none text-sm"
                    >
                        {t('auth.login_btn', 'تسجيل الدخول')}
                    </Link>
                </div>
            </div>
        </>
    );
}