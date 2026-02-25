// authService.js
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAccessToken, removeAccessToken } from './access-token';


export const checkAuthStatus = async () => {
    const token = getAccessToken('access_token');
    const navigate = useNavigate();
    
    if (!token) return false;

    try {
        const response = await axios.get('http://localhost:7000/auth/verify-token', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        // إذا رجع السيرفر true (كما كتبت أنت في الكود)
        if (response.data) {
            return true
        }else{
            removeAccessToken()
            navigate('/auth')
        }
    } catch (error) {
        // إذا كان التوكن منتهي أو غير صالح (401 Unauthorized)
        return false;
    }
};