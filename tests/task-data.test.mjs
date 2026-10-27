import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { loadTasks } from '../src/features/tasks/data.js';

test('the labeled local fixture contains at least thirty valid tasks across statuses', async () => {
  const raw = await readFile(new URL('../src/features/tasks/fixture.json', import.meta.url), 'utf8');
  const tasks = await loadTasks(`data:application/json,${encodeURIComponent(raw)}`);
  assert.ok(tasks.length >= 30);
  assert.deepEqual([...new Set(tasks.map(task => task.status))].sort(), ['blocked', 'done', 'in-progress', 'todo']);
  assert.equal(new Set(tasks.map(task => task.id)).size, tasks.length);
  assert.ok(tasks.some(task => !task.assignee && !task.description));
  assert.ok(tasks.some(task => task.title.length > 150));
});

test('loading failures reject and a subsequent retry can succeed', async () => {
  let attempts = 0;
  const fetchFixture = async () => ++attempts === 1
    ? new Response('', { status: 503 })
    : Response.json([{ id: '1', title: 'Recovered task', status: 'done', updatedAt: '2026-10-20T00:00:00Z' }]);
  await assert.rejects(loadTasks('/fixture.json', fetchFixture), /load/i);
  assert.equal((await loadTasks('/fixture.json', fetchFixture))[0].title, 'Recovered task');
});

test('network failures and malformed fixture data reject instead of showing an empty list', async () => {
  await assert.rejects(loadTasks('/fixture.json', async () => { throw new Error('offline'); }), /offline/);
  for (const data of [null, {}, [{ id: '1' }], [{ id: '1', title: 'Task', status: 'unknown', updatedAt: 'bad-date' }]]) {
    await assert.rejects(loadTasks('/fixture.json', async () => Response.json(data)), /invalid/i);
  }
});

test('an empty valid dataset is preserved for the dashboard empty state', async () => {
  assert.deepEqual(await loadTasks('/fixture.json', async () => Response.json([])), []);
});

test('duplicate task identifiers and malformed optional fields are rejected', async () => {
  const task = { id: '1', title: 'Task', status: 'todo', updatedAt: '2026-10-20T00:00:00Z' };
  for (const data of [[task, task], [{ ...task, assignee: 42 }], [{ ...task, description: null }]]) {
    await assert.rejects(loadTasks('/fixture.json', async () => Response.json(data)), /invalid/i);
  }
});
