import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Cookies from 'js-cookie';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const processAuth = async () => {
            const tokenValue = searchParams.get('token');
            const errorValue = searchParams.get('error');

            // تأخير بسيط لضمان استقرار الحالة
            await new Promise(resolve => setTimeout(resolve, 500));

            if (tokenValue) {
                // أول شيء عند تسجيل الدخول: حذف storeId القديم (قد يخص حساب آخر)
                localStorage.removeItem('storeId');
                // ينتقل إلى dashboard دائماً، سواء كان لدى المستخدم متجر أو لا
                Cookies.set('access_token', tokenValue, { expires: 7, path: '/' });
                navigate('/dashboard');
            } else {
                console.error("Login failed or no token provided:", errorValue);
                // navigate('/auth/login');
            }
        };

        processAuth();
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white rounded-full animate-spin mb-4"></div>
        </div>
    );
};

export default AuthCallback;