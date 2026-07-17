import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// Mirrors store/src/components/productForm/productForm.tsx (+ ProductClient.tsx's
// variant/offer picker) field names and POST /orders payload exactly — that's the
// real, already-working storefront order flow, so this block submits real orders
// the same way instead of inventing a parallel shape. Wilaya/commune/order
// endpoints are public (no auth) to match how a real customer on a published page
// would call them; only the initial product-info lookup needs the dashboard's own
// token, since it currently only runs inside the editor.

// A VariantDetail's `name` is a denormalized JSON array of {attrName, value}
// entries (not a relation) — matching is done client-side, same as the real form.
function variantMatches(detail, selected) {
  return Object.entries(selected).every(([attrName, value]) =>
    detail.name?.some((entry) => entry.attrName === attrName && entry.value === value)
  );
}

const formatPrice = (n) => `${Number(n || 0).toLocaleString('en-US')} دج`;

export default function ProductFormBlock({
  productId,
  showProductName,
  productName,
  title,
  buttonText,
  containerBackgroundColor,
  backgroundColor,
  textColor,
  buttonBackgroundColor,
  buttonTextColor,
  buttonBorderColor,
  inputBackgroundColor,
  inputBorderColor,
  inputTextColor,
}) {
  const [product, setProduct] = useState(null);
  const [wilayas, setWilayas] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    wilayaId: '',
    communeId: '',
    typeShip: 'home',
    quantity: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  // Focus/selected accent reuses the button's own color instead of a
  // separate picker — one accent color to set, consistently applied.
  // accentColor can be a raw CSS var() expression (the default), which can't
  // have an alpha suffix appended, so the box-shadow needs its own fallback.
  const accentColor = buttonBackgroundColor || 'var(--md-primary, #10b981)';
  const accentShadow = buttonBackgroundColor ? `${buttonBackgroundColor}26` : 'rgba(16, 185, 129, 0.15)';
  const baseInputStyle = {
    ...inputStyle,
    backgroundColor: inputBackgroundColor || inputStyle.backgroundColor,
    borderColor: inputBorderColor || inputStyle.borderColor,
    color: inputTextColor || inputStyle.color,
  };
  const fieldStyle = (name) => ({
    ...baseInputStyle,
    ...(focusedField === name
      ? { borderColor: accentColor, backgroundColor: '#ffffff', boxShadow: `0 0 0 3px ${accentShadow}` }
      : {}),
  });
  const fieldHandlers = (name) => ({
    onFocus: () => setFocusedField(name),
    onBlur: () => setFocusedField((f) => (f === name ? null : f)),
  });

  useEffect(() => {
    if (!productId) return;
    axios
      .get(`${baseURL}/builder-pages/product-info/${productId}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      })
      .then((res) => setProduct(res.data))
      .catch(() => setProduct(null));
  }, [productId]);

  useEffect(() => {
    if (!product?.userId) return;
    axios
      .get(`${baseURL}/shipping/public/get-shipping/${product.userId}`)
      .then((res) => setWilayas(Array.isArray(res.data) ? res.data : []))
      .catch(() => setWilayas([]));
  }, [product?.userId]);

  useEffect(() => {
    if (!form.wilayaId) {
      setCommunes([]);
      return;
    }
    axios
      .get(`${baseURL}/shipping/get-communes/${form.wilayaId}`)
      .then((res) => setCommunes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCommunes([]));
  }, [form.wilayaId]);

  const toggleVariant = (attrName, value) => {
    setSelectedVariants((prev) => {
      const next = { ...prev };
      if (next[attrName] === value) delete next[attrName];
      else next[attrName] = value;
      return next;
    });
  };

  const matchedVariantDetail =
    product?.variantDetails?.length && Object.keys(selectedVariants).length
      ? product.variantDetails.find((v) => variantMatches(v, selectedVariants))
      : null;

  // Precedence matches the real storefront exactly: offer price overrides
  // everything, then a matched variant's price override, then the base price.
  const getUnitPrice = () => {
    const offer = product?.offers?.find((o) => o.id === selectedOffer);
    if (offer) return offer.price;
    if (matchedVariantDetail && matchedVariantDetail.price !== -1) return matchedVariantDetail.price;
    return product?.price || 0;
  };

  const selectedWilaya = wilayas.find((w) => String(w.id) === String(form.wilayaId));
  const priceShip = selectedWilaya
    ? form.typeShip === 'office'
      ? selectedWilaya.livraisonOfice
      : selectedWilaya.livraisonHome
    : 0;
  const priceLoss = selectedWilaya?.livraisonReturn || 0;
  const totalPrice = getUnitPrice() * form.quantity + (priceShip || 0);

  const outOfStock =
    matchedVariantDetail && !matchedVariantDetail.autoGenerate && matchedVariantDetail.stock <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;

    const normalizedPhone = form.customerPhone.trim().replace(/^\+213/, '0');
    if (!/^(05|06|07)\d{8}$/.test(normalizedPhone)) {
      setError('رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05 أو 06 أو 07)');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const customerId = localStorage.getItem('customerId') || undefined;
      const res = await axios.post(`${baseURL}/orders`, {
        productId: product.id,
        variantDetailId: matchedVariantDetail?.id,
        offerId: selectedOffer || undefined,
        domain: product.domain,
        platform: 'mdstore',
        quantity: form.quantity,
        totalPrice,
        typeShip: form.typeShip,
        priceShip,
        priceLoss,
        customerId,
        customerName: form.customerName,
        customerPhone: normalizedPhone,
        customerWilayaId: form.wilayaId ? Number(form.wilayaId) : undefined,
        customerCommuneId: form.communeId ? Number(form.communeId) : undefined,
      });
      if (res.data?.customerId) localStorage.setItem('customerId', res.data.customerId);
      setSubmitted(true);
    } catch {
      setError('تعذر إرسال الطلب، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Stable id a "jump to order form" button (see ElementsOverlay.jsx)
    // scrolls to — works from anywhere on the page without needing to know
    // this block's own generated id.
    <div id="md-product-form" style={{ padding: 20, width: '100%', height: '100%', boxSizing: 'border-box', backgroundColor: containerBackgroundColor || 'transparent' }}>
      <div style={{ padding: '32px 24px', borderRadius: 30, backgroundColor: backgroundColor || '#ffffff', color: textColor || '#27272a' }}>
        <div style={{ maxWidth: 420, marginInline: 'auto' }}>
        {title && <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px', textAlign: 'center' }}>{title}</h3>}

        {!productId ? (
          <p style={{ textAlign: 'center', fontSize: 14, opacity: 0.6 }}>لم يتم اختيار منتج لهذه الصفحة</p>
        ) : submitted ? (
          <p style={{ textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--md-primary, #10b981)' }}>
            تم استلام طلبك بنجاح، سنتواصل معك قريبًا!
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {product && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                {product.productImage && (
                  <img src={product.productImage} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                )}
                <div>
                  {showProductName !== false && (
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{productName || product.name}</p>
                  )}
                  <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>{formatPrice(getUnitPrice())}</p>
                </div>
              </div>
            )}

            {product?.offers?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {product.offers.map((offer) => (
                  <label
                    key={offer.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: `1px solid ${selectedOffer === offer.id ? accentColor : baseInputStyle.borderColor}`,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="radio"
                        name="offer"
                        checked={selectedOffer === offer.id}
                        onChange={() => setSelectedOffer(selectedOffer === offer.id ? null : offer.id)}
                        style={{ accentColor }}
                      />
                      {offer.name} <span style={{ opacity: 0.6 }}>({offer.quantity} قطع)</span>
                    </span>
                    <span style={{ fontWeight: 700 }}>{formatPrice(offer.price)}</span>
                  </label>
                ))}
              </div>
            )}

            {product?.attributes?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {product.attributes.map((attr) => (
                  <div key={attr.id}>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 4px' }}>{attr.name}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {attr.variants?.map((v) => {
                        const isSelected = selectedVariants[attr.name] === v.value;

                        if (attr.displayMode === 'color') {
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => toggleVariant(attr.name, v.value)}
                              title={v.name}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: v.value,
                                border: `2px solid ${isSelected ? accentColor : baseInputStyle.borderColor}`,
                                cursor: 'pointer',
                              }}
                            />
                          );
                        }

                        if (attr.displayMode === 'image') {
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => toggleVariant(attr.name, v.value)}
                              title={v.name}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                padding: 0,
                                backgroundImage: `url(${v.value})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: `2px solid ${isSelected ? accentColor : baseInputStyle.borderColor}`,
                                cursor: 'pointer',
                              }}
                            />
                          );
                        }

                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => toggleVariant(attr.name, v.value)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              backgroundColor: isSelected ? accentColor : baseInputStyle.backgroundColor,
                              color: isSelected ? '#ffffff' : baseInputStyle.color,
                              border: `1px solid ${isSelected ? accentColor : baseInputStyle.borderColor}`,
                              cursor: 'pointer',
                            }}
                          >
                            {v.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder="الاسم الكامل"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              required
              style={fieldStyle('customerName')}
              {...fieldHandlers('customerName')}
            />
            <input
              type="tel"
              placeholder="رقم الهاتف (05/06/07xxxxxxxx)"
              value={form.customerPhone}
              onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              required
              style={fieldStyle('customerPhone')}
              {...fieldHandlers('customerPhone')}
            />
            <select
              value={form.wilayaId}
              onChange={(e) => setForm((f) => ({ ...f, wilayaId: e.target.value, communeId: '' }))}
              required
              style={fieldStyle('wilayaId')}
              {...fieldHandlers('wilayaId')}
            >
              <option value="">اختر الولاية</option>
              {wilayas.map((w) => (
                <option key={w.id} value={w.id}>{w.ar_name || w.name}</option>
              ))}
            </select>
            <select
              value={form.communeId}
              onChange={(e) => setForm((f) => ({ ...f, communeId: e.target.value }))}
              disabled={!form.wilayaId}
              style={{ ...fieldStyle('communeId'), opacity: form.wilayaId ? 1 : 0.6 }}
              {...fieldHandlers('communeId')}
            >
              <option value="">اختر البلدية</option>
              {communes.map((c) => (
                <option key={c.id} value={c.id}>{c.ar_name || c.name}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 8 }}>
              <label style={radioLabelStyle(form.typeShip === 'home', accentColor, baseInputStyle.borderColor, backgroundColor || '#ffffff')}>
                <input type="radio" name="typeShip" checked={form.typeShip === 'home'} onChange={() => setForm((f) => ({ ...f, typeShip: 'home' }))} style={{ accentColor }} />
                توصيل للمنزل
              </label>
              <label style={radioLabelStyle(form.typeShip === 'office', accentColor, baseInputStyle.borderColor, backgroundColor || '#ffffff')}>
                <input type="radio" name="typeShip" checked={form.typeShip === 'office'} onChange={() => setForm((f) => ({ ...f, typeShip: 'office' }))} style={{ accentColor }} />
                توصيل للمكتب
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 12, border: `1.5px solid ${baseInputStyle.borderColor}`, backgroundColor: baseInputStyle.backgroundColor }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: baseInputStyle.color }}>الكمية</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                  disabled={form.quantity <= 1}
                  style={quantityButtonStyle(accentColor, form.quantity <= 1)}
                >
                  <Minus size={14} strokeWidth={2.5} />
                </button>
                <span style={{ minWidth: 20, textAlign: 'center', fontSize: 15, fontWeight: 700, color: baseInputStyle.color }}>
                  {form.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, quantity: f.quantity + 1 }))}
                  style={quantityButtonStyle(accentColor, false)}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {product && (
              <div style={{ borderRadius: 12, border: `1.5px solid ${baseInputStyle.borderColor}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>ملخص الطلبية</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.75 }}>
                  <span>السعر</span>
                  <span>{formatPrice(getUnitPrice())}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.75 }}>
                  <span>الكمية</span>
                  <span>× {form.quantity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.75 }}>
                  <span>التوصيل</span>
                  <span>{form.wilayaId ? formatPrice(priceShip) : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${baseInputStyle.borderColor}`, fontSize: 15, fontWeight: 700 }}>
                  <span>الإجمالي</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            )}

            {outOfStock && (
              <p style={{ color: '#dc2626', fontSize: 12, textAlign: 'center' }}>هذا الخيار غير متوفر حاليًا</p>
            )}
            {error && <p style={{ color: '#dc2626', fontSize: 12, textAlign: 'center' }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting || outOfStock}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: buttonBorderColor ? `2px solid ${buttonBorderColor}` : 'none',
                backgroundColor: buttonBackgroundColor || 'var(--md-primary, #10b981)',
                color: buttonTextColor || '#ffffff',
                fontWeight: 700,
                fontSize: 15,
                cursor: submitting || outOfStock ? 'default' : 'pointer',
                opacity: submitting || outOfStock ? 0.6 : 1,
              }}
            >
              {submitting ? 'جارٍ الإرسال...' : (buttonText || 'اطلب الآن')}
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}

// borderColor/backgroundColor/color are kept as their own properties (not
// folded into a `border` shorthand) so ProductFormBlock can override just
// one of them per the block's inputBackgroundColor/inputBorderColor/
// inputTextColor props without needing to reconstruct the whole shorthand.
const inputStyle = {
  padding: '11px 14px',
  borderRadius: 10,
  borderWidth: 1.5,
  borderStyle: 'solid',
  borderColor: '#e4e4e7',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#f9fafb',
  color: '#18181b',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
};

const radioLabelStyle = (isSelected, accentColor, borderColor, backgroundColor) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  fontWeight: isSelected ? 600 : 400,
  padding: '9px 10px',
  borderRadius: 10,
  borderWidth: 1.5,
  borderStyle: 'solid',
  borderColor: isSelected ? accentColor : borderColor,
  backgroundColor,
  cursor: 'pointer',
  transition: 'border-color 0.15s ease, background-color 0.15s ease',
});

const quantityButtonStyle = (accentColor, disabled) => ({
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: `1.5px solid ${disabled ? '#e4e4e7' : accentColor}`,
  backgroundColor: 'transparent',
  color: disabled ? '#a1a1aa' : accentColor,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.6 : 1,
  padding: 0,
});
