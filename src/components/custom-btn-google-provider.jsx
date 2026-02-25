'use client';
import React from 'react';
import { FcGoogle } from 'react-icons/fc';

const CustomBtnGoogleProvider = () => {
  
  const handleGoogleLogin = () => {
    // توجيه المستخدم مباشرة إلى رابط السيرفر الذي يبدأ عملية جوجل
    // السيرفر سيقوم بعمل Redirect لصفحة جوجل، وبعد النجاح سيعود للـ Callback
    window.location.href = 'http://localhost:7000/auth/google';
  };

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <FcGoogle className="w-5 h-5 mr-2" />
        Sign in with Google
      </button>
    </div>
  );
};

export default CustomBtnGoogleProvider;