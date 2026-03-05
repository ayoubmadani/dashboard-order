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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
                console.log(data);

                const initPrice = Number(data.totalPrice || 0) - Number(data.priceShip || 0);
                console.log({ ...data, initPrice });

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

    useEffect(() => {
        if (editedOrder && editedOrder.variantDetailId && variantOptions.length > 0) {
            handleVariantChange(editedOrder.variantDetailId);
        }
    }, [variantOptions]);

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
            console.log({ vr: vRes.data });

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

    const handleVariantChange = (variantId) => {
        const v = variantOptions.find((x) => String(x.id) === String(variantId));
        if (!v) return;

        let newInitPrice = editedOrder.initPrice ; // تعريف المتغير أولاً

        if (v.price > -1) {
            newInitPrice = parseFloat(v.price || 0);
        }

        // الآن يمكنك استخدام newInitPrice هنا بحرية
        console.log(newInitPrice);

        setEditedOrder((prev) => ({
            ...prev,
            variantDetail: v,
            variantDetailId: v.id,
            initPrice: newInitPrice,
            totalPrice: newInitPrice + parseFloat(prev.priceShip || 0),
        }));
    };

    const handleOfferChange = (offerId) => {
        if (!offerId) {
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

    const handleSave = async () => {
        setLoading(true);
        const payload = {
            variantDetailId: editedOrder.variantDetailId,
            offerId: editedOrder.offerId,
            quantity: editedOrder.quantity,
            typeShip: editedOrder.typeShip,
            priceShip: editedOrder.priceShip,
            totalPrice: editedOrder.totalPrice,
            customerName: editedOrder.customerName,
            customerPhone: editedOrder.customerPhone,
            customerWilayaId: editedOrder.customerWilayaId,
            customerCommuneId: editedOrder.customerCommuneId,
            status: editedOrder.status,
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

    if (!isOpen) return null;

    if (!editedOrder) return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
    );

    // ✅ التحقق من وجود المنتج
    const hasProduct = !!editedOrder.product;
    const canEdit = hasProduct; // لا يمكن التعديل بدون منتج

    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div
                className="relative bg-white w-full max-w-4xl h-full max-h-[95vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden font-sans"
                dir="rtl"
            >
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
                    <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1 bg-gray-50/50">

                    {/* ── Col 1: بيانات الشحن ── */}
                    <div className="space-y-4">
                        <h3 className={`text-[11px] font-black uppercase tracking-widest px-1 ${canEdit ? 'text-blue-600' : 'text-gray-400'}`}>
                            📍 بيانات الشحن
                        </h3>

                        {!canEdit && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                <p className="text-sm text-red-600 font-bold text-center flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    لا يمكن تعديل بيانات الطلب
                                </p>
                                <p className="text-xs text-red-400 text-center mt-1">المنتج غير موجود</p>
                            </div>
                        )}

                        <div className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 ${!canEdit ? 'opacity-60' : ''}`}>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">اسم الزبون</label>
                                <input
                                    type="text"
                                    disabled={!canEdit}
                                    value={editedOrder.customerName || ""}
                                    onChange={(e) => handleChange("customerName", e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold outline-none ${!canEdit ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-200 focus:border-blue-500'}`}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">رقم الهاتف</label>
                                <input
                                    disabled
                                    type="text"
                                    value={editedOrder.customerPhone || ""}
                                    className="w-full bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">الولاية</label>
                                    <select
                                        value={editedOrder.customerWilayaId || ""}
                                        onChange={(e) => handleWilayaChange(e.target.value)}
                                        disabled={!canEdit}
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${!canEdit ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-200 bg-white cursor-pointer'}`}
                                    >
                                        <option value="">اختر ولاية</option>
                                        {wilayasData.map((w) => (
                                            <option key={w.id} value={w.id}>{w.id} - {w.ar_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">البلدية</label>
                                    <select
                                        value={editedOrder.customerCommuneId || ""}
                                        onChange={(e) => handleChange("customerCommuneId", parseInt(e.target.value))}
                                        disabled={!canEdit || !communes.length}
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${!canEdit ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-200 bg-white cursor-pointer disabled:bg-gray-100'}`}
                                    >
                                        <option value="">اختر بلدية</option>
                                        {communes.map((c) => (
                                            <option key={c.id} value={c.id}>{c.ar_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">نوع التوصيل</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[{ typeShip: "home", label: "🏠 توصيل للمنزل" }, { typeShip: "office", label: "🏢 استلام من المكتب" }].map((opt) => (
                                        <button
                                            key={opt.typeShip}
                                            type="button"
                                            onClick={() => handleChangeTypeShip(opt.typeShip)}
                                            disabled={!canEdit}
                                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${!canEdit ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : editedOrder.typeShip === opt.typeShip ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">الحالة</label>
                                <select
                                    value={editedOrder.status}
                                    onChange={(e) => handleChange("status", e.target.value)}
                                    disabled={!canEdit}
                                    className={`w-full px-4 py-2 rounded-xl text-xs font-black outline-none border-none cursor-pointer ${!canEdit ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : editedOrder.status === "confirmed" ? "bg-green-500 text-white" : editedOrder.status === "cancelled" ? "bg-red-500 text-white" : editedOrder.status === "delivered" ? "bg-emerald-500 text-white" : editedOrder.status === "shipping" ? "bg-cyan-500 text-white" : "bg-orange-400 text-white"}`}
                                >
                                    <option value="pending">⏳ قيد الانتظار</option>
                                    <option value="confirmed">✅ مؤكد</option>
                                    <option value="shipping">🚚 في الشحن</option>
                                    <option value="delivered">✓ تم التوصيل</option>
                                    <option value="cancelled">🚫 ملغى</option>
                                    <option value="returned">↩️ مرتجع</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Col 2: المنتج والعروض ── */}
                    <div className="space-y-4">
                        <h3 className={`text-[11px] font-black uppercase tracking-widest px-1 ${hasProduct ? 'text-purple-600' : 'text-gray-400'}`}>
                            📦 المنتج والعروض
                        </h3>

                        {hasProduct ? (
                            // ✅ العرض العادي عند وجود منتج
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">المنتج</label>
                                    <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700">
                                        {editedOrder.product?.name || editedOrder.productName || "غير محدد"}
                                    </div>
                                </div>
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

                                {variantOptions.length > 0 && (
                                    <div className="relative">
                                        <label className="text-[10px] font-bold text-gray-400 block mb-1">المتغير (مقاس / لون)</label>

                                        <button
                                            type="button"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-purple-100 bg-purple-50/30 text-sm font-bold outline-none focus:border-purple-400 transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                {editedOrder.variantDetail ? (
                                                    <>
                                                        {Array.isArray(editedOrder.variantDetail.name) && editedOrder.variantDetail.name.map((attr, i) => (
                                                            <div key={i}>
                                                                {attr.displayMode === "color" && (
                                                                    <span className="w-8 h-8 rounded-full border border-white shadow-sm block" style={{ background: attr.value }} />
                                                                )}
                                                                {attr.displayMode === "image" && (
                                                                    <img src={attr.value} className="w-8 h-8 rounded object-cover shadow-sm" alt="" />
                                                                )}
                                                            </div>
                                                        ))}
                                                        <span>
                                                            {Array.isArray(editedOrder.variantDetail.name)
                                                                ? editedOrder.variantDetail.name
                                                                    .filter(a => a.displayMode !== "color" && a.displayMode !== "image")
                                                                    .map(a => a.value).join(" / ")
                                                                : ""}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">اختر المتغير...</span>
                                                )}
                                            </div>
                                            <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </button>

                                        {isDropdownOpen && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1">
                                                {variantOptions.map((v) => {
                                                    const attributes = Array.isArray(v.name) ? v.name : [];
                                                    const textLabel = attributes
                                                        .filter(a => a.displayMode !== "color" && a.displayMode !== "image")
                                                        .map(a => a.value)
                                                        .join(" / ");

                                                    return (
                                                        <div
                                                            key={v.id}
                                                            onClick={() => {
                                                                handleVariantChange(v.id);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className="flex items-center justify-between p-2.5 hover:bg-purple-50 rounded-lg cursor-pointer transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex -space-x-1.5">
                                                                    {attributes.map((attr, idx) => (
                                                                        <div key={idx}>
                                                                            {attr.displayMode === "color" ? (
                                                                                <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: attr.value }} />
                                                                            ) : attr.displayMode === "image" ? (
                                                                                <img src={attr.value} className="w-6 h-6 rounded-md border-2 border-white shadow-sm object-cover" alt="" />
                                                                            ) : null}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="flex gap-3">
                                                                    {textLabel && <span className="text-sm font-bold border px-2 flex justify-center rounded text-gray-700">{textLabel}</span>}
                                                                    {v.price > 0 && <span className="text-[10px] text-purple-500 font-bold">{parseFloat(v.price).toLocaleString()} DA</span>}
                                                                </div>
                                                            </div>

                                                            {String(editedOrder.variantDetailId) === String(v.id) && (
                                                                <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {offers.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 block mb-1">العرض الترويجي</label>
                                        <select
                                            value={editedOrder.offerId || ""}
                                            onChange={(e) => handleOfferChange(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-orange-100 bg-orange-50/30 text-sm outline-none cursor-pointer focus:border-orange-400"
                                        >
                                            <option value="">بدون عرض</option>
                                            {offers.map((o) => (
                                                <option key={o.id} value={o.id}>{o.name} — {parseFloat(o.price).toLocaleString()} DA</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* ملخص السعر */}
                                <div className="mt-4 p-4 bg-gray-900 rounded-2xl space-y-2">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>سعر المنتج:</span>
                                        <span>{parseFloat(editedOrder.initPrice || 0).toLocaleString()} DA</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>سعر الشحن:</span>
                                        <span>{parseFloat(editedOrder.priceShip || 0).toLocaleString()} DA</span>
                                    </div>
                                    <div className="border-t border-gray-700 pt-2 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400">الإجمالي:</span>
                                        <span className="text-green-400 text-xl font-black">{parseFloat(editedOrder.totalPrice || 0).toLocaleString()} DA</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // ✅ عرض بديل عند عدم وجود منتج
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-600 mb-1">المنتج غير متوفر</p>
                                    <p className="text-xs text-gray-400 mb-2">ربما تم حذف المنتج الأصلي</p>
                                    <p className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg inline-block">
                                        لا يمكن تعديل الكمية أو المتغيرات
                                    </p>
                                </div>

                                {/* ملخص السعر فقط */}
                                <div className="p-4 bg-gray-900 rounded-2xl space-y-2">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>سعر المنتج الأصلي:</span>
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
                        )}
                    </div>
                </div>

                {/* ══ Footer ══ */}
                <div className="p-5 bg-white border-t border-gray-100 flex justify-end items-center gap-3 z-10">
                    <button onClick={onClose} className="px-6 py-2.5 text-gray-400 font-bold text-sm hover:text-gray-600">إغلاق</button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !canEdit}
                        className={`px-10 py-3 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "حفظ التعديلات"}
                    </button>
                </div>
            </div>
        </div>
    );
}