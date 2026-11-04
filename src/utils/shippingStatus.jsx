import { Truck } from 'lucide-react';
import { shipStatusInfo } from './shippingStatusInfo';

// شارة حالة الطرد عند شركة التوصيل (المنطق في shippingStatusInfo.js)
/** t بـ keyPrefix 'orders' */
export function ShipStatusBadge({ order, t, className = '' }) {
  const s = shipStatusInfo(order);
  if (!s) return null;
  return (
    <span title={s.raw} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${s.tone} ${className}`}>
      <Truck size={11} className="shrink-0" />{t(`ship_status.${s.code}`)}
    </span>
  );
}
