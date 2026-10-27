import assert from 'node:assert/strict';
import test from 'node:test';
import { readState, stateUrl, updateState, selectTasks } from '../src/features/tasks/state.js';

const tasks = [
  { id: 'a', title: 'Review keyboard navigation', status: 'done', updatedAt: '2026-10-21T10:00:00Z' },
  { id: 'b', title: 'Review mobile layout', status: 'in-progress', updatedAt: '2026-10-23T10:00:00Z' },
  { id: 'c', title: 'Write release notes', status: 'todo', updatedAt: '2026-10-22T10:00:00Z' },
  { id: 'd', title: 'Review error messages', status: 'in-progress', updatedAt: '2026-10-20T10:00:00Z' },
  { id: 'e', title: 'Update dashboard', status: 'blocked', updatedAt: '2026-10-24T10:00:00Z' },
];

test('search matches titles without case or surrounding whitespace and composes with status', () => {
  const result = selectTasks(tasks, { q: '  REVIEW  ', status: 'in-progress', sort: 'recent', page: 1 });
  assert.deepEqual(result.tasks.map(task => task.id), ['b', 'd']);
  assert.equal(result.total, 2);
});

test('sort uses update timestamps before slicing pages and does not mutate the source', () => {
  const result = selectTasks(tasks, readState('?page=2'), 2);
  assert.deepEqual(result.tasks.map(task => task.id), ['c', 'a']);
  assert.equal(result.page, 2);
  assert.equal(result.pageCount, 3);
  assert.deepEqual(tasks.map(task => task.id), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(selectTasks(tasks, readState('?sort=oldest'), 2).tasks.map(task => task.id), ['d', 'a']);
});

test('pagination handles the last partial page and clamps out-of-range bookmarks', () => {
  assert.deepEqual(selectTasks(tasks, readState('?page=999'), 2).tasks.map(task => task.id), ['d']);
  assert.equal(selectTasks(tasks, readState('?page=999'), 2).page, 3);
  const empty = selectTasks(tasks, readState('?q=no-match&page=3'), 2);
  assert.deepEqual(empty.tasks, []);
  assert.equal(empty.total, 0);
  assert.equal(empty.page, 1);
  assert.equal(empty.pageCount, 1);
});

test('URL state restores search, status, sort and page after serialization', () => {
  const state = { q: 'UI & keyboard / café', status: 'blocked', sort: 'oldest', page: 3 };
  const url = stateUrl(new URL('https://example.test/tasks?campaign=demo#activity'), state);
  const parsed = new URL(url, 'https://example.test');
  assert.deepEqual(readState(parsed.search), state);
  assert.equal(parsed.pathname, '/tasks');
  assert.equal(parsed.searchParams.get('campaign'), 'demo');
  assert.equal(parsed.hash, '#activity');
});

test('URL parsing rejects malformed pages and unsupported status and sort values', () => {
  for (const page of ['-1', '0', '1.5', 'Infinity', '2garbage', '9007199254740992']) {
    assert.equal(readState(`?page=${page}`).page, 1);
  }
  assert.deepEqual(readState('?status=unknown&sort=unknown'), { q: '', status: 'all', sort: 'recent', page: 1 });
  assert.deepEqual(readState('?q=++review++&status=done&page=2'), { q: 'review', status: 'done', sort: 'recent', page: 2 });
});

test('changing search, status or sort resets pagination but paging preserves filters', () => {
  const state = readState('?q=review&status=done&sort=oldest&page=4');
  assert.deepEqual(updateState(state, { status: 'todo' }), { q: 'review', status: 'todo', sort: 'oldest', page: 1 });
  assert.equal(updateState(state, { q: 'mobile' }).page, 1);
  assert.equal(updateState(state, { sort: 'recent' }).page, 1);
  assert.deepEqual(updateState(state, { page: 2 }), { ...state, page: 2 });
  assert.equal(updateState(state, { status: 'done' }).page, 4);
});

test('default URL values are omitted and stale query parameters are cleared', () => {
  const url = stateUrl(new URL('https://example.test/tasks?q=old&status=done&page=3&sort=oldest'), readState(''));
  assert.equal(url, '/tasks');
});

test('a saved URL restores the same filtered page and sorting after a fresh load', () => {
  const bookmarked = new URL('https://example.test/tasks?q=review&status=in-progress&sort=oldest&page=2');
  const initial = selectTasks(tasks, readState(bookmarked.search), 1);
  assert.deepEqual(initial.tasks.map(task => task.id), ['b']);
  assert.equal(initial.total, 2);
  const saved = stateUrl(bookmarked, readState(bookmarked.search));
  const refreshed = selectTasks(tasks, readState(new URL(saved, bookmarked).search), 1);
  assert.deepEqual(refreshed, initial);
  const changed = updateState(readState(bookmarked.search), { status: 'done' });
  assert.deepEqual(selectTasks(tasks, changed, 1).tasks.map(task => task.id), ['a']);
  assert.equal(changed.page, 1);
});
