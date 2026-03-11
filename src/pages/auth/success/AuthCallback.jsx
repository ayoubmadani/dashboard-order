import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { baseURL } from '../../../constents/const.'; // تأكد من صحة إملاء كلمة constants

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
                try {
                    // جلب بيانات المتجر للتأكد من وجود متجر للمستخدم
                    const response = await axios.get(`${baseURL}/stores/user/me`, {
                        headers: { Authorization: `Bearer ${tokenValue}` },
                    });

                    const stores = response.data.data;

                    // إذا لم يكن لدى المستخدم أي متجر، نوجهه لإنشاء متجر
                    if (!stores || stores.length === 0) {
                        console.log('No stores found, redirecting to create...');
                        // حفظ التوكن أولاً ليتمكن المستخدم من إنشاء متجر وهو مسجل الدخول
                        Cookies.set('access_token', tokenValue, { expires: 7, path: '/' });
                        navigate('/dashboard/stores/create-first');
                        return; 
                    }

                    // إذا كان لديه متجر، نكمل العملية بشكل طبيعي
                    console.log('Success: User has stores');
                    Cookies.set('access_token', tokenValue, { expires: 7, path: '/' });
                    navigate('/dashboard');

                } catch (error) {
                    console.error("Error fetching stores:", error);
                    // في حال فشل طلب الـ API، يفضل توجيه المستخدم لصفحة تسجيل الدخول أو إظهار خطأ
                    // navigate('/auth/login'); 
                }
            } else {
                console.error("Login failed or no token provided:", errorValue);
                // navigate('/auth/login');
            }
        };

        processAuth();
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
            <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-bold animate-pulse text-zinc-900 dark:text-white">
                جاري التحقق من الحساب...
            </p>
        </div>
    );
};

export default AuthCallback;