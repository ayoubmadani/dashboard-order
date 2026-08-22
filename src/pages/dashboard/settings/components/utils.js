import { Store, Package, FileText, TrendingUp } from 'lucide-react';

export const isFree = (plan) =>
  Number(plan?.monthlyPrice ?? 0) === 0 && Number(plan?.yearlyPrice ?? 0) === 0;

export const getPlanPrice = (plan, interval) =>
  interval === 'year' ? Number(plan?.yearlyPrice ?? 0) : Number(plan?.monthlyPrice ?? 0);

export const getDiscountedPrice = (price, couponInfo) => {
  if (!couponInfo || price <= 0) return price;
  const discount = couponInfo.discountType === 'percentage'
    ? price * (Number(couponInfo.discountValue) / 100)
    : Number(couponInfo.discountValue);
  return Math.max(0, Number((price - Math.min(discount, price)).toFixed(2)));
};

export const buildFeatureSummary = (features, t) => {
  if (!features) return [];
  const rows = [];
  if (features.storeNumber) rows.push({ icon: Store, text: `${features.storeNumber} ${t('feat_stores')}` });
  if (features.productNumber) rows.push({ icon: Package, text: `${features.productNumber} ${t('feat_products')}` });
  if (features.landingPageNumber) rows.push({ icon: FileText, text: `${features.landingPageNumber} ${t('feat_pages')}` });
  if (Number(features.commission) > 0)
    rows.push({ icon: TrendingUp, text: `${Number(features.commission).toFixed(1)}% ${t('feat_commission')}` });
  return rows;
};
