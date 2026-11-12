import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// «المنتج بثيم المتجر»: في المحرر معاينة مبسّطة (صورة، اسم، سعر)؛ في الصفحة المنشورة يرسمه ثيم المتجر نفسه
// (صور، خيارات، نموذج طلب مباشر) — المنتج يبقى متصلاً، أي تعديل عليه يظهر في الصفحة
export default function ThemeProductBlock({ productId, backgroundColor }) {
  const { t } = useTranslation();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!productId) { setProduct(null); return; }
    axios
      .get(`${baseURL}/builder-pages/product-info/${productId}`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
      .then((res) => setProduct(res.data))
      .catch(() => setProduct(null));
  }, [productId]);

  const image = product?.imagesProduct?.[0]?.imageUrl || product?.productImage;
  return (
    <div style={{ padding: 16, background: backgroundColor || 'transparent', border: '2px dashed #a7f3d0', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
        <Store size={14} /> {t('editor.blocks.themeProduct.label')}
      </div>
      {!productId ? (
        <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>{t('editor.blocks.themeProduct.noProduct')}</p>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: 10, background: '#e2e8f0', flexShrink: 0, overflow: 'hidden' }}>
            {image && <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#18181b', margin: 0 }}>{product?.name || '…'}</p>
            {product?.price != null && <p style={{ color: '#059669', fontWeight: 700, margin: '4px 0 0' }} dir="ltr">{Number(product.price).toLocaleString()} DZD</p>}
            <p style={{ color: '#64748b', fontSize: 12, margin: '6px 0 0' }}>{t('editor.blocks.themeProduct.hint')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
