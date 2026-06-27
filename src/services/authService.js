import axios from 'axios';
import { baseURL } from '../constents/const.';
import { getAccessToken, removeAccessToken } from './access-token';

export const checkAuthStatus = async () => {
    const token = getAccessToken();
    if (!token) return false;

    try {
        const response = await axios.get(`${baseURL}/auth/verify-token`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) return true;
        removeAccessToken();
        return false;
    } catch {
        removeAccessToken();
        return false;
    }
};
