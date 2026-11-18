import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie'; // أو localStorage حسب مكان تخزينك للتوكن

const ProtectedRouteAuth = () => {
    // جلب التوكن من الكوكيز أو التخزين المحلي
    const token = Cookies.get('access_token');

    // إذا لم يوجد توكن، يتم تحويل المستخدم لصفحة تسجيل الدخول
    // ?add=1: إضافة حساب آخر دون الخروج من الحالي (عدة حسابات)
    const adding = new URLSearchParams(window.location.search).get('add') === '1';
    if (token && !adding) {
        return <Navigate to="/dashboard" replace />;
    }

    // إذا وجد التوكن، يتم عرض المكونات الداخلية (مثل Dashboard)
    return <Outlet />;
};

export default ProtectedRouteAuth;