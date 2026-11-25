// حظر من الإدارة على متاجر التاجر أو منتجاته: شريط أحمر بالسبب والمدة (GET /bans/mine)
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getAccessToken } from '../services/access-token';
import { baseURL } from '../constents/const.';

const S = {
  ar: { store: 'متجرك «{n}» موقوف من الإدارة', product: 'المنتج «{n}» محظور من الإدارة ولا يظهر في متجرك', reason: 'السبب', until: 'حتى', contact: 'للاستفسار تواصل مع الدعم.' },
  fr: { store: 'Votre boutique « {n} » est suspendue par l’administration', product: 'Le produit « {n} » est bloqué par l’administration', reason: 'Motif', until: 'jusqu’au', contact: 'Contactez le support pour plus d’infos.' },
  en: { store: 'Your store “{n}” is suspended by the administration', product: 'Product “{n}” is blocked by the administration', reason: 'Reason', until: 'until', contact: 'Contact support for details.' },
};

/** رسالة حظر الحساب (عند الدخول أو أثناء الجلسة) */
export function bannedMessage(data, lang = 'ar') {
  const l = lang === 'fr' ? 'fr' : lang === 'en' ? 'en' : 'ar';
  const head = { ar: 'حسابك محظور من الإدارة', fr: 'Votre compte est banni par l’administration', en: 'Your account is banned by the administration' }[l];
  const until = data?.until ? ` (${S[l].until} ${new Date(data.until).toLocaleDateString('en-GB')})` : '';
  return `${head}${until}${data?.reason ? ` — ${S[l].reason}: ${data.reason}` : ''}`;
}

export default function BanNotice() {
  const { i18n } = useTranslation();
  const l = i18n.language === 'fr' ? 'fr' : i18n.language === 'en' ? 'en' : 'ar';
  const [bans, setBans] = useState([]);
  useEffect(() => {
    axios.get(`${baseURL}/bans/mine`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
      .then((r) => setBans(Array.isArray(r.data) ? r.data : []))
      .catch(() => { });
  }, []);
  if (!bans.length) return null;
  return (
    <div role="alert" className="mb-4 space-y-2">
      {bans.map((b) => (
        <div key={`${b.targetType}-${b.targetId}`} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 text-sm">
          <p className="font-bold">⛔ {S[l][b.targetType === 'store' ? 'store' : 'product'].replace('{n}', b.name)}{b.until ? ` (${S[l].until} ${new Date(b.until).toLocaleDateString('en-GB')})` : ''}</p>
          <p className="mt-1">{S[l].reason}: {b.reason}</p>
          {b.targetType === 'store' && <p className="mt-1 opacity-80 text-xs">{S[l].contact}</p>}
        </div>
      ))}
    </div>
  );
}
