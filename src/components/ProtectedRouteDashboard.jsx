import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie'; // أو localStorage حسب مكان تخزينك للتوكن

const ProtectedRouteDashboard = () => {
    // جلب التوكن من الكوكيز أو التخزين المحلي
    const token = Cookies.get('access_token');

    // إذا لم يوجد توكن، يتم تحويل المستخدم لصفحة تسجيل الدخول
    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    // إذا وجد التوكن، يتم عرض المكونات الداخلية (مثل Dashboard)
    return <Outlet />;
};

export default ProtectedRouteDashboard;