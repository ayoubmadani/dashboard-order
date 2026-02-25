import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Cookies from 'js-cookie';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();


    useEffect(() => {
        const processAuth = async () => {
            // 1. استخراج القيم من الرابط
            const tokenValue = searchParams.get('token');
            const errorValue = searchParams.get('error');

            // 2. إضافة تأخير لمدة 3 ثوانٍ (3000 مللي ثانية)
            await new Promise(resolve => setTimeout(resolve, 3000));

            if (tokenValue) {
                // 3. حفظ التوكن في الكوكيز
                Cookies.set('access_token', tokenValue, {
                    expires: 7,
                    path: '/'
                });

                // 4. التوجه للداشبورد
                navigate('/dashboard');
            } else {
                console.error("Login failed:", errorValue);
                navigate('/auth/login');
            }
        };

        processAuth();
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
            {/* يمكنك إضافة Spinner هنا لجعل الشكل أجمل */}
            <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-bold animate-pulse text-zinc-900 dark:text-white">
                جاري التحقق من الهوية، يرجى الانتظار...
            </p>
        </div>
    );
};

export default AuthCallback;