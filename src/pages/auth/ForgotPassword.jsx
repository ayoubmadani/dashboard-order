import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, KeyRound, ArrowRight, ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';
import axios from "axios";
import { baseURL } from "../../constents/const.";

const ForgotPassword = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.language === 'ar';

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Added loading state

    const handleSubmit = async (e) => { // Added async
        e.preventDefault();
        
        if (!email || email.trim() === '') {
            setError(t('auth.email_required', 'Email is required'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await axios.post(`${baseURL}/auth/forgot-password`, { email }); // Added await

            // Axios doesn't use res.ok - check status or just catch errors
            if (res.status === 200 || res.status === 201) {
                navigate('/auth/otp-forgot-password?email='+email);
            }
        } catch (error) {
            // Better error handling
            const errorMessage = error.response?.data?.message 
                || error.message 
                || t('auth.generic_error', 'Something went wrong');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[380px] mx-auto transition-colors duration-300">
            {/* Key Icon */}
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-sm border border-amber-100/50 dark:border-amber-500/20">
                    <KeyRound className="w-8 h-8" />
                </div>
            </div>

            <h1 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-2">
                {t('auth.forgot_password_title', 'نسيت كلمة المرور؟')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-8 px-2 leading-relaxed">
                {t('auth.forgot_password_desc', 'أدخل بريدك الإلكتروني لإرسال رمز التحقق المكون من 5 أرقام')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Email Field - NOW PROPERLY CONNECTED */}
                <div className="relative group">
                    <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none`}>
                        <Mail className="w-4 h-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                    </div>
                    <input
                        type="email"
                        value={email} // ADDED
                        onChange={(e) => setEmail(e.target.value)} // ADDED
                        placeholder={t('auth.email_placeholder', 'البريد الإلكتروني')}
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-zinc-950 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all text-sm text-gray-900 dark:text-white`}
                        required
                        disabled={loading} // Disable while loading
                    />
                </div>

                {/* Submit Button - WITH LOADING STATE */}
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 shadow-xl shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 text-sm group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <span>{loading ? t('auth.sending', 'جاري الإرسال...') : t('auth.send_code_btn', 'إرسال كود التحقق')}</span>
                    {!loading && (isRtl ? 
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> : 
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    )}
                </button>
            </form>

            {/* Back to Login */}
            <div className="text-center mt-10">
                <Link 
                    to="/auth" 
                    className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 hover:text-brand-primary dark:hover:text-brand-primary transition-colors font-bold group"
                >
                    {isRtl ? 
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" /> : 
                        <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    }
                    {t('auth.back_to_login', 'العودة لتسجيل الدخول')}
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;