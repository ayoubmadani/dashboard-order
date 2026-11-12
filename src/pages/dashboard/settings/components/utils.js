import { Store, Package, FileText, TrendingUp, Globe } from 'lucide-react';

export const isFree = (plan) =>
  Number(plan?.monthlyPrice ?? 0) === 0 && Number(plan?.yearlyPrice ?? 0) === 0;

export const getPlanPrice = (plan, interval) =>
  interval === 'year' ? Number(plan?.yearlyPrice ?? 0) : Number(plan?.monthlyPrice ?? 0);

// السنوي يُعرض بما يعادله شهرياً (12000/سنة ← 1000/شهر)، والمبلغ المدفوع فعلاً يظهر في سطر «تُدفع … سنوياً»
export const perMonth = (amount, interval) => (interval === 'year' ? Math.round(Number(amount) / 12) : Number(amount));

export const getDiscountedPrice = (price, couponInfo) => {
  if (!couponInfo || price <= 0) return price;
  const discount = couponInfo.discountType === 'percentage'
    ? price * (Number(couponInfo.discountValue) / 100)
    : Number(couponInfo.discountValue);
  return Math.max(0, Number((price - Math.min(discount, price)).toFixed(2)));
};

// -1 = بلا حد
const lim = (n) => (Number(n) < 0 ? '∞' : n);

export const buildFeatureSummary = (features, t) => {
  if (!features) return [];
  const rows = [];
  if (features.storeNumber) rows.push({ icon: Store, text: `${lim(features.storeNumber)} ${t('feat_stores')}` });
  if (features.productNumber) rows.push({ icon: Package, text: `${lim(features.productNumber)} ${t('feat_products')}` });
  if (features.landingPageNumber) rows.push({ icon: FileText, text: `${lim(features.landingPageNumber)} ${t('feat_pages')}` });
  if (features.domainNumber) rows.push({ icon: Globe, text: `${lim(features.domainNumber)} ${t('feat_domains')}` });
  if (features.orderNumber != null) rows.push({ icon: Package, text: `${lim(features.orderNumber)} ${t('feat_orders')}` });
  if (Number(features.orderNumber) >= 0 && Number(features.commission) > 0)
    rows.push({ icon: TrendingUp, text: `${Number(features.commission)} ${t('feat_extra_order')}` });
  return rows;
};
