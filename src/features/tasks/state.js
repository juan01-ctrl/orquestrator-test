// @ts-check

/** @typedef {'todo' | 'in-progress' | 'blocked' | 'done'} TaskStatus */
/** @typedef {{ id: string, title: string, status: TaskStatus, updatedAt: string, assignee?: string, description?: string }} Task */
/** @typedef {{ q: string, status: TaskStatus | 'all', sort: 'recent' | 'oldest', page: number }} TaskState */

/** @type {Record<TaskStatus, string>} */
export const statusLabels = { todo: 'To do', 'in-progress': 'In progress', blocked: 'Blocked', done: 'Done' };

/** @param {string} search @returns {TaskState} */
export function readState(search) {
  const params = new URLSearchParams(search);
  const status = params.get('status') ?? 'all';
  const page = Number(params.get('page') ?? 1);
  return {
    q: (params.get('q') ?? '').trim(),
    status: Object.hasOwn(statusLabels, status) ? /** @type {TaskStatus} */ (status) : 'all',
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'recent',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

/** @param {TaskState} state @param {Partial<TaskState>} patch @returns {TaskState} */
export function updateState(state, patch) {
  const next = { ...state, ...patch };
  if (next.q !== state.q || next.status !== state.status || next.sort !== state.sort) next.page = 1;
  return next;
}

/** @param {URL} current @param {TaskState} state */
export function stateUrl(current, state) {
  const url = new URL(current);
  for (const [key, value, fallback] of [
    ['q', state.q, ''], ['status', state.status, 'all'],
    ['sort', state.sort, 'recent'], ['page', String(state.page), '1'],
  ]) {
    if (value === fallback) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  return url.pathname + url.search + url.hash;
}

/** @param {Task[]} tasks @param {TaskState} state @param {number} pageSize */
export function selectTasks(tasks, state, pageSize = 10) {
  const query = state.q.trim().toLowerCase();
  const filtered = tasks.filter(task => task.title.toLowerCase().includes(query)
    && (state.status === 'all' || task.status === state.status));
  filtered.sort((a, b) => {
    const difference = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    return (state.sort === 'oldest' ? -difference : difference) || a.id.localeCompare(b.id);
  });
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, state.page), pageCount);
  return { tasks: filtered.slice((page - 1) * pageSize, page * pageSize), total, page, pageCount };
}
