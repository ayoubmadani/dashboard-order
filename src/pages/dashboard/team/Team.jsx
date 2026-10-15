import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import {
  Users, UserPlus, Shield, History, Search, Loader2, Plus, Pencil, Trash2, Power, Download, X, RotateCcw, ChevronDown,
  UserMinus, PauseCircle, PlayCircle, Check,
} from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { PERMISSIONS, isOwner } from '../../../services/storeAccess';
import NoStoreState from '../../../components/NoStoreState';

const auth = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const errMsg = (err, fallback) => {
  const m = err?.response?.data?.message;
  return (Array.isArray(m) ? m[0] : m) || fallback;
};

const card = 'bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800';
const input = 'w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40';
const btn = 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50';

// فريق المتجر (للمالك): الأعضاء، المجموعات، سجل النشاط
export default function Team() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'team' });
  const isRtl = i18n.dir() === 'rtl';
  const { selectedProject, myStores } = useOutletContext();
  const storeId = localStorage.getItem('storeId');
  const [tab, setTab] = useState('members');
  const [groups, setGroups] = useState([]);

  const loadGroups = useCallback(async () => {
    if (!storeId) return;
    try { setGroups((await axios.get(`${baseURL}/stores/${storeId}/groups`, auth())).data); } catch { /* يظهر في الأقسام */ }
  }, [storeId]);
  useEffect(() => { loadGroups(); }, [loadGroups]);

  if (!storeId) return <NoStoreState title={t('title')} subtitle="" cta="" isRtl={isRtl} />;
  if (selectedProject && !isOwner(selectedProject)) {
    return <div className={`${card} p-10 text-center text-sm text-gray-500`}>{t('owner_only_note')}</div>;
  }

  const tabs = [['members', t('tab_members'), Users], ['groups', t('tab_groups'), Shield], ['activity', t('tab_activity'), History]];
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="max-w-5xl mx-auto space-y-5">
      <Toaster position="top-center" richColors />
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <span className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl"><Users size={22} /></span>
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('subtitle')}</p>
      </div>

      <div className="inline-flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
        {tabs.map(([key, label, icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${tab === key ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
            {React.createElement(icon, { size: 15 })} {label}
          </button>
        ))}
      </div>

      {tab === 'members' && <MembersTab t={t} i18n={i18n} storeId={storeId} />}
      {tab === 'groups' && <GroupsTab t={t} storeId={storeId} groups={groups} reload={loadGroups} myStores={myStores} />}
      {tab === 'activity' && <ActivityTab t={t} i18n={i18n} storeId={storeId} />}
    </div>
  );
}

/* ══════════════════════════ الأعضاء ══════════════════════════ */
function MembersTab({ t, i18n, storeId }) {
  const [members, setMembers] = useState(null);
  const [limits, setLimits] = useState(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const [m, l] = await Promise.all([
        axios.get(`${baseURL}/stores/${storeId}/members`, auth()),
        axios.get(`${baseURL}/stores/${storeId}/team/limits`, auth()),
      ]);
      setMembers(m.data);
      setLimits(l.data);
    } catch (err) { toast.error(errMsg(err, t('error'))); setMembers([]); }
  }, [storeId, t]);
  useEffect(() => { load(); }, [load]);

  const fmt = (d) => (d ? new Date(d).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

  const lookup = async (e) => {
    e.preventDefault();
    setFound(null); setLookupError('');
    if (!q.trim()) return;
    setBusy('lookup');
    try { setFound((await axios.get(`${baseURL}/stores/${storeId}/team/user-lookup`, { ...auth(), params: { q: q.trim() } })).data); }
    catch (err) { setLookupError(errMsg(err, t('error'))); }
    finally { setBusy(null); }
  };

  const act = async (key, fn, success) => {
    setBusy(key);
    try { await fn(); if (success) toast.success(success); await load(); }
    catch (err) { toast.error(errMsg(err, t('error'))); }
    finally { setBusy(null); }
  };

  const invite = () => act('invite', async () => {
    await axios.post(`${baseURL}/stores/${storeId}/members/invite`, { userId: found.id }, auth());
    setFound(null); setQ('');
  }, t('invite_sent'));

  return (
    <div className="space-y-4">
      {/* الدعوة */}
      <div className={`${card} p-5 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-black text-gray-900 dark:text-white flex items-center gap-2"><UserPlus size={17} className="text-indigo-600" /> {t('invite')}</p>
          {limits && <span className="text-xs font-semibold text-gray-500">{t('plan_members', { used: limits.used, max: limits.max })}</span>}
        </div>
        {limits && limits.max === 0 ? (
          <p className="text-sm font-semibold text-amber-600">{t('plan_no_members')}</p>
        ) : (
          <>
            <p className="text-xs text-gray-500">{t('invite_hint')}</p>
            <form onSubmit={lookup} className="flex gap-2">
              <input dir="ltr" value={q} onChange={(e) => { setQ(e.target.value); setFound(null); setLookupError(''); }} placeholder={t('lookup_ph')} className={`${input} min-w-0`} />
              <button type="submit" disabled={busy === 'lookup' || !q.trim()} className={`${btn} bg-gray-900 dark:bg-white text-white dark:text-gray-900 shrink-0`}>
                {busy === 'lookup' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} {t('lookup')}
              </button>
            </form>
            {lookupError && <p className="text-xs font-semibold text-rose-500">{lookupError}</p>}
            {found && (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                <Avatar name={found.name} src={found.avatar} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{found.name}</p>
                  <p dir="ltr" className="text-xs text-gray-500 text-start">{found.maskedEmail}</p>
                </div>
                <button onClick={invite} disabled={busy === 'invite'} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
                  {busy === 'invite' ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} {t('send_invite')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* القائمة */}
      <div className={`${card} divide-y divide-gray-100 dark:divide-zinc-800`}>
        {members === null ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : members.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">{t('members_empty')}</p>
        ) : members.map((m) => (
          <div key={m.id} className="p-4 flex flex-wrap items-center gap-3">
            <Avatar name={m.name} src={m.avatar} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{m.name}</p>
                <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${m.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'}`}>{t(`status.${m.status}`)}</span>
                {m.suspendedByPlan && <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-900/20">{t('suspended')}</span>}
                {!m.groupId && <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-900/20">{t('no_group')}</span>}
              </div>
              <p className="text-xs text-gray-400"><span dir="ltr">{m.maskedEmail}</span> · {m.status === 'accepted' ? t('joined', { date: fmt(m.joinedAt) }) : t('invited_on', { date: fmt(m.createdAt) })}</p>
            </div>
            {m.groupName && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300">{m.groupName}</span>
            )}
            <div className="flex items-center gap-1.5">
              {m.status === 'accepted' && (
                <button disabled={busy === m.id} title={m.suspendedByPlan ? t('reactivate') : t('suspend')}
                  onClick={() => act(m.id, () => axios.patch(`${baseURL}/stores/${storeId}/members/${m.id}/suspension`, { suspended: !m.suspendedByPlan }, auth()))}
                  className={`${btn} border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300`}>
                  {m.suspendedByPlan ? <PlayCircle size={14} /> : <PauseCircle size={14} />} {m.suspendedByPlan ? t('reactivate') : t('suspend')}
                </button>
              )}
              <button disabled={busy === m.id}
                onClick={() => window.confirm(t('confirm_remove')) && act(m.id, () => axios.delete(`${baseURL}/stores/${storeId}/members/${m.id}`, auth()))}
                className={`${btn} border border-gray-200 dark:border-zinc-700 text-rose-500`}>
                <UserMinus size={14} /> {m.status === 'pending' ? t('cancel_invite') : t('remove')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Avatar({ name, src }) {
  return src
    ? <img src={src} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
    : <span className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 font-black flex items-center justify-center shrink-0">{(name || '?').charAt(0).toUpperCase()}</span>;
}

/* ══════════════════════════ المجموعات ══════════════════════════ */
function GroupsTab({ t, storeId, groups, reload, myStores }) {
  const [editing, setEditing] = useState(null); // null | {} (جديد) | group
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(null); // المجموعة التي نضيف لها أعضاء
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(null);

  const loadMembers = useCallback(async () => {
    try { setMembers((await axios.get(`${baseURL}/stores/${storeId}/members`, auth())).data); } catch { setMembers([]); }
  }, [storeId]);
  useEffect(() => { loadMembers(); }, [loadMembers]);

  const act = async (key, fn, success) => {
    setBusy(key);
    try { await fn(); if (success) toast.success(success); await Promise.all([reload(), loadMembers()]); }
    catch (err) { toast.error(errMsg(err, t('error'))); }
    finally { setBusy(null); }
  };
  const setMemberGroup = (m, groupId) => act(`m-${m.id}`, () => axios.patch(`${baseURL}/stores/${storeId}/members/${m.id}`, { groupId }, auth()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">{t('owner_only_note')}</p>
        <div className="flex gap-2">
          <button onClick={() => setImporting(true)} className={`${btn} border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200`}><Download size={14} /> {t('import_group')}</button>
          <button onClick={() => setEditing({})} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}><Plus size={14} /> {t('new_group')}</button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className={`${card} p-10 text-center text-sm text-gray-400`}>{t('groups_empty')}</div>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.id} className={`${card} p-4 space-y-3 ${g.isActive ? '' : 'opacity-70'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-black text-gray-900 dark:text-white truncate">{g.name}</p>
                  <p className="text-xs text-gray-400">{t('members_count', { count: g.memberCount ?? 0 })} · <span className={g.isActive ? 'text-emerald-600' : 'text-gray-400'}>{g.isActive ? t('active') : t('disabled')}</span></p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <IconBtn title={g.isActive ? t('disable') : t('enable')} busy={busy === g.id} onClick={() => act(g.id, () => axios.patch(`${baseURL}/stores/${storeId}/groups/${g.id}/toggle`, {}, auth()))}><Power size={15} /></IconBtn>
                  <IconBtn title={t('edit')} onClick={() => setEditing(g)}><Pencil size={15} /></IconBtn>
                  <IconBtn title={t('delete')} danger onClick={() => window.confirm(t('confirm_delete_group')) && act(g.id, () => axios.delete(`${baseURL}/stores/${storeId}/groups/${g.id}`, auth()))}><Trash2 size={15} /></IconBtn>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.permissions.length === 0 && <span className="text-xs text-gray-400">—</span>}
                {g.permissions.map((p) => <span key={p} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300">{t(`perm.${p}`)}</span>)}
              </div>
              {/* أعضاء المجموعة */}
              <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {members.filter((m) => m.groupId === g.id).map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1 ps-1 pe-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-200">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-[10px] font-black flex items-center justify-center">{(m.name || '?').charAt(0).toUpperCase()}</span>
                      {m.name}
                      <button title={t('remove_from_group')} disabled={busy === `m-${m.id}`} onClick={() => setMemberGroup(m, null)} className="text-gray-400 hover:text-rose-500 disabled:opacity-50"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <button onClick={() => setAdding(g)} disabled={!g.isActive} title={g.isActive ? undefined : t('disabled')}
                  className={`${btn} w-full py-1.5 border border-dashed border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600`}>
                  <UserPlus size={13} /> {t('add_member')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <GroupModal t={t} group={editing.id ? editing : null} onClose={() => setEditing(null)}
          onSave={(body) => act('save', () => (editing.id
            ? axios.patch(`${baseURL}/stores/${storeId}/groups/${editing.id}`, body, auth())
            : axios.post(`${baseURL}/stores/${storeId}/groups`, body, auth())).then(() => setEditing(null)))}
          saving={busy === 'save'} />
      )}
      {adding && (
        <Modal title={t('add_member_to', { group: adding.name })} onClose={() => setAdding(null)}>
          {members.filter((m) => m.groupId !== adding.id).length === 0 ? (
            <p className="text-sm text-gray-400">{t('add_member_empty')}</p>
          ) : members.filter((m) => m.groupId !== adding.id).map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar name={m.name} src={m.avatar} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{m.name}</p>
                <p className="text-xs text-gray-400">{m.groupName ? t('currently_in', { group: m.groupName }) : t('no_group')}{m.status === 'pending' ? ` · ${t('status.pending')}` : ''}</p>
              </div>
              <button onClick={() => setMemberGroup(m, adding.id)} disabled={busy === `m-${m.id}`} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
                {busy === `m-${m.id}` ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {m.groupName ? t('move_here') : t('add')}
              </button>
            </div>
          ))}
        </Modal>
      )}
      {importing && <ImportModal t={t} storeId={storeId} myStores={myStores} onClose={() => setImporting(false)} onDone={() => { setImporting(false); reload(); }} />}
    </div>
  );
}

function IconBtn({ children, onClick, title, danger, busy }) {
  return (
    <button onClick={onClick} title={title} disabled={busy}
      className={`p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 ${danger ? 'hover:text-rose-500' : 'hover:text-gray-700 dark:hover:text-zinc-200'}`}>
      {busy ? <Loader2 size={15} className="animate-spin" /> : children}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-md max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <p className="font-black text-gray-900 dark:text-white">{title}</p>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function GroupModal({ t, group, onClose, onSave, saving }) {
  const [name, setName] = useState(group?.name || '');
  const [perms, setPerms] = useState(new Set(group?.permissions || []));
  // order.manage يستلزم order.view
  const toggle = (p) => setPerms((prev) => {
    const next = new Set(prev);
    if (next.has(p)) {
      if (p === 'order.view' && next.has('order.manage')) return next;
      next.delete(p);
    } else {
      next.add(p);
      if (p === 'order.manage') next.add('order.view');
    }
    return next;
  });
  return (
    <Modal title={group ? t('edit_group') : t('new_group')} onClose={onClose}>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('group_name')}</label>
        <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={t('group_name_ph')} className={input} />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('permissions')}</label>
        <div className="space-y-1.5">
          {PERMISSIONS.map((p) => {
            const locked = p === 'order.view' && perms.has('order.manage');
            return (
              <label key={p} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer ${perms.has(p) ? 'border-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-zinc-700'} ${locked ? 'opacity-70' : ''}`}>
                <input type="checkbox" checked={perms.has(p)} disabled={locked} onChange={() => toggle(p)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">{t(`perm.${p}`)}</span>
                {p === 'order.manage' && <span className="text-[11px] text-gray-400">({t('perm_hint.order.manage')})</span>}
              </label>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">{t('owner_only_note')}</p>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave({ name: name.trim(), permissions: [...perms] })} disabled={!name.trim() || saving}
          className={`${btn} flex-1 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700`}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t('save')}
        </button>
        <button onClick={onClose} className={`${btn} px-5 border border-gray-200 dark:border-zinc-700 text-gray-600`}>{t('cancel')}</button>
      </div>
    </Modal>
  );
}

function ImportModal({ t, storeId, myStores, onClose, onDone }) {
  const [sources, setSources] = useState(null);
  const [sourceId, setSourceId] = useState('');
  const [withMembers, setWithMembers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const others = (myStores || []).filter((s) => isOwner(s) && s.id !== storeId);
    Promise.all(others.map((s) => axios.get(`${baseURL}/stores/${s.id}/groups`, auth())
      .then((r) => r.data.map((g) => ({ ...g, storeName: s.name }))).catch(() => [])))
      .then((lists) => setSources(lists.flat()));
  }, [myStores, storeId]);

  const run = async () => {
    setBusy(true);
    try {
      const { data } = await axios.post(`${baseURL}/stores/${storeId}/groups/import`, { sourceGroupId: sourceId, includeMembers: withMembers }, auth());
      setResult(data);
      toast.success(t('import_done', { name: data.group.name }));
    } catch (err) { toast.error(errMsg(err, t('error'))); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={t('import_group')} onClose={result ? onDone : onClose}>
      {sources === null ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : sources.length === 0 ? (
        <p className="text-sm text-gray-400">{t('import_none')}</p>
      ) : result ? (
        <div className="space-y-2 text-sm">
          <p className="font-bold text-emerald-600">{t('import_done', { name: result.group.name })}</p>
          {result.skipped.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-600">{t('import_skipped', { count: result.skipped.length })}</p>
              <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                {result.skipped.map((s) => <li key={s.userId} dir="ltr" className="text-start">{s.userId.slice(0, 8)}… — {t(`skip_reason.${s.reason}`)}</li>)}
              </ul>
            </div>
          )}
          <button onClick={onDone} className={`${btn} w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900`}>{t('close')}</button>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('import_source')}</label>
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={input}>
              <option value="">—</option>
              {sources.map((g) => <option key={g.id} value={g.id}>{g.storeName} — {g.name} ({t('members_count', { count: g.memberCount ?? 0 })})</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={withMembers} onChange={(e) => setWithMembers(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            {t('import_include_members')}
          </label>
          <button onClick={run} disabled={!sourceId || busy} className={`${btn} w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700`}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {t('import_group')}
          </button>
        </>
      )}
    </Modal>
  );
}

/* ══════════════════════════ سجل النشاط ══════════════════════════ */
const ENTITIES = ['product', 'category', 'domain', 'order', 'store', 'theme', 'group', 'member', 'seo'];
const ACTIONS = ['create', 'update', 'delete', 'restore'];
const RESTORABLE_DELETE = ['product', 'category', 'domain'];

function ActivityTab({ t, i18n, storeId }) {
  const [filters, setFilters] = useState({ entity: '', action: '' });
  const [data, setData] = useState({ items: [], page: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data: res } = await axios.get(`${baseURL}/stores/${storeId}/activity`, {
        ...auth(), params: { page, limit: 30, entity: filters.entity || undefined, action: filters.action || undefined },
      });
      setData((prev) => ({ ...res, items: page === 1 ? res.items : [...prev.items, ...res.items] }));
    } catch (err) { toast.error(errMsg(err, t('error'))); }
    finally { setLoading(false); }
  }, [storeId, filters, t]);
  useEffect(() => { load(1); }, [load]);

  const fmt = (d) => new Date(d).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const restore = async (item, force = false) => {
    setBusy(item.id);
    try {
      await axios.post(`${baseURL}/stores/${storeId}/activity/${item.id}/restore`, { force }, auth());
      toast.success(t('restored'));
      await load(1);
    } catch (err) {
      if (err?.response?.data?.code === 'CONFLICT_NEWER_CHANGES' && !force) {
        if (window.confirm(t('confirm_force'))) { setBusy(null); return restore(item, true); }
      } else toast.error(errMsg(err, t('error')));
    } finally { setBusy(null); }
  };

  const restorable = (i) => i.action === 'update' ? !['group', 'member'].includes(i.entity) : i.action === 'delete' && RESTORABLE_DELETE.includes(i.entity);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select value={filters.entity} onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value }))} className={`${input} w-auto`}>
          <option value="">{t('all')}</option>
          {ENTITIES.map((x) => <option key={x} value={x}>{t(`entity.${x}`)}</option>)}
        </select>
        <select value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} className={`${input} w-auto`}>
          <option value="">{t('all')}</option>
          {ACTIONS.map((x) => <option key={x} value={x}>{t(`action.${x}`)}</option>)}
        </select>
      </div>

      <div className={`${card} divide-y divide-gray-100 dark:divide-zinc-800`}>
        {data.items.length === 0 && !loading && <p className="p-8 text-center text-sm text-gray-400">{t('activity_empty')}</p>}
        {data.items.map((i) => (
          <div key={i.id} className="p-3.5">
            <div className="flex items-center gap-3">
              <Avatar name={i.user?.name} src={i.user?.avatar} />
              <button onClick={() => setOpen(open === i.id ? null : i.id)} className="min-w-0 flex-1 text-start">
                <p className="text-sm text-gray-800 dark:text-zinc-200">
                  <b>{i.user?.name || t('someone')}</b> {t(`action.${i.action}`)} {t(`entity.${i.entity}`)}
                  {i.entityName && <> «<span className="font-semibold">{i.entityName}</span>»</>}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">{fmt(i.createdAt)} {(i.before || i.after) && <ChevronDown size={12} className={open === i.id ? 'rotate-180' : ''} />}</p>
              </button>
              {restorable(i) && (
                <button onClick={() => restore(i)} disabled={busy === i.id} className={`${btn} border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 shrink-0`}>
                  {busy === i.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} {t('restore')}
                </button>
              )}
            </div>
            {open === i.id && <Changes before={i.before} after={i.after} />}
          </div>
        ))}
      </div>
      {data.page < data.pages && (
        <button onClick={() => load(data.page + 1)} disabled={loading} className={`${btn} w-full py-2.5 border border-gray-200 dark:border-zinc-700 text-gray-600`}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null} {t('load_more')}
        </button>
      )}
    </div>
  );
}

const show = (v) => (v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v).slice(0, 160) : String(v).slice(0, 160));

function Changes({ before, after }) {
  const keys = useMemo(() => [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])].slice(0, 40), [before, after]);
  if (!keys.length) return null;
  return (
    <div className="mt-2 ms-[52px] rounded-lg bg-gray-50 dark:bg-zinc-800/60 p-2.5 space-y-1 text-xs font-mono overflow-x-auto">
      {keys.map((k) => (
        <div key={k} dir="ltr" className="text-start whitespace-nowrap">
          <span className="text-gray-500">{k}: </span>
          {before && <span className="text-rose-500 line-through me-1.5">{show(before[k])}</span>}
          {after && <span className="text-emerald-600">{show(after[k])}</span>}
        </div>
      ))}
    </div>
  );
}
