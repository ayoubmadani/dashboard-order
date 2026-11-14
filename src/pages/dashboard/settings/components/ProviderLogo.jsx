import React, { useState } from 'react';
import { Truck } from 'lucide-react';

/**
 * شعار شركة التوصيل. إن لم يوجد رابط أو فشل تحميل الصورة (روابط Ecotrack تنكسر أحياناً)
 * تظهر أيقونة الشاحنة بدل صورة مكسورة.
 * box: أصناف الحجم والحواف المشتركة (مثلاً 'w-12 h-12 rounded-xl')، iconClass: حجم الأيقونة.
 */
export default function ProviderLogo({ logo, box, iconClass = 'w-5 h-5' }) {
  const [failed, setFailed] = useState(false);
  if (logo && logo !== '#' && !failed) {
    return (
      <img
        src={logo}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${box} object-contain bg-white p-1 border border-gray-100 dark:border-zinc-700 shrink-0`}
      />
    );
  }
  return (
    <div className={`${box} bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0`}>
      <Truck className={`${iconClass} text-indigo-400`} />
    </div>
  );
}
