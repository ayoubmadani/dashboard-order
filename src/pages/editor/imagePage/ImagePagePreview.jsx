// مكان الصفحة أثناء إنشاء صفحة الصور: هيكل تحميل لكل قسم، وكل صورة تظهر فور تحويلها.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ClipboardList } from 'lucide-react';
import { progressFor } from './progress';

const PLACEHOLDERS = 4; // قبل معرفة عدد الأقسام (أثناء التصميم)

function Skeleton() {
  return <div className="w-full aspect-[720/900] bg-gray-200 dark:bg-zinc-800 animate-pulse" />;
}

export default function ImagePagePreview({ preview, step, stepAt }) {
  const { t } = useTranslation();
  const slots = preview.count ?? PLACEHOLDERS;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(id);
  }, []);
  const captured = preview.images.filter(Boolean).length;
  const percent = progressFor({ step, elapsedMs: Math.max(0, now - stepAt), captured, count: preview.count || 0 });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-100 dark:bg-black/20 p-6">
      <div className="sticky top-0 z-10 max-w-[480px] mx-auto mb-4 px-4 py-3 rounded-2xl bg-gray-900 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold mb-2">
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            {step ? t(`editor.imagePage.steps.${step}`) : t('editor.generate.generating')}
            {preview.count != null && (
              <span className="text-white/60">
                {captured}/{preview.count}
              </span>
            )}
          </span>
          <span className="tabular-nums">{Math.floor(percent)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full rounded-full bg-amber-500 transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="max-w-[480px] mx-auto rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {Array.from({ length: slots }, (_, i) =>
          preview.images[i] ? (
            <img key={i} src={preview.images[i]} alt="" className="block w-full" />
          ) : (
            <Skeleton key={i} />
          ),
        )}
        <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-xs border-t border-gray-200 dark:border-zinc-800">
          <ClipboardList size={14} />
          {t('editor.blocks.productForm.label')}
        </div>
      </div>
    </div>
  );
}
