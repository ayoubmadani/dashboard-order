import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, ArrowRight, RefreshCcw, Loader2 } from 'lucide-react';
import axios from 'axios';
import { baseURL } from "../../constents/const.";
import Cookies from 'js-cookie';


const OtpForgotPassword = () => {
    const { t } = useTranslation();
    const [otp, setOtp] = useState(new Array(5).fill(""));
    const [loading, setLoading] = useState(false); // إضافة حالة التحميل
    const [error, setError] = useState('');      // إضافة حالة الخطأ

    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, []);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // الانتقال للمربع التالي تلقائياً
        if (element.value !== "" && index < 4) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const isComplete = otp.every(val => val !== "");

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // تحويل مصفوفة الـ OTP إلى نص واحد
            const otpString = otp.join('');

            const response = await axios.post(baseURL + '/auth/verify-otp', {
                email,
                otp: +otpString // إرساله كنص
            });


            if (response.data.success) {
                Cookies.set('otp', otpString, {
                    expires: new Date(new Date().getTime() + 10 * 60 * 1000),
                    secure: true,
                    sameSite: 'strict'
                });
                // إذا كان التحقق لتفعيل الحساب بعد التسجيل:
                navigate('/auth/new-password?email='+email);

                // أما إذا كان لنسيان كلمة المرور، فالتوجيه يكون لصفحة كلمة المرور الجديدة:
                // navigate(`/auth/new-password?email=${email}&otp=${otpString}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Code incorrect أو انتهت صلاحيته');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[380px] mx-auto transition-all duration-300">
            <div className="flex justify-center mb-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-zinc-900 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-zinc-800">
                    <ShieldCheck className="w-6 h-6" />
                </div>
            </div>

            <h1 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-1">
                Code de Vérification
            </h1>
            <p className="text-gray-500 text-sm text-center mb-4">
                Entrez le code envoyé à <br />
                <span className="text-indigo-600 font-semibold">{email}</span>
            </p>

            {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-500 text-xs rounded-xl border border-red-100 text-center font-bold">
                    {error}
                </div>
            )}

            <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="flex justify-center gap-3" dir="ltr">
                    {otp.map((data, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength="1"
                            inputMode="numeric"
                            ref={(el) => (inputRefs.current[index] = el)}
                            value={data}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-12 h-14 text-center text-2xl font-black bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-700 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-gray-900 dark:text-white shadow-sm"
                        />
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={!isComplete || loading}
                    className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg
                        ${isComplete && !loading
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                            <span>Vérifier le Code</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="text-center mt-10">
                <button
                    type="button"
                    onClick={() => {/* استدعاء دالة resend-otp */ }}
                    className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-2 mx-auto">
                    <RefreshCcw size={16} /> Renvoyer le Code
                </button>
                <Link to="/auth/login" className="block mt-6 text-gray-400 text-xs font-bold hover:text-indigo-600">
                    Retour à la Connexion
                </Link>
            </div>
        </div>
    );
};

export default OtpForgotPassword;