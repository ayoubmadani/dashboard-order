import { describe, expect, it } from 'vitest';
import { upsertAccount, removeAccount, markExpired, setAccountStore, nextAccount, canAddAccount, tokenUserId, MAX_ACCOUNTS } from './accounts';

const jwt = (payload) => `x.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.y`;

describe('dashboard accounts (like the app)', () => {
  it('reads the user id from the token', () => {
    expect(tokenUserId(jwt({ sub: 'u1' }))).toBe('u1');
    expect(tokenUserId('bad')).toBeNull();
  });

  it('adds a new account at the end and updates an existing one in place (keeps its store)', () => {
    let list = upsertAccount([], { id: 'a', name: 'A', email: 'a@x', token: 't1', storeId: 's1' });
    list = upsertAccount(list, { id: 'b', name: 'B', email: 'b@x', token: 't2' });
    list = upsertAccount(list, { id: 'a', name: 'A2', email: 'a@x', token: 't3' });
    expect(list.map((x) => [x.id, x.name, x.token, x.storeId])).toEqual([['a', 'A2', 't3', 's1'], ['b', 'B', 't2', null]]);
  });

  it('a re-login clears the expired mark', () => {
    let list = markExpired([{ id: 'a', token: 't' }], 'a');
    expect(list[0].expired).toBe(true);
    list = upsertAccount(list, { id: 'a', token: 't2' });
    expect(list[0].expired).toBe(false);
  });

  it('remembers the store per account', () => {
    expect(setAccountStore([{ id: 'a', storeId: null }], 'a', 's9')[0].storeId).toBe('s9');
  });

  it('after logout, moves to the next account whose session is still valid', () => {
    const list = [{ id: 'a' }, { id: 'b', expired: true }, { id: 'c' }];
    expect(nextAccount(list, 'a').id).toBe('c');
    expect(nextAccount(removeAccount(list, 'c'), 'a')).toBeNull();
  });

  it('caps the number of accounts', () => {
    expect(canAddAccount(Array.from({ length: MAX_ACCOUNTS }, (_, i) => ({ id: String(i) })))).toBe(false);
    expect(canAddAccount([])).toBe(true);
  });
});
