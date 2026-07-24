import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import i18n from 'i18next'; // 👈 تأكد من استيراد i18n من ملف التهيئة الخاص بك

const SelectLang = () => {
    const { lang } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const validLanguages = ['ar', 'fr', 'en'];
        
        // التحقق مما إذا كانت اللغة المدعومة موجودة، وإلا يتم استخدام 'ar' كافتراضي
        const targetLang = validLanguages.includes(lang) ? lang : 'fr';

        // تغيير اللغة في i18n
        i18n.changeLanguage(targetLang);

        // التوجيه إلى لوحة التحكم
        navigate('/dashboard');
    }, [navigate, lang]);

    return (
        <div className='text-amber-300'>
            جاري تحويل اللغة...
        </div>
    );
};

export default SelectLang;