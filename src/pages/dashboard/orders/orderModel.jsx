import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../../constents/const.";
import { getAccessToken } from "../../../services/access-token";

export default function OrderModal({ isOpen, onClose, orderId, onRefresh }) {
    const [editedOrder, setEditedOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [wilayasData, setWilayaData] = useState([]);
    const [communes, setCommunes] = useState([]);
    const [variantOptions, setVariantOptions] = useState([]);
    const [offers, setOffers] = useState([]);

    const token = getAccessToken();

    // 1. Fetch Wilayas when modal opens
    useEffect(() => {
        if (!isOpen) return;
        axios
            .get(`${baseURL}/shipping/get-shipping`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((r) => setWilayaData(r.data || []))
            .catch((e) => console.error("wilayas:", e));
    }, [isOpen]);

    // 2. Fetch Order when orderId changes
    useEffect(() => {
        if (!isOpen || !orderId) return;

        const getOrder = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`${baseURL}/orders/get-one/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // initPrice = سعر المنتج الخام (بدون شحن)
                const initPrice = Number(data.totalPrice || 0) - Number(data.priceShip || 0);

                setEditedOrder({ ...data, initPrice });

                if (data.productId) fetchProductData(data.productId);
            } catch (e) {
                console.error("order:", e);
            } finally {
                setLoading(false);
            }
        };

        getOrder();
    }, [isOpen, orderId]);

    // 3. Fetch variants + offers
    const fetchProductData = async (productId) => {
        try {
            const [vRes, oRes] = await Promise.all([
                axios.get(`${baseURL}/products/${productId}/variants`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${baseURL}/products/${productId}/offers`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            setVariantOptions(vRes.data || []);
            setOffers(oRes.data || []);
        } catch (e) {
            console.error("product data:", e);
        }
    };

    // 4. Fetch communes when wilaya changes
    useEffect(() => {
        if (!editedOrder?.customerWilayaId) return;
        setCommunes([]);
        axios
            .get(`${baseURL}/shipping/get-communes/${editedOrder.customerWilayaId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((r) => setCommunes(r.data || []))
            .catch((e) => console.error("communes:", e));
    }, [editedOrder?.customerWilayaId]);

    // ─── Handlers ──────────────────────────────────────────────────

    const handleChange = (field, value) =>
        setEditedOrder((prev) => ({ ...prev, [field]: value }));

    // Wilaya → reset commune + recalc shipping
    const handleWilayaChange = (wilayaId) => {
        const w = wilayasData.find((x) => x.id === parseInt(wilayaId));
        if (!w) return;

        const newShipPrice =
            editedOrder.typeShip === "office"
                ? parseFloat(w.livraisonOfice || 0)
                : parseFloat(w.livraisonHome || 0);

        setEditedOrder((prev) => ({
            ...prev,
            customerWilayaId: parseInt(wilayaId),
            customerCommuneId: null,
            customerWilaya: w,
            priceShip: newShipPrice,
            totalPrice: prev.initPrice + newShipPrice,
        }));
    };

    // TypeShip → recalc shipping price
    const handleChangeTypeShip = (typeShip) => {
        const w = wilayasData.find((x) => x.id === parseInt(editedOrder.customerWilayaId));
        if (!w) {
            setEditedOrder((prev) => ({ ...prev, typeShip }));
            return;
        }

        const newShipPrice =
            typeShip === "office"
                ? parseFloat(w.livraisonOfice || 0)
                : parseFloat(w.livraisonHome || 0);

        setEditedOrder((prev) => ({
            ...prev,
            typeShip,
            priceShip: newShipPrice,
            totalPrice: prev.initPrice + newShipPrice,
        }));
    };

    // Variant → update variantDetail + variantDetailId + totalPrice
    const handleVariantChange = (variantId) => {
        // BUG FIX: variantOptions IDs may be string or int — compare both ways
        const v = variantOptions.find((x) => String(x.id) === String(variantId));
        if (!v) return;

        const newInitPrice = parseFloat(v.price || 0);

        setEditedOrder((prev) => ({
            ...prev,
            variantDetail: v,
            variantDetailId: v.id,
            initPrice: newInitPrice,
            totalPrice: newInitPrice + parseFloat(prev.priceShip || 0),
        }));
    };

    // Offer → update offerId + totalPrice
    const handleOfferChange = (offerId) => {
        if (!offerId) {
            // Remove offer: restore initPrice from current variant price
            const baseInit = parseFloat(editedOrder.variantDetail?.price || editedOrder.initPrice || 0);
            setEditedOrder((prev) => ({
                ...prev,
                offerId: null,
                offer: null,
                initPrice: baseInit,
                totalPrice: baseInit + parseFloat(prev.priceShip || 0),
            }));
            return;
        }

        // BUG FIX: was missing parseInt, compare as strings for safety
        const o = offers.find((x) => String(x.id) === String(offerId));
        if (!o) return;

        const offerPrice = parseFloat(o.price || 0);

        setEditedOrder((prev) => ({
            ...prev,
            offerId: o.id,
            offer: o,
            initPrice: offerPrice,
            totalPrice: offerPrice + parseFloat(prev.priceShip || 0),
        }));
    };

    // Save
    const handleSave = async () => {
        setLoading(true);
        const payload = {
            variantDetailId:  editedOrder.variantDetailId,
            offerId:          editedOrder.offerId,
            quantity:         editedOrder.quantity,
            typeShip:         editedOrder.typeShip,
            priceShip:        editedOrder.priceShip,   // BUG FIX: was editedOrder.name
            totalPrice:       editedOrder.totalPrice,
            customerName:     editedOrder.customerName,
            customerPhone:    editedOrder.customerPhone,
            customerWilayaId: editedOrder.customerWilayaId,
            customerCommuneId:editedOrder.customerCommuneId,
            status:           editedOrder.status,
        };

        try {
            await axios.patch(`${baseURL}/orders/${editedOrder.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onRefresh?.();
            onClose();
        } catch (e) {
            alert("فشل في حفظ التعديلات");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // ─── Early returns ────────────────────────────────────────────
    if (!isOpen) return null;

    if (!editedOrder) return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
    );

    // ─── Render ───────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div
                className="relative bg-white w-full max-w-4xl h-full max-h-[95vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden font-sans"
                dir="rtl"
            >
                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* ══ Header ══ */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-600 rounded-full" />
                        تعديل طلب #{orderId}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ══ Body ══ */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1 bg-gray-50/50">

                    {/* ── Col 1: بيانات الشحن ── */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest px-1">
                            📍 بيانات الشحن
                        </h3>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">

                            {/* اسم الزبون */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">اسم الزبون</label>
                                <input
                                    type="text"
                                    value={editedOrder.customerName || ""}
                                    onChange={(e) => handleChange("customerName", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* رقم الهاتف */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">رقم الهاتف</label>
                                <input
                                    type="text"
                                    value={editedOrder.customerPhone || ""}
                                    onChange={(e) => handleChange("customerPhone", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:border-blue-500 outline-none"
                                    placeholder="0XXXXXXXXX"
                                />
                            </div>

                            {/* الولاية + البلدية */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">الولاية</label>
                                    <select
                                        value={editedOrder.customerWilayaId || ""}
                                        onChange={(e) => handleWilayaChange(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none cursor-pointer"
                                    >
                                        <option value="">اختر ولاية</option>
                                        {wilayasData.map((w) => (
                                            <option key={w.id} value={w.id}>
                                                {w.id} - {w.ar_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">البلدية</label>
                                    <select
                                        value={editedOrder.customerCommuneId || ""}
                                        onChange={(e) => handleChange("customerCommuneId", parseInt(e.target.value))}
                                        disabled={!communes.length}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none cursor-pointer disabled:bg-gray-100"
                                    >
                                        <option value="">اختر بلدية</option>
                                        {communes.map((c) => (
                                            <option key={c.id} value={c.id}>{c.ar_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* نوع التوصيل */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">نوع التوصيل</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { typeShip: "home",   label: "🏠 توصيل للمنزل" },
                                        { typeShip: "office", label: "🏢 استلام من المكتب" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.typeShip}
                                            type="button"
                                            onClick={() => handleChangeTypeShip(opt.typeShip)}
                                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                                editedOrder.typeShip === opt.typeShip
                                                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* الحالة */}
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">الحالة</label>
                                <select
                                    value={editedOrder.status}
                                    onChange={(e) => handleChange("status", e.target.value)}
                                    className={`w-full px-4 py-2 rounded-xl text-xs font-black outline-none border-none cursor-pointer ${
                                        editedOrder.status === "confirmed" ? "bg-green-500 text-white" :
                                        editedOrder.status === "cancelled" ? "bg-red-500 text-white"   :
                                        editedOrder.status === "delivered" ? "bg-emerald-500 text-white":
                                        editedOrder.status === "shipping"  ? "bg-cyan-500 text-white"  :
                                        "bg-orange-400 text-white"
                                    }`}
                                >
                                    <option value="pending">⏳ قيد الانتظار</option>
                                    <option value="appl1">📞 محاولة 1</option>
                                    <option value="appl2">📞 محاولة 2</option>
                                    <option value="appl3">📞 محاولة 3</option>
                                    <option value="confirmed">✅ مؤكد</option>
                                    <option value="shipping">🚚 في الشحن</option>
                                    <option value="delivered">✓ تم التوصيل</option>
                                    <option value="cancelled">🚫 ملغى</option>
                                    <option value="returned">↩️ مرتجع</option>
                                    <option value="postponed">⏸️ مؤجل</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Col 2: المنتج والعروض ── */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-purple-600 uppercase tracking-widest px-1">
                            📦 المنتج والعروض
                        </h3>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">

                            {/* اسم المنتج */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">المنتج</label>
                                <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700">
                                    {editedOrder.product?.name || editedOrder.productName || "غير محدد"}
                                </div>
                            </div>

                            {/* الكمية */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">الكمية</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={editedOrder.quantity || 1}
                                    onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 1)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-black text-center outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* المتغير */}
                            {variantOptions.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">
                                        المتغير (مقاس / لون)
                                    </label>
                                    <select
                                        value={editedOrder.variantDetailId || ""}
                                        onChange={(e) => handleVariantChange(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-purple-100 bg-purple-50/30 text-sm font-bold outline-none cursor-pointer focus:border-purple-400"
                                    >
                                        <option value="">اختر المتغير...</option>
                                        {variantOptions.map((v) => {
                                            // name may be an object { Size, Color, ... } or a string
                                            const label = typeof v.name === "object"
                                                ? Object.values(v.name).join(" / ")
                                                : v.name;
                                            return (
                                                <option key={v.id} value={v.id}>
                                                    {label}{v.price > 0 ? ` — ${parseFloat(v.price).toLocaleString()} DA` : ""}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    {/* Variant color swatches */}
                                    {editedOrder.variantDetail && typeof editedOrder.variantDetail.name === "object" && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {Object.entries(editedOrder.variantDetail.name).map(([k, v]) => (
                                                <span
                                                    key={k}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100 text-[11px] font-bold text-purple-700"
                                                >
                                                    <span className="text-purple-400">{k}:</span>
                                                    {/^#[0-9a-f]{3,8}$/i.test(v) ? (
                                                        <>
                                                            <span
                                                                className="w-3 h-3 rounded-full border border-white shadow-sm inline-block"
                                                                style={{ background: v }}
                                                            />
                                                            {v}
                                                        </>
                                                    ) : v}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* العرض */}
                            {offers.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">
                                        العرض الترويجي
                                    </label>
                                    <select
                                        value={editedOrder.offerId || ""}
                                        onChange={(e) => handleOfferChange(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-orange-100 bg-orange-50/30 text-sm outline-none cursor-pointer focus:border-orange-400"
                                    >
                                        <option value="">بدون عرض</option>
                                        {offers.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.name}
                                                {o.quantity ? ` — ${o.quantity} قطعة` : ""}
                                                {o.price ? ` — ${parseFloat(o.price).toLocaleString()} DA` : ""}
                                            </option>
                                        ))}
                                    </select>

                                    {editedOrder.offer && (
                                        <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700 flex justify-between font-bold">
                                            <span>{editedOrder.offer.name}</span>
                                            <span>{parseFloat(editedOrder.offer.price || 0).toLocaleString()} DA</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Price summary */}
                            <div className="mt-4 p-4 bg-gray-900 rounded-2xl space-y-2">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>التكلفة الأولية:</span>
                                    <span>{parseFloat(editedOrder.initPrice || 0).toLocaleString()} DA</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>سعر الشحن:</span>
                                    <span>{parseFloat(editedOrder.priceShip || 0).toLocaleString()} DA</span>
                                </div>
                                <div className="border-t border-gray-700 pt-2 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400">الإجمالي:</span>
                                    <span className="text-green-400 text-xl font-black">
                                        {parseFloat(editedOrder.totalPrice || 0).toLocaleString()} DA
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ Footer ══ */}
                <div className="p-5 bg-white border-t border-gray-100 flex justify-end items-center gap-3 z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-400 font-bold text-sm hover:text-gray-600 transition-all"
                    >
                        إغلاق
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        حفظ التعديلات
                    </button>
                </div>
            </div>
        </div>
    );
}