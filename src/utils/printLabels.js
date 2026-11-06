import axios from 'axios';
import { baseURL } from '../constents/const.';

// ملصقات الشحن (البوليصة بالباركود) لطلب واحد أو عدة طلبات — الـ API يرجع أقل عدد من الملفات:
// رابط ملف الشركة (ZR) أو PDF مدموج (Ecotrack/Yalidine/Maystro)

const pdfBlobUrl = (b64) => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
};

/** ملفات الـ API ← روابط تُفتح في المتصفح */
export const labelLinks = (files, toBlobUrl = pdfBlobUrl) =>
  (files ?? []).filter((f) => f?.data).map((f) => (f.type === 'pdf' ? toBlobUrl(f.data) : f.data));

/**
 * تُستدعى مباشرة من نقرة الزر: النافذة تُفتح قبل انتظار الشبكة (وإلا يمنعها المتصفح).
 * يرجع { links, failed } — الرابط الأول يُفتح في النافذة، والباقي (إن وُجد) يعرضه المستدعي.
 */
export async function printLabels({ storeId, token, orderIds }) {
  const win = window.open('', '_blank');
  try {
    const { data } = await axios.post(`${baseURL}/stores/${storeId}/shipping/labels`, { orderIds },
      { headers: { Authorization: `Bearer ${token}` } });
    const links = labelLinks(data?.files);
    if (links.length && win) win.location.href = links[0];
    else win?.close();
    return { links, failed: data?.failed ?? [] };
  } catch (e) {
    win?.close();
    throw e;
  }
}
