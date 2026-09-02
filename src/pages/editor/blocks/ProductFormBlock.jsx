import { useEffect, useState } from 'react';
import {
  Minus, Plus, ShoppingCart, MapPin, Phone, User, Home,
  ChevronDown, Truck, Shield, Package, Building2, AlertCircle, Tag, Mail, MessageCircle,
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { getProductFormStrings } from './productFormTranslations';

// Mirrors store/src/components/productForm/productForm.tsx (+ ProductClient.tsx's
// variant/offer picker) field names, layout, and POST /orders payload exactly —
// that's the real, already-working storefront order flow, so this block both
// looks like and submits real orders the same way instead of inventing a
// parallel shape. Wilaya/commune/order endpoints are public (no auth) to match
// how a real customer on a published page would call them; only the initial
// product-info lookup needs the dashboard's own token, since it currently only
// runs inside the editor.

// A VariantDetail's `name` is a denormalized JSON array of {attrName, value}
// entries (not a relation) — matching is done client-side, same as the real form.
function variantMatches(detail, selected) {
  return Object.entries(selected).every(([attrName, value]) =>
    detail.name?.some((entry) => entry.attrName === attrName && entry.value === value)
  );
}

function FieldWrapper({ label, labelColor, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 17, fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

export default function ProductFormBlock({
  productId,
  showProductName,
  productName,
  buttonText,
  containerBackgroundColor,
  backgroundColor,
  textColor,
  buttonBackgroundColor,
  buttonTextColor,
  buttonBorderColor,
  buttonBackgroundColorDisabled,
  buttonTextColorDisabled,
  buttonBorderColorDisabled,
  inputBackgroundColor,
  inputBorderColor,
  inputTextColor,
  paddingX,
  paddingY,
  borderRadius,
  sectionGap,
  language,
}) {
  const t = getProductFormStrings(language);
  const formatPrice = (n) => `${Number(n || 0).toLocaleString('ar-DZ')} ${t.currency}`;
  const [product, setProduct] = useState(null);
  const [wilayas, setWilayas] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerWhatsapp: '',
    wilayaId: '',
    communeId: '',
    typeShip: 'home',
    quantity: 1,
  });
  // منتج رقمي فقط — أي طريقة يستخدمها الزائر للتواصل بدل الشحن
  const [contactMethod, setContactMethod] = useState('email');
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
  const muted = textColor || '#27272a';
  const baseInputStyle = {
    ...inputStyle,
    backgroundColor: inputBackgroundColor || inputStyle.backgroundColor,
    borderColor: inputBorderColor || inputStyle.borderColor,
    color: inputTextColor || inputStyle.color,
  };
  // "Couleurs du bouton actif/désactivé" apply to every selectable-choice
  // button in the form (delivery type, offers, attribute/variant options,
  // digital contact-method toggle) — active = the currently-picked choice,
  // désactivé = every other choice in that same group, not the submit button.
  const activeBtnText = buttonTextColor || '#ffffff';
  const activeBtnBorder = buttonBorderColor || accentColor;
  const inactiveBtnBg = buttonBackgroundColorDisabled || 'transparent';
  const inactiveBtnText = buttonTextColorDisabled || muted;
  const inactiveBtnBorder = buttonBorderColorDisabled || baseInputStyle.borderColor;
  const fieldStyle = (name, extra) => ({
    ...baseInputStyle,
    ...extra,
    ...(focusedField === name
      ? { borderColor: accentColor, backgroundColor: '#ffffff', boxShadow: `0 0 0 3px ${accentShadow}` }
      : {}),
  });
  // Same merchant-configurable radius as the outer card, applied to every
  // inner section box too (header, product info, offers, options, fields,
  // summary) so "Rayon des angles" controls all of them uniformly.
  const sectionRadius = borderRadius ?? 10;
  // Merchant-configurable gap between top-level section boxes (header,
  // product info / offers / options, order-form fields, summary).
  const gapPx = sectionGap ?? 14;
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
  const priceShip = product?.isDigital
    ? 0
    : selectedWilaya
      ? form.typeShip === 'office'
        ? selectedWilaya.livraisonOfice
        : selectedWilaya.livraisonHome
      : 0;
  const priceLoss = product?.isDigital ? 0 : (selectedWilaya?.livraisonReturn || 0);
  // Store-level "Qty Support" toggle — hide the quantity picker entirely
  // (not just lock it to 1) when the merchant's store doesn't offer it,
  // same as the theme files' own ProductForm already does.
  const supportQty = product?.supportQty !== false;
  const totalPrice = getUnitPrice() * form.quantity + (priceShip || 0);

  const outOfStock =
    matchedVariantDetail && !matchedVariantDetail.autoGenerate && matchedVariantDetail.stock <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;

    const normalizedPhone = form.customerPhone.trim().replace(/^\+213/, '0');
    if (!/^(05|06|07)\d{8}$/.test(normalizedPhone)) {
      setError(t.errorPhone);
      return;
    }
    if (product.isDigital) {
      if (contactMethod === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
          setError(t.errorEmail);
          return;
        }
      } else if (!/^(0|\+213)[5-7][0-9]{8}$/.test(form.customerWhatsapp.trim().replace(/\s/g, ''))) {
        setError(t.errorWhatsapp);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    // Minimum visible duration for the "submitting" (disabled-button-colors)
    // state — a local API call can resolve in well under 100ms, too fast to
    // actually see the button's disabled styling, so this floors it at 500ms.
    const minDelay = new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const customerId = localStorage.getItem('customerId') || undefined;
      const [res] = await Promise.all([
        axios.post(`${baseURL}/orders`, {
          productId: product.id,
          variantDetailId: matchedVariantDetail?.id,
          offerId: selectedOffer || undefined,
          domain: product.domain,
          platform: 'mdstore',
          quantity: form.quantity,
          totalPrice,
          customerId,
          customerName: form.customerName,
          customerPhone: normalizedPhone,
          ...(product.isDigital
            ? (contactMethod === 'email'
                ? { customerEmail: form.customerEmail.trim() }
                : { customerWhatsapp: form.customerWhatsapp.trim() })
            : {
                typeShip: form.typeShip,
                priceShip,
                priceLoss,
                customerWilayaId: form.wilayaId ? Number(form.wilayaId) : undefined,
                customerCommuneId: form.communeId ? Number(form.communeId) : undefined,
              }),
        }),
        minDelay,
      ]);
      if (res.data?.customerId) localStorage.setItem('customerId', res.data.customerId);
      setSubmitted(true);
    } catch {
      await minDelay;
      setError(t.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAttrEntries = Object.entries(selectedVariants);

  return (
    // Stable id a "jump to order form" button (see ElementsOverlay.jsx)
    // scrolls to — works from anywhere on the page without needing to know
    // this block's own generated id.
    <div
      id="md-product-form"
      style={{
        paddingBlock: paddingY ?? 0,
        paddingInline: `${paddingX ?? 0}%`,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: containerBackgroundColor || 'transparent',
      }}
    >
      <div style={{ backgroundColor: containerBackgroundColor || '#ffffff', color: muted, overflow: 'hidden', borderRadius: borderRadius ?? 0 }}>
        <div style={{ paddingTop: gapPx }}>
          {!productId ? (
            <p style={{ textAlign: 'center', fontSize: 14, opacity: 0.6 }}>{t.noProductSelected}</p>
          ) : submitted ? (
            <p style={{ textAlign: 'center', fontSize: 15, fontWeight: 600, color: accentColor }}>
              {t.submitSuccess}
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: gapPx }}>
              {product && showProductName !== false && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: sectionRadius, backgroundColor: backgroundColor || '#ffffff', border: `1px solid ${baseInputStyle.borderColor}` }}>
                  {product.productImage && (
                    <img src={product.productImage} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                  )}
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{productName || product.name}</p>
                    <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>{formatPrice(getUnitPrice())}</p>
                  </div>
                </div>
              )}

              {(product?.offers?.length > 0 || product?.attributes?.length > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: gapPx }}>
                  {product?.offers?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: sectionRadius, backgroundColor: backgroundColor || '#ffffff', border: `1px solid ${baseInputStyle.borderColor}` }}>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: muted, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.4 }}>{t.offersTitle}</p>
                      {product.offers.map((offer) => (
                        <label
                          key={offer.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            padding: '14px 10px',
                            borderRadius: 8,
                            border: `1px solid ${selectedOffer === offer.id ? activeBtnBorder : inactiveBtnBorder}`,
                            cursor: 'pointer',
                            fontSize: 20,
                            fontWeight: 700,
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
                            <span style={{ display: 'flex', flexDirection: 'column' }}>
                              {offer.name}
                              <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.6 }}>({offer.quantity} {t.pieces})</span>
                            </span>
                          </span>
                          <span style={{ fontWeight: 700 }}>{formatPrice(offer.price)}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {product?.attributes?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: sectionRadius, backgroundColor: backgroundColor || '#ffffff', border: `1px solid ${baseInputStyle.borderColor}` }}>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: muted, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.4 }}>{t.optionsTitle}</p>
                      {product.attributes.map((attr) => (
                        <div key={attr.id}>
                          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{attr.name}</p>
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
                                      width: 38,
                                      height: 38,
                                      borderRadius: '50%',
                                      background: v.value,
                                      border: `2px solid ${isSelected ? activeBtnBorder : inactiveBtnBorder}`,
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
                                      width: 100,
                                      height: 100,
                                      borderRadius: 8,
                                      padding: 0,
                                      backgroundImage: `url(${v.value})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      border: `2px solid ${isSelected ? activeBtnBorder : inactiveBtnBorder}`,
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
                                    padding: '10px 18px',
                                    borderRadius: 6,
                                    fontSize: 16,
                                    backgroundColor: isSelected ? accentColor : inactiveBtnBg,
                                    color: isSelected ? activeBtnText : inactiveBtnText,
                                    border: `1px solid ${isSelected ? activeBtnBorder : inactiveBtnBorder}`,
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
                </div>
              )}

              {/* Order form fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 12, borderRadius: sectionRadius, backgroundColor: backgroundColor || '#ffffff', border: `1px solid ${baseInputStyle.borderColor}` }}>
              {/* Name + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                <FieldWrapper label={t.fullName} labelColor={muted}>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={iconInFieldStyle} />
                    <input
                      type="text"
                      placeholder={t.fullNamePlaceholder}
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                      required
                      style={fieldStyle('customerName', { paddingInlineStart: 34 })}
                      {...fieldHandlers('customerName')}
                    />
                  </div>
                </FieldWrapper>
                <FieldWrapper label={t.phone} labelColor={muted}>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={iconInFieldStyle} />
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="0550 123 456"
                      value={form.customerPhone}
                      onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                      required
                      style={fieldStyle('customerPhone', { paddingInlineStart: 34, fontFamily: 'monospace' })}
                      {...fieldHandlers('customerPhone')}
                    />
                  </div>
                </FieldWrapper>
              </div>

              {product?.isDigital ? (
                /* Email or WhatsApp — digital products need no shipping info */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: muted, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.4 }}>{t.contactQuestion}</p>
                  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${inputBorderColor || inputStyle.borderColor}` }}>
                    <button
                      type="button"
                      onClick={() => setContactMethod('email')}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                        backgroundColor: contactMethod === 'email' ? accentColor : inactiveBtnBg,
                        color: contactMethod === 'email' ? activeBtnText : inactiveBtnText,
                        opacity: contactMethod === 'email' ? 1 : 0.6,
                      }}
                    >
                      <Mail size={14} />
                      {t.contactViaEmail}
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactMethod('whatsapp')}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                        backgroundColor: contactMethod === 'whatsapp' ? accentColor : inactiveBtnBg,
                        color: contactMethod === 'whatsapp' ? activeBtnText : inactiveBtnText,
                        opacity: contactMethod === 'whatsapp' ? 1 : 0.6,
                      }}
                    >
                      <MessageCircle size={14} />
                      {t.contactViaWhatsapp}
                    </button>
                  </div>

                  {contactMethod === 'email' ? (
                    <FieldWrapper label={t.email} labelColor={muted}>
                      <div style={{ position: 'relative' }}>
                        <Mail size={15} style={iconInFieldStyle} />
                        <input
                          type="email"
                          dir="ltr"
                          placeholder={t.emailPlaceholder}
                          value={form.customerEmail}
                          onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                          required
                          style={fieldStyle('customerEmail', { paddingInlineStart: 34 })}
                          {...fieldHandlers('customerEmail')}
                        />
                      </div>
                    </FieldWrapper>
                  ) : (
                    <FieldWrapper label={t.whatsapp} labelColor={muted}>
                      <div style={{ position: 'relative' }}>
                        <MessageCircle size={15} style={iconInFieldStyle} />
                        <input
                          type="tel"
                          dir="ltr"
                          placeholder={t.whatsappPlaceholder}
                          value={form.customerWhatsapp}
                          onChange={(e) => setForm((f) => ({ ...f, customerWhatsapp: e.target.value }))}
                          required
                          style={fieldStyle('customerWhatsapp', { paddingInlineStart: 34, fontFamily: 'monospace' })}
                          {...fieldHandlers('customerWhatsapp')}
                        />
                      </div>
                    </FieldWrapper>
                  )}
                </div>
              ) : (
                <>
                  {/* Wilaya + Commune */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <FieldWrapper label={t.wilaya} labelColor={muted}>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={15} style={iconInFieldStyle} />
                        <select
                          value={form.wilayaId}
                          onChange={(e) => setForm((f) => ({ ...f, wilayaId: e.target.value, communeId: '' }))}
                          required
                          style={fieldStyle('wilayaId', { paddingInlineStart: 34, paddingInlineEnd: 28, appearance: 'none', cursor: 'pointer' })}
                          {...fieldHandlers('wilayaId')}
                        >
                          <option value="">{t.selectWilaya}</option>
                          {wilayas.map((w) => (
                            <option key={w.id} value={w.id}>{w.ar_name || w.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} style={chevronInFieldStyle} />
                      </div>
                    </FieldWrapper>
                    <FieldWrapper label={t.commune} labelColor={muted}>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={15} style={iconInFieldStyle} />
                        <select
                          value={form.communeId}
                          onChange={(e) => setForm((f) => ({ ...f, communeId: e.target.value }))}
                          disabled={!form.wilayaId}
                          style={fieldStyle('communeId', { paddingInlineStart: 34, paddingInlineEnd: 28, appearance: 'none', cursor: 'pointer', opacity: form.wilayaId ? 1 : 0.6 })}
                          {...fieldHandlers('communeId')}
                        >
                          <option value="">{t.selectCommune}</option>
                          {communes.map((c) => (
                            <option key={c.id} value={c.id}>{c.ar_name || c.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} style={chevronInFieldStyle} />
                      </div>
                    </FieldWrapper>
                  </div>

                  {/* Delivery type */}
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.4, margin: '0 0 8px' }}>{t.deliveryType}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { type: 'home', Icon: Home, label: t.home },
                        { type: 'office', Icon: Building2, label: t.office },
                      ].map((opt) => {
                        const isSelected = form.typeShip === opt.type;
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, typeShip: opt.type }))}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 6,
                              padding: '12px 8px',
                              borderRadius: 14,
                              border: `2px solid ${isSelected ? activeBtnBorder : inactiveBtnBorder}`,
                              backgroundColor: isSelected ? accentColor : inactiveBtnBg,
                              color: isSelected ? activeBtnText : inactiveBtnText,
                              cursor: 'pointer',
                            }}
                          >
                            <opt.Icon size={20} style={{ opacity: isSelected ? 1 : 0.5 }} />
                            <span style={{ textAlign: 'center' }}>
                              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700 }}>{opt.label}</span>
                              {selectedWilaya && (
                                <span style={{ display: 'block', fontSize: 10.5, marginTop: 2, opacity: isSelected ? 0.85 : 0.55 }}>
                                  {formatPrice(opt.type === 'home' ? selectedWilaya.livraisonHome : selectedWilaya.livraisonOfice)}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {!selectedWilaya && (
                      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 6, textAlign: 'center' }}>{t.selectWilayaForPrice}</p>
                    )}
                  </div>
                </>
              )}

              {/* Quantity — a digital product is a single license/copy, not a
                  stockable count, so there's nothing to increment; supportQty
                  being off means the store doesn't offer quantity selection at all */}
              {supportQty && !product?.isDigital && (
                <FieldWrapper label={t.quantity} labelColor={muted}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                      disabled={form.quantity <= 1}
                      style={quantityButtonStyle(accentColor, form.quantity <= 1)}
                    >
                      <Minus size={14} strokeWidth={2.5} />
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontSize: 17, fontWeight: 800 }}>
                      {form.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, quantity: f.quantity + 1 }))}
                      style={quantityButtonStyle(accentColor, false)}
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                    <span style={{ fontSize: 12, opacity: 0.5, fontWeight: 500 }}>{t.piece}</span>
                  </div>
                </FieldWrapper>
              )}
              </div>

              {/* Order summary */}
              {product && (
                <div style={{ borderRadius: sectionRadius, backgroundColor: backgroundColor || '#ffffff', border: `1px solid ${baseInputStyle.borderColor}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.75 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Package size={14} /> {t.product}</span>
                    <span style={{ fontWeight: 700, opacity: 1, maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
                  </div>

                  {selectedOffer && (() => {
                    const offer = product.offers?.find((o) => o.id === selectedOffer);
                    if (!offer) return null;
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.75 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Tag size={13} color="#f59e0b" /> {t.offer}</span>
                        <span style={{ color: '#d97706', fontWeight: 700, backgroundColor: '#fffbeb', padding: '3px 8px', borderRadius: 8, fontSize: 11, border: '1px solid #fde68a' }}>{offer.name}</span>
                      </div>
                    );
                  })()}

                  {selectedAttrEntries.map(([attrName, val]) => {
                    const attr = product.attributes?.find((a) => a.name === attrName);
                    const variant = attr?.variants?.find((v) => v.value === val);
                    if (!variant) return null;
                    return (
                      <div key={attrName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.75 }}>
                        <span>{attrName}</span>
                        <span style={{ fontWeight: 600, opacity: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {attr?.displayMode === 'color' && <span style={{ width: 15, height: 15, borderRadius: '50%', border: `1px solid ${baseInputStyle.borderColor}`, backgroundColor: val }} />}
                          {attr?.displayMode === 'image' && <span style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${baseInputStyle.borderColor}`, backgroundImage: `url(${val})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                          {!attr?.displayMode && <span>{variant.name || val}</span>}
                        </span>
                      </div>
                    );
                  })}

                  {!product.isDigital && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.75 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Truck size={14} /> {t.delivery}</span>
                      <span style={{ fontWeight: 600, opacity: 1 }}>
                        {form.typeShip === 'home' ? t.homeShort : t.officeShort}
                        {form.wilayaId && <span style={{ opacity: 0.6 }}> ({formatPrice(priceShip)})</span>}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.75 }}>
                    <span>{t.unitPrice}</span>
                    <span style={{ fontWeight: 700, opacity: 1 }}>{formatPrice(getUnitPrice())}</span>
                  </div>
                  {supportQty && !product.isDigital && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.75 }}>
                      <span>{t.quantity}</span>
                      <span style={{ fontWeight: 700, opacity: 1 }}>× {form.quantity}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1.5px dashed ${baseInputStyle.borderColor}` }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{t.total}</span>
                    <span style={{ fontSize: 19, fontWeight: 800 }}>
                      {formatPrice(totalPrice)}
                    </span>
                  </div>

                  {outOfStock && (
                    <p style={{ color: '#dc2626', fontSize: 12, textAlign: 'center', margin: 0 }}>{t.outOfStock}</p>
                  )}
                  {error && <p style={{ color: '#dc2626', fontSize: 12, textAlign: 'center', margin: 0 }}>{error}</p>}

                  {(() => {
                    const isBtnDisabled = submitting || outOfStock;
                    // Only a merchant-set disabled color skips the opacity dim —
                    // otherwise fall back to the old behavior (active color + 0.6
                    // opacity) so pages saved before this field existed look the same.
                    const btnBg = isBtnDisabled ? (buttonBackgroundColorDisabled || buttonBackgroundColor || 'var(--md-primary, #10b981)') : (buttonBackgroundColor || 'var(--md-primary, #10b981)');
                    const btnText = isBtnDisabled ? (buttonTextColorDisabled || buttonTextColor || '#ffffff') : (buttonTextColor || '#ffffff');
                    const btnBorder = isBtnDisabled ? (buttonBorderColorDisabled || buttonBorderColor) : buttonBorderColor;
                    return (
                  <button
                    type="submit"
                    disabled={isBtnDisabled}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '13px 24px',
                      borderRadius: 14,
                      border: btnBorder ? `2px solid ${btnBorder}` : 'none',
                      backgroundColor: btnBg,
                      color: btnText,
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: isBtnDisabled ? 'default' : 'pointer',
                      opacity: isBtnDisabled && !buttonBackgroundColorDisabled ? 0.6 : 1,
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    }}
                  >
                    {submitting ? (
                      <>
                        <span style={spinnerStyle(btnText)} />
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={17} />
                        {buttonText || t.submit}
                      </>
                    )}
                  </button>
                    );
                  })()}
                </div>
              )}

              <p style={{ margin: 0, fontSize: 11, textAlign: 'center', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Shield size={12} />
                {t.secure}
              </p>
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
  fontSize: 16,
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#f9fafb',
  color: '#18181b',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
};

const iconInFieldStyle = {
  position: 'absolute',
  insetInlineStart: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  opacity: 0.4,
  pointerEvents: 'none',
};

const chevronInFieldStyle = {
  position: 'absolute',
  insetInlineEnd: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  opacity: 0.4,
  pointerEvents: 'none',
};

const quantityButtonStyle = (accentColor, disabled) => ({
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,
  border: `1.5px solid ${disabled ? '#e4e4e7' : accentColor}`,
  backgroundColor: 'transparent',
  color: disabled ? '#a1a1aa' : accentColor,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.6 : 1,
  padding: 0,
});

// Tailwind's own `spin` keyframe is already generated globally elsewhere in
// this app (via the many `animate-spin` classNames on Loader2 icons), so
// this can reference it directly by name instead of declaring a new one.
const spinnerStyle = (color) => ({
  width: 15,
  height: 15,
  borderRadius: '50%',
  border: `2px solid ${color}55`,
  borderTopColor: color,
  animation: 'spin 0.7s linear infinite',
  display: 'inline-block',
});

