import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// استيراد المكونات
import { Otp, Register, NewPassword, Login, ForgotPassword } from './pages/auth/imports';
import LayoutAuth from './layouts/LayoutAuth';
import LayoutSite from './layouts/LayoutSite';
import HomeSite from './pages/site/home';
import About from './pages/site/about';
import Contact from './pages/site/contact';
import Privacy from './pages/site/Privacy';
import Terms from './pages/site/Terms';
import Cookies from './pages/site/Cookies';
import LayoutDashboard from './layouts/LayoutDashboard';
import DashboardHome from './pages/dashboard/dashboard/DashboardHome';
import Categories from './pages/dashboard/categories/Categories';
import Products from './pages/dashboard/products/Products';
import Orders from './pages/dashboard/orders/Orders';
import Settings from './pages/dashboard/settings/Settings';
import Analytics from './pages/dashboard/analytics/Analytics';
import LandingPages from './pages/dashboard/landing-pages/LandingPages';
import Stores from './pages/dashboard/stores/Stores';
import CreateStore from './pages/dashboard/stores/Create'; // <-- استيراد صفحة الإنشاء الجديدة
import Shipping from './pages/dashboard/shipping/Shipping';
import Update from './pages/dashboard/stores/update';
import Show from './pages/dashboard/stores/Show';
import CreateProduct from './pages/dashboard/products/Create';
import FakeProductDetails from './pages/site/FakeProductDetails';
import ProtectedRouteDashboard from './components/ProtectedRouteDashboard';
import ProtectedRouteAuth from './components/ProtectedRouteAuth';
import AuthCallback from './pages/auth/success/AuthCallback';
import CreateCategory from './pages/dashboard/categories/CreateCategory';
import CreateLandingPage from './pages/dashboard/landing-pages/CreateLandingPage';
import OtpForgotPassword from './pages/auth/OtpForgotPassworde';
import EditProduct from './pages/dashboard/products/edit';
import ProductShow from './pages/dashboard/products/show';
import Theme from './pages/dashboard/theme/Theme';
import CreateFerstStore from './pages/dashboard/stores/Create-First';
import Wallet from './pages/dashboard/wallet/wallet';
import Plan from './pages/site/plan';
import Pixels from './pages/dashboard/pixels/pixels';
import UpdateLandingPage from './pages/dashboard/landing-pages/updateLandingPage';
import Domain from './pages/dashboard/domain/domain';
import Title from './halper/title';

const App = () => {
  const { i18n } = useTranslation();

function MyComponent() {
  useEffect(() => {
    // تغيير العنوان عند تحميل المكون
    document.title = "صفحتي الجديدة";
  }, []);

  return <h1>مرحباً بك في موقعي</h1>;
}

  // 1. منطق إدارة الوضع الليلي
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
    <Title title={"MD store"} />
      <Routes>
        {/* 1. قسم الموقع العام */}
        <Route path="/" element={<LayoutSite />}>
          <Route index element={<HomeSite />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="cookies" element={<Cookies />} />
          <Route path="plan" element={<Plan />} />


        </Route>

        <Route path="fake-product" element={<FakeProductDetails />} />

        {/* 2. قسم لوحة التحكم */}
        <Route element={<ProtectedRouteDashboard />}>
          <Route path="/dashboard" element={<LayoutDashboard />}>
            <Route index element={<DashboardHome />} />

            {/* مسارات المتاجر */}
            <Route path="stores">
              <Route index element={<Stores />} />
              <Route path="create" element={<CreateStore />} /> {/* <-- المسار: /dashboard/stores/create */}
              <Route path="create-first" element={<CreateFerstStore />} /> {/* <-- المسار: /dashboard/stores/create */}
              <Route path="update/:id" element={<Update />} /> {/* <-- المسار: /dashboard/stores/update/:id */}
              <Route path="show/:id" element={<Show />} /> {/* <-- المسار: /dashboard/stores/show/:id */}
            </Route>



            <Route path='pixels'  element={<Pixels />}/>
            <Route path='domain'  element={<Domain />}/>

            <Route path='theme'>
              <Route index element={<Theme />} />
            </Route>
          

            <Route path="category" >
              <Route index element={<Categories />} />
              <Route path='create' element={<CreateCategory />} />
            </Route>


            <Route path="products">
              <Route index element={<Products />} />
              <Route path="create" element={<CreateProduct />} />
              <Route path="edit/:id" element={<EditProduct />} />
              <Route path=":id" element={<ProductShow />} />

            </Route>

            <Route path='Wallet' element={<Wallet />} />


            <Route path="landing-pages"  >
              <Route index element={<LandingPages />} />
              <Route path='create' element={<CreateLandingPage />} />
              <Route path='edit/:id' element={<UpdateLandingPage />} />
            </Route>


            <Route path="orders">
              <Route index  element={<Orders />} />
            </Route>


            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="shipping" element={<Shipping />} />
          </Route>
        </Route>


        {/* 3. قسم التوثيق */}
        <Route element={<ProtectedRouteAuth />}>
          <Route path="/auth" element={<LayoutAuth />} >
            <Route index element={<Login />} />
            <Route path='login' element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="new-password" element={<NewPassword />} />
            <Route path="otp" element={<Otp />} />
            
            <Route path="otp-forgot-password" element={<OtpForgotPassword />} />
          </Route>
        </Route>

        <Route path="auth/callback" element={<AuthCallback />} />


      </Routes>
    </BrowserRouter>
  );
};

export default App;