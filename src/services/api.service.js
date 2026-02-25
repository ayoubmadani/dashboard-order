import axios from 'axios';
import Cookies from 'js-cookie';
import { getAccessToken } from './access-token'; // تأكد أن الاسم متطابق مع 'token' داخل الملف

class ApiService {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL: baseURL || 'https://api.mdstore.dz/v1',
      headers: {
        'Content-Type': 'application/json',
        // أزلنا Authorization من هنا لأنه سيُضاف ديناميكياً في الـ Interceptor
      },
      withCredentials: true, 
    });

    // إضافة Interceptors لمعالجة التوكين عند كل طلب
    this.api.interceptors.request.use(
      (config) => {
        // نستخدم الدالة التي استوردتها لجلب التوكن
        const token = getAccessToken(); 
        
        if (token) {
          // إضافة كلمة Bearer بشكل صحيح
          config.headers.Authorization = `bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // إنترسبتور لمعالجة الأخطاء (مثل 401)
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          this.logout(); // نستخدم دالة الـ logout الخاصة بنا لتنظيف المتصفح
        }
        return Promise.reject(error);
      }
    );
  }

  // حفظ التوكن في الكوكيز
  setToken(token) {
    Cookies.set('token', token, { 
      expires: 7, 
      secure: true, 
      sameSite: 'strict' 
    });
  }

  // حذف التوكن
  logout() {
    Cookies.remove('token');
    // إذا كنت تستخدم React Router، يمكنك عمل redirect هنا
  }

  // --- عمليات CRUD (احترافية ومختصرة) ---

  async getAll(endpoint, params = {}) {
    const response = await this.api.get(endpoint, { params });
    return response.data;
  }

  async create(endpoint, data) {
    const response = await this.api.post(endpoint, data);
    return response.data;
  }

  // ... (getOne, update, delete)

  handleError(error) {
    const message = error.response?.data?.message || 'حدث خطأ غير متوقع';
    console.error('API Error:', message);
    throw error;
  }
}

export default new ApiService();