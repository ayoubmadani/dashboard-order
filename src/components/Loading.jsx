import React from 'react'

export default function Loading({ d }) {
    // 1. تحديد قيمة افتراضية في حال لم يتم تمرير d
    const size = d || 12; 

    // ملاحظة: Tailwind لا يدعم الكسور مثل 12.5 بشكل افتراضي في الـ width 
    // يفضل استخدام قيم صحيحة مثل w-12 أو w-16
    
    return (
        <div className='h-[calc(100vh-100px)] w-full flex justify-center items-center'>
            {/* 2. استخدام التنسيق المضمن (Inline Styles) للقيم الديناميكية تماماً 
               أو الاعتماد على كلاسات ثابتة إذا كانت القيم محدودة */}
            <div 
                style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
                className="border-emerald-400 rounded-full border-4 border-t-transparent animate-spin"
            >
            </div>
        </div>
    )
}