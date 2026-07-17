import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Save, Rocket, Loader2, ExternalLink, Circle, Settings2 } from 'lucide-react';

export default function Topbar({ name, dirty, saving, publishing, publishedUrl, onSave, onPublish, onOpenSettings, isRtl, isDemo }) {
  const { t } = useTranslation();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <header className="h-14 shrink-0 flex items-center justify-between gap-4 px-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/dashboard/landing-pages"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          title={t('editor.topbar.backToList')}
        >
          <BackIcon size={18} />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">{name || t('editor.list.untitled')}</h1>
            {isDemo && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                DEMO
              </span>
            )}
          </div>
          {dirty && (
            <span className="flex items-center gap-1 text-[11px] text-amber-500">
              <Circle size={6} fill="currentColor" />
              {t('editor.topbar.unsavedChanges')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {publishedUrl && (
          <a
            href={publishedUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink size={13} />
            {t('editor.topbar.viewPublished')}
          </a>
        )}

        <button
          onClick={onOpenSettings}
          title={t('editor.pageSettings.title')}
          className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Settings2 size={17} />
        </button>

        <button
          onClick={onSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {t('editor.topbar.save')}
        </button>

        <button
          onClick={onPublish}
          disabled={publishing}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm"
        >
          {publishing ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
          {t('editor.topbar.publish')}
        </button>
      </div>
    </header>
  );
}
