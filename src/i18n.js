// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// --- ملفات اللغة العربية ---
import arAnalytics from './locales/ar/analytics.json';
import arAuth from './locales/ar/auth.json';
import arBuilder from './locales/ar/builder.json';
import arButtons from './locales/ar/buttons.json';
import arCategories from './locales/ar/categories.json';
import arCommon from './locales/ar/common.json';
import arDashboard from './locales/ar/dashboard.json';
import arDeleteModal from './locales/ar/deleteModal.json';
import arFields from './locales/ar/fields.json';
import arHeader from './locales/ar/header.json';
import arLanding from './locales/ar/landing.json';
import arLocations from './locales/ar/locations.json';
import arNav from './locales/ar/nav.json';
import arNiches from './locales/ar/niches.json';
import arNotifications from './locales/ar/notifications.json';
import arOrders from './locales/ar/orders.json';
import arPayment from './locales/ar/payment.json';
import arPerformance from './locales/ar/performance.json';
import arPlaceholders from './locales/ar/placeholders.json';
import arPreview from './locales/ar/preview.json';
import arProducts from './locales/ar/products.json';
import arSettings from './locales/ar/settings.json';
import arShipping from './locales/ar/shipping.json';
import arSidebar from './locales/ar/sidebar.json';
import arSteps from './locales/ar/steps.json';
import arStores from './locales/ar/stores.json';
import arSummary from './locales/ar/summary.json';
import arUpload from './locales/ar/upload.json';
import arValidation from './locales/ar/validation.json';
import arTheme from './locales/ar/theme.json';
import arWallet from './locales/ar/wallet.json';
import arLayout from './locales/ar/layout.json';
import arPixel from './locales/ar/pixel.json';
import arDomain from './locales/ar/domain.json';
import arImageModel from './locales/ar/image-mode.json';
import arMessage from './locales/ar/message.json';
import arEditor from './locales/ar/editor.json';


// --- ملفات اللغة الإنجليزية ---
import enAnalytics from './locales/en/analytics.json';
import enAuth from './locales/en/auth.json';
import enBuilder from './locales/en/builder.json';
import enButtons from './locales/en/buttons.json';
import enCategories from './locales/en/categories.json';
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enDeleteModal from './locales/en/deleteModal.json';
import enFields from './locales/en/fields.json';
import enHeader from './locales/en/header.json';
import enLanding from './locales/en/landing.json';
import enLocations from './locales/en/locations.json';
import enNav from './locales/en/nav.json';
import enNiches from './locales/en/niches.json';
import enNotifications from './locales/en/notifications.json';
import enOrders from './locales/en/orders.json';
import enPayment from './locales/en/payment.json';
import enPerformance from './locales/en/performance.json';
import enPlaceholders from './locales/en/placeholders.json';
import enPreview from './locales/en/preview.json';
import enProducts from './locales/en/products.json';
import enSettings from './locales/en/settings.json';
import enShipping from './locales/en/shipping.json';
import enSidebar from './locales/en/sidebar.json';
import enSteps from './locales/en/steps.json';
import enStores from './locales/en/stores.json';
import enSummary from './locales/en/summary.json';
import enUpload from './locales/en/upload.json';
import enValidation from './locales/en/validation.json';
import enTheme from './locales/en/theme.json';
import enWallet from './locales/en/wallet.json';
import enLayout from './locales/en/layout.json';
import enPixel from './locales/en/pixel.json';
import enDomain from './locales/en/domain.json';
import enImageModel from './locales/en/image-mode.json';
import enMessage from './locales/en/message.json';
import enEditor from './locales/en/editor.json';








// --- ملفات اللغة الفرنسية ---
import frAnalytics from './locales/fr/analytics.json';
import frAuth from './locales/fr/auth.json';
import frBuilder from './locales/fr/builder.json';
import frButtons from './locales/fr/buttons.json';
import frCategories from './locales/fr/categories.json';
import frCommon from './locales/fr/common.json';
import frDashboard from './locales/fr/dashboard.json';
import frDeleteModal from './locales/fr/deleteModal.json';
import frFields from './locales/fr/fields.json';
import frHeader from './locales/fr/header.json';
import frLanding from './locales/fr/landing.json';
import frLocations from './locales/fr/locations.json';
import frNav from './locales/fr/nav.json';
import frNiches from './locales/fr/niches.json';
import frNotifications from './locales/fr/notifications.json';
import frOrders from './locales/fr/orders.json';
import frPayment from './locales/fr/payment.json';
import frPerformance from './locales/fr/performance.json';
import frPlaceholders from './locales/fr/placeholders.json';
import frPreview from './locales/fr/preview.json';
import frProducts from './locales/fr/products.json';
import frSettings from './locales/fr/settings.json';
import frShipping from './locales/fr/shipping.json';
import frSidebar from './locales/fr/sidebar.json';
import frSteps from './locales/fr/steps.json';
import frStores from './locales/fr/stores.json';
import frSummary from './locales/fr/summary.json';
import frUpload from './locales/fr/upload.json';
import frValidation from './locales/fr/validation.json';
import frTheme from './locales/fr/theme.json';
import frWallet from './locales/fr/wallet.json';
import frLayout from './locales/fr/layout.json';
import frPixel from './locales/fr/pixel.json';
import frDomain from './locales/fr/domain.json';
import frImageModel from './locales/fr/image-mode.json';
import frMessage from './locales/fr/message.json';
import frEditor from './locales/fr/editor.json';







// إعداد الموارد
const resources = {
  ar: {
    translation: {
      analytics: arAnalytics,
      auth: arAuth,
      builder: arBuilder,
      buttons: arButtons,
      categories: arCategories,
      common: arCommon,
      dashboard: arDashboard,
      deleteModal: arDeleteModal,
      fields: arFields,
      header: arHeader,
      landing: arLanding,
      locations: arLocations,
      nav: arNav,
      niches: arNiches,
      notifications: arNotifications,
      orders: arOrders,
      payment: arPayment,
      performance: arPerformance,
      placeholders: arPlaceholders,
      preview: arPreview,
      products: arProducts,
      settings: arSettings,
      shipping: arShipping,
      sidebar: arSidebar,
      steps: arSteps,
      stores: arStores,
      summary: arSummary,
      upload: arUpload,
      validation: arValidation,
      theme: arTheme,
      wallet: arWallet,
      layout: arLayout,
      Pixels: arPixel,
      domain: arDomain,
      imageModel : arImageModel,
      message : arMessage,
      editor: arEditor
    },
  },
  en: {
    translation: {
      analytics: enAnalytics,
      auth: enAuth,
      builder: enBuilder,
      buttons: enButtons,
      categories: enCategories,
      common: enCommon,
      dashboard: enDashboard,
      deleteModal: enDeleteModal,
      fields: enFields,
      header: enHeader,
      landing: enLanding,
      locations: enLocations,
      nav: enNav,
      niches: enNiches,
      notifications: enNotifications,
      orders: enOrders,
      payment: enPayment,
      performance: enPerformance,
      placeholders: enPlaceholders,
      preview: enPreview,
      products: enProducts,
      settings: enSettings,
      shipping: enShipping,
      sidebar: enSidebar,
      steps: enSteps,
      stores: enStores,
      summary: enSummary,
      upload: enUpload,
      validation: enValidation,
      theme: enTheme,
      wallet: enWallet,
      layout: enLayout,
      Pixels: enPixel,
      domain: enDomain,
      imageModel : enImageModel,
      message : enMessage,
      editor: enEditor
    },
  },
  fr: {
    translation: {
      analytics: frAnalytics,
      auth: frAuth,
      builder: frBuilder,
      buttons: frButtons,
      categories: frCategories,
      common: frCommon,
      dashboard: frDashboard,
      deleteModal: frDeleteModal,
      fields: frFields,
      header: frHeader,
      landing: frLanding,
      locations: frLocations,
      nav: frNav,
      niches: frNiches,
      notifications: frNotifications,
      orders: frOrders,
      payment: frPayment,
      performance: frPerformance,
      placeholders: frPlaceholders,
      preview: frPreview,
      products: frProducts,
      settings: frSettings,
      shipping: frShipping,
      sidebar: frSidebar,
      steps: frSteps,
      stores: frStores,
      summary: frSummary,
      upload: frUpload,
      validation: frValidation,
      theme: frTheme,
      wallet: frWallet,
      layout: frLayout,
      Pixels: frPixel,
      domain: frDomain,
      imageModel : frImageModel,
      message : frMessage,
      editor: frEditor
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;