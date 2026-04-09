import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../constents/const.';

const Contact = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [status, setStatus] = useState({ loading: false, success: false, error: false });
  const [formData, setFormData] = useState({ username: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: false });

    try {
      // إرسال البيانات للـ DTO الذي أنشأناه في NestJS
      const response = await axios.post(`${baseURL}/admin/contact`, formData);
      
      if (response.status === 201 || response.status === 200) {
        setStatus({ loading: false, success: true, error: false });
        setFormData({ username: '', email: '', subject: '', message: '' }); // تفريغ الحقول
        
        // إخفاء رسالة النجاح بعد 5 ثوانٍ
        setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 5000);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus({ loading: false, success: false, error: true });
    }
  };

  return (
    <div className="bg-white dark:bg-brand-dark min-h-screen py-16 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            {t('contact.title', 'تواصل معنا')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
            {t('contact.subtitle', 'لديك استفسار حول MdStore؟ فريقنا جاهز للرد على أسئلتك ومساعدتك.')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* معلومات التواصل */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-50 dark:bg-zinc-900 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-zinc-800 space-y-8">
              <ContactInfoItem 
                icon={<MapPin size={20} />} 
                title={t('contact.address_label', 'العنوان')}
                content={t('contact.address_val', 'الجزائر العاصمة، الجزائر')}
                color="text-brand-primary"
                bgColor="bg-brand-primary/10"
              />
              <ContactInfoItem 
                icon={<Phone size={20} />} 
                title={t('contact.phone_label', 'الهاتف')}
                content="+213 555 00 00 00"
                color="text-brand-success"
                bgColor="bg-brand-success/10"
                isLtr={true}
              />
              <ContactInfoItem 
                icon={<Mail size={20} />} 
                title={t('contact.email_label', 'البريد الإلكتروني')}
                content="support@mdstore.dz"
                color="text-purple-600 dark:text-purple-400"
                bgColor="bg-purple-50 dark:bg-purple-500/10"
              />
            </div>

            <div className="bg-brand-primary p-8 rounded-[2rem] shadow-xl shadow-brand-primary/20 text-white relative overflow-hidden group">
              <Clock className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-500" />
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <Clock size={20} />
                {t('contact.hours_title', 'ساعات العمل')}
              </h3>
              <ul className="space-y-3 opacity-90 text-sm">
                <li className="flex justify-between border-b border-white/10 pb-2">
                  <span>{t('contact.days_work', 'الأحد - الخميس')}</span>
                  <span className="font-bold" dir="ltr">9:00 AM - 6:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>{t('contact.days_off', 'الجمعة - السبت')}</span>
                  <span className="font-bold">{t('contact.closed', 'مغلق')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* نموذج المراسلة */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-zinc-800">
            
            {/* رسائل التنبيه */}
            {status.success && (
              <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-top-4">
                <CheckCircle2 size={20} />
                <span className="font-bold">{t('contact.success_msg', 'تم إرسال رسالتك بنجاح، سنرد عليك قريباً.')}</span>
              </div>
            )}

            {status.error && (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertCircle size={20} />
                <span className="font-bold">{t('contact.error_msg', 'حدث خطأ ما، يرجى المحاولة لاحقاً.')}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mx-1">{t('contact.name_label', 'الاسم الكامل')}</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-white outline-none focus:border-brand-primary transition-all"
                    placeholder={t('contact.name_placeholder', 'أدخل اسمك الكامل')}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mx-1">{t('contact.email_label', 'البريد الإلكتروني')}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-white outline-none focus:border-brand-primary transition-all"
                    placeholder="example@mail.com"
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mx-1">{t('contact.subject_label', 'الموضوع')}</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-white outline-none focus:border-brand-primary transition-all"
                  placeholder={t('contact.subject_placeholder', 'كيف يمكننا مساعدتك؟')}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mx-1">{t('contact.message_label', 'الرسالة')}</label>
                <textarea
                  rows="5"
                  required
                  value={formData.message}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-white outline-none focus:border-brand-primary transition-all resize-none"
                  placeholder={t('contact.message_placeholder', 'اكتب رسالتك هنا...')}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={status.loading}
                className={`w-full md:w-max px-12 py-4 bg-brand-primary text-white font-black rounded-2xl transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 group active:scale-95 ${status.loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-brand-primary/90'}`}
              >
                <span>{status.loading ? t('contact.sending', 'جاري الإرسال...') : t('contact.send_btn', 'إرسال الرسالة')}</span>
                {!status.loading && (
                  <Send size={18} className={`${isRtl ? 'rotate-180' : ''} group-hover:translate-x-1 transition-transform`} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactInfoItem = ({ icon, title, content, color, bgColor, isLtr }) => (
  <div className="flex items-start gap-5">
    <div className={`w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className={`text-gray-500 dark:text-gray-400 text-sm leading-relaxed ${isLtr ? 'font-sans' : ''}`} dir={isLtr ? 'ltr' : 'auto'}>
        {content}
      </p>
    </div>
  </div>
);

export default Contact;