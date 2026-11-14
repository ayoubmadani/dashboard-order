import { describe, expect, it } from 'vitest';
import { teamTabs, initialTeamTab, showTeamInNav } from './teamTabs';

// «الدعوات» صارت تبويباً داخل «الفريق». الدعوات تصل لأي مستخدم (ليس المالك فقط)،
// فمن لا يملك المتجر المختار يرى تبويب الدعوات وحده.
describe('team tabs', () => {
  it('the owner of the selected store sees the three tabs, then invitations', () => {
    expect(teamTabs({ owner: true, hasStore: true })).toEqual(['members', 'groups', 'activity', 'invitations']);
  });

  it('a member of someone else\'s store, or a user without a store, sees only invitations', () => {
    expect(teamTabs({ owner: false, hasStore: true })).toEqual(['invitations']);
    expect(teamTabs({ owner: true, hasStore: false })).toEqual(['invitations']);
  });

  it('?tab=invitations opens that tab; an unknown or unavailable tab falls back to the first', () => {
    const all = teamTabs({ owner: true, hasStore: true });
    expect(initialTeamTab('?tab=invitations', all)).toBe('invitations');
    expect(initialTeamTab('', all)).toBe('members');
    expect(initialTeamTab('?tab=nope', all)).toBe('members');
    expect(initialTeamTab('?tab=groups', ['invitations'])).toBe('invitations');
  });

  it('the Team menu item: always for the owner, for others only while an invitation is pending', () => {
    expect(showTeamInNav({ owner: true, invitations: 0 })).toBe(true);
    expect(showTeamInNav({ owner: false, invitations: 0 })).toBe(false);
    expect(showTeamInNav({ owner: false, invitations: 2 })).toBe(true);
  });
});
