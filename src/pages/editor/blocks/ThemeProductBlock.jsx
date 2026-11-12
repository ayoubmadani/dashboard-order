import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Store } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// «المنتج بثيم المتجر»: في المحرر معاينة حقيقية — صفحة المتجر /embed/<منتج> داخل إطار بعرض الصفحة،
// يأخذ ارتفاعها كاملاً (رسالة من الإطار) — للعرض فقط: لا نقر ولا سحب عناصر إليها
export const embedUrl = (subdomain, productId, width, bg) => {
  const q = new URLSearchParams({ w: String(width || 720) });
  if (bg && bg !== 'transparent') q.set('bg', bg);
  return `https://${subdomain}.mdstore.top/embed/${productId}?${q}`;
};

export default function ThemeProductBlock({ productId, backgroundColor, referenceWidth }) {
  const { t } = useTranslation();
  const [subdomain, setSubdomain] = useState(null);
  const [height, setHeight] = useState(600);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!productId) { setSubdomain(null); return; }
    axios
      .get(`${baseURL}/builder-pages/product-info/${productId}`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
      .then((res) => setSubdomain(res.data?.domain || null))
      .catch(() => setSubdomain(null));
  }, [productId]);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.type !== 'mds-embed-height' || e.data.productId !== productId) return;
      setHeight(Math.max(200, Math.ceil(e.data.height)));
      setReady(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [productId]);

  if (!productId) {
    return (
      <div style={{ padding: 24, border: '2px dashed #a7f3d0', borderRadius: 12, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        {t('editor.blocks.themeProduct.noProduct')}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', background: backgroundColor && backgroundColor !== 'transparent' ? backgroundColor : undefined }}>
      <div style={{ position: 'absolute', top: 8, insetInlineStart: 8, zIndex: 2, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: '#10b981', color: '#fff', fontSize: 10, fontWeight: 700 }}>
        <Store size={11} /> {t('editor.blocks.themeProduct.label')}
      </div>
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          <Loader2 size={22} className="animate-spin" />
        </div>
      )}
      {subdomain && (
        <iframe
          key={`${subdomain}-${productId}-${referenceWidth}-${backgroundColor}`}
          title={t('editor.blocks.themeProduct.label')}
          src={embedUrl(subdomain, productId, referenceWidth, backgroundColor)}
          style={{ display: 'block', width: '100%', height, border: 0, pointerEvents: 'none', opacity: ready ? 1 : 0 }}
          tabIndex={-1}
          loading="lazy"
        />
      )}
    </div>
  );
}
