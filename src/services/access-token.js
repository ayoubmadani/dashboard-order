import Cookies from 'js-cookie';

// استخراج الاسم في متغير ثابت لتجنب الأخطاء الإملائية (Typo)
const TOKEN_KEY = 'access_token'; // أو 'acsses_token' حسب اختيارك

export const getAccessToken = () => {
    return Cookies.get(TOKEN_KEY);
};

export const setAccessToken = (token) => {
    Cookies.set(TOKEN_KEY, token, { 
        expires: 7, 
        secure: true, 
        sameSite: 'strict' 
    });
};

export const removeAccessToken = () => {
    Cookies.remove(TOKEN_KEY);
};