import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Save, Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';
import SectionTitle from './SectionTitle';
import CredentialField from './CredentialField';

const disabledInputCls = 'w-full px-5 py-3 bg-gray-100 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-400 cursor-not-allowed text-sm';

export default function ProfileTab({ userData, setUserData }) {
  const { t } = useTranslation('translation', { keyPrefix: 'settings' });
  const token = getAccessToken();
  const hasPassword = ['CREDENTIALS', 'CREDENTIALS_GOOGLE'].includes(userData.provider);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handlePwFieldChange = (key, val) => {
    setPwForm(p => ({ ...p, [key]: val }));
    setPwError(''); setPwSuccess('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');

    if (pwForm.next.length < 8) {
      setPwError(t('security_password_too_short'));
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError(t('security_password_mismatch'));
      return;
    }

    setPwLoading(true);
    try {
      const body = { newPassword: pwForm.next };
      if (hasPassword) body.password = pwForm.current;
      const { data } = await axios.patch(`${baseURL}/user/password`, body, { headers: { Authorization: `Bearer ${token}` } });
      setPwSuccess(data?.message || t('security_password_updated'));
      setPwForm({ current: '', next: '', confirm: '' });
      setUserData(prev => ({ ...prev, provider: prev.provider === 'GOOGLE' ? 'CREDENTIALS_GOOGLE' : prev.provider }));
    } catch (err) {
      setPwError(err.response?.data?.message || t('security_password_error'));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
        <SectionTitle>{t('personal_info')}</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('username')}</label>
            <input type="text" disabled value={userData.username} className={disabledInputCls} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('email')}</label>
            <input type="email" disabled value={userData.email} className={disabledInputCls} />
          </div>
        </div>
      </div>

      {/* ─── Security: password ─── */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
        <SectionTitle>{t('security_title')}</SectionTitle>

        {/* Password form */}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <p className="flex items-center gap-2 text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-1">
            <Lock size={13} /> {hasPassword ? t('security_change_password') : t('security_set_password')}
          </p>

          {hasPassword && (
            <CredentialField
              label={t('security_current_password')}
              fieldKey="current"
              value={pwForm.current}
              onChange={handlePwFieldChange}
              isPassword
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CredentialField
              label={t('security_new_password')}
              fieldKey="next"
              value={pwForm.next}
              onChange={handlePwFieldChange}
              isPassword
            />
            <CredentialField
              label={t('security_confirm_password')}
              fieldKey="confirm"
              value={pwForm.confirm}
              onChange={handlePwFieldChange}
              isPassword
            />
          </div>

          {pwError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-500">
              <ShieldX className="w-4 h-4 shrink-0" /> {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
              <ShieldCheck className="w-4 h-4 shrink-0" /> {pwSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={pwLoading || !pwForm.next || !pwForm.confirm || (hasPassword && !pwForm.current)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('security_save_password')}
          </button>
        </form>
      </div>
    </div>
  );
}
