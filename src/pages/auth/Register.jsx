import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, User, ArrowRight, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import CustomBtnGoogleProvider from "../../components/custom-btn-google-provider";
import axios from "axios";
import { baseURL } from "../../constents/const.";

const Register = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.language === 'ar';

    // الحالات (States)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${baseURL}/auth/register`, {
                username: formData.name, // تأكد من مطابقة الأسماء لما يتوقعه الخادم
                email: formData.email,
                password: formData.password
            });

            console.log(response);
            

            if (response.data.success) {
                // التوجيه لصفحة التحقق من الكود (OTP) مع إرسال البريد في الرابط
                navigate(`/auth/otp?email=${formData.email}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('auth.error_occurred', 'حدث خطأ أثناء التسجيل'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[400px] mx-auto transition-colors duration-300">
            {/* الأيقونة العلوية */}
            <div className="flex justify-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-brand-primary to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20 group hover:rotate-6 transition-transform">
                    <Sparkles className="w-7 h-7 text-white" />
                </div>
            </div>

            <h1 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-1">
                {t('auth.register_title', 'إنشاء حساب')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-8">
                {t('auth.register_desc', 'ابدأ رحلتك معنا اليوم')}
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-500 text-xs rounded-xl border border-red-100 dark:border-red-500/20 text-center font-bold">
                    {error}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* الحقل: الاسم الكامل */}
                <div className="relative group">
                    <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 flex items-center pointer-events-none`}>
                        <User className="w-4 h-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                    </div>
                    <input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('auth.name_placeholder', 'الاسم الكامل')}
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-zinc-950 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all text-sm text-gray-900 dark:text-white`}
                        required
                    />
                </div>

                {/* الحقل: البريد الإلكتروني */}
                <div className="relative group">
                    <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 flex items-center pointer-events-none`}>
                        <Mail className="w-4 h-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                    </div>
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('auth.email_placeholder', 'البريد الإلكتروني')}
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-zinc-950 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all text-sm text-gray-900 dark:text-white`}
                        required
                    />
                </div>

                {/* الحقل: كلمة المرور */}
                <div className="relative group">
                    <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 flex items-center pointer-events-none`}>
                        <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                    </div>
                    <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={t('auth.password_placeholder', 'كلمة المرور')}
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-zinc-950 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all text-sm text-gray-900 dark:text-white`}
                        required
                        minLength={8}
                    />
                </div>

                {/* زر التسجيل */}
                <button 
                    disabled={loading}
                    className="w-full py-3.5 bg-brand-primary text-white rounded-xl font-black hover:bg-brand-primary/90 shadow-xl shadow-brand-primary/10 transition-all flex items-center justify-center gap-2 text-sm mt-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <span>{t('auth.register_btn_submit', 'إنشاء الحساب')}</span>
                            {isRtl ? 
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> : 
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            }
                        </>
                    )}
                </button>

                {/* الفاصل */}
                <div className="relative flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800"></div>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">
                        {t('common.or', 'أو عبر')}
                    </span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800"></div>
                </div>

                {/* زر جوجل */}
                <CustomBtnGoogleProvider />
            </form>

            {/* التحويل لتسجيل الدخول */}
            <p className="text-center mt-8 text-xs text-gray-500 dark:text-zinc-500">
                {t('auth.have_account', 'لديك حساب؟')}{' '}
                <Link to="/auth" className="text-brand-primary hover:underline font-black transition-colors">
                    {t('auth.login_btn', 'تسجيل الدخول')}
                </Link>
            </p>
        </div>
    );
};

export default Register;