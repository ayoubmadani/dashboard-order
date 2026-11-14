// تبويبات صفحة «الفريق». الدعوات (التي تصل المستخدم للانضمام لمتاجر غيره) لكل مستخدم؛
// إدارة الأعضاء والمجموعات والسجل لمالك المتجر المختار فقط.
export function teamTabs({ owner, hasStore }) {
  return owner && hasStore ? ['members', 'groups', 'activity', 'invitations'] : ['invitations'];
}

/** التبويب الأول عند الفتح: ?tab=… إن كان متاحاً، وإلا الأول */
export function initialTeamTab(search, tabs) {
  const wanted = new URLSearchParams(search || '').get('tab');
  return tabs.includes(wanted) ? wanted : tabs[0];
}

/** عنصر «الفريق» في القائمة: للمالك دائماً، ولغيره ما دامت عنده دعوة معلّقة */
export function showTeamInNav({ owner, invitations }) {
  return !!owner || invitations > 0;
}
