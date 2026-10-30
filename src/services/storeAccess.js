// صلاحيات المستخدم في المتجر الحالي — المالك يملك كل شيء، والعضو حسب مجموعته (من /stores/user/me)
export const PERMISSIONS = ['store.update', 'product.crud', 'category.crud', 'order.view', 'order.manage', 'domain.crud', 'seo.manage', 'delivery.rates', 'delivery.account', 'messages.read'];

export const isOwner = (store) => !store || store.role !== 'member';

export const can = (store, permission) =>
  isOwner(store) || (Array.isArray(store.permissions) && store.permissions.includes(permission));

// رموز 403 التي تعني فقدان الوصول للمتجر كله ← العودة لقائمة المتاجر
export const ACCESS_LOSS_CODES = ['PLAN_EXPIRED', 'MEMBER_SUSPENDED', 'GROUP_DISABLED', 'NOT_A_MEMBER', 'NO_GROUP'];
