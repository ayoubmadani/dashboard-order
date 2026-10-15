import axios from 'axios';
import { baseURL } from '../constents/const.';
import { getAccessToken } from './access-token';

// المتجر المختار: في المتصفح (للجلسة) وفي الخادم (يبقى بعد تسجيل الخروج ومن أي جهاز)
export function saveSelectedStore(storeId) {
  if (!storeId) return;
  localStorage.setItem('storeId', storeId);
  axios.put(`${baseURL}/stores/${storeId}/select`, {}, { headers: { Authorization: `Bearer ${getAccessToken()}` } }).catch(() => {});
}
