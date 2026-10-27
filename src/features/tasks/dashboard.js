// @ts-check
import { loadTasks } from './data.js';
import { readState, selectTasks, stateUrl, statusLabels, updateState } from './state.js';

/** @param {HTMLElement} root @param {string} fixtureUrl */
export function initDashboard(root, fixtureUrl) {
  const form = /** @type {HTMLFormElement} */ (root.querySelector('#task-filters'));
  const search = /** @type {HTMLInputElement} */ (root.querySelector('#task-search'));
  const status = /** @type {HTMLSelectElement} */ (root.querySelector('#task-status'));
  const sort = /** @type {HTMLSelectElement} */ (root.querySelector('#task-sort'));
  const list = /** @type {HTMLUListElement} */ (root.querySelector('#task-list'));
  const results = /** @type {HTMLElement} */ (root.querySelector('#task-results'));
  const summary = /** @type {HTMLElement} */ (root.querySelector('#task-summary'));
  const loading = /** @type {HTMLElement} */ (root.querySelector('#task-loading'));
  const error = /** @type {HTMLElement} */ (root.querySelector('#task-error'));
  const empty = /** @type {HTMLElement} */ (root.querySelector('#task-empty'));
  const pagination = /** @type {HTMLElement} */ (root.querySelector('#task-pagination'));
  const previous = /** @type {HTMLButtonElement} */ (root.querySelector('#task-previous'));
  const next = /** @type {HTMLButtonElement} */ (root.querySelector('#task-next'));
  const pageLabel = /** @type {HTMLElement} */ (root.querySelector('#task-page'));
  const dialog = /** @type {HTMLDialogElement} */ (root.querySelector('#task-detail'));
  const detailTitle = /** @type {HTMLElement} */ (root.querySelector('#detail-title'));
  const detailBody = /** @type {HTMLElement} */ (root.querySelector('#detail-body'));
  const controls = form.querySelectorAll('input, select, button');
  const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  /** @type {import('./state.js').Task[]} */
  let tasks = [];
  let state = readState(location.search);
  let ready = false;
  /** @type {HTMLButtonElement | null} */
  let detailTrigger = null;

  function syncControls() {
    search.value = state.q;
    status.value = state.status;
    sort.value = state.sort;
  }

  /** @param {'push' | 'replace'} method */
  function writeUrl(method) {
    const url = stateUrl(new URL(location.href), state);
    if (url !== location.pathname + location.search + location.hash) {
      if (method === 'push') history.pushState(null, '', url);
      else history.replaceState(null, '', url);
    }
  }

  /** @param {import('./state.js').Task} task */
  function badge(task) {
    const span = document.createElement('span');
    span.className = `task-badge status-${task.status}`;
    span.textContent = statusLabels[task.status];
    return span;
  }

  /** @param {import('./state.js').Task} task */
  function updatedTime(task) {
    const time = document.createElement('time');
    time.dateTime = task.updatedAt;
    time.textContent = dateFormat.format(new Date(task.updatedAt));
    return time;
  }

  /** @param {import('./state.js').Task} task @param {HTMLButtonElement} trigger */
  function openDetails(task, trigger) {
    detailTrigger = trigger;
    detailTitle.textContent = task.title;
    const id = document.createElement('p');
    id.className = 'task-id';
    id.textContent = task.id;
    const description = document.createElement('p');
    description.textContent = task.description?.trim() || 'No description provided.';
    const fields = document.createElement('dl');
    for (const [label, content] of [
      ['Status', statusLabels[task.status]],
      ['Assignee', task.assignee?.trim() || 'Unassigned'],
      ['Updated', dateFormat.format(new Date(task.updatedAt))],
    ]) {
      const term = document.createElement('dt');
      term.textContent = label;
      const value = document.createElement('dd');
      value.textContent = content;
      fields.append(term, value);
    }
    detailBody.replaceChildren(id, description, fields);
    dialog.showModal();
  }

  function render() {
    if (!ready) return;
    const view = selectTasks(tasks, state);
    state = { ...state, page: view.page };
    writeUrl('replace');
    syncControls();
    list.replaceChildren(...view.tasks.map(task => {
      const item = document.createElement('li');
      item.className = 'task-row';
      const content = document.createElement('div');
      content.className = 'task-content';
      const id = document.createElement('span');
      id.className = 'task-id';
      id.textContent = task.id;
      const title = document.createElement('button');
      title.type = 'button';
      title.className = 'task-title';
      title.textContent = task.title;
      title.setAttribute('aria-haspopup', 'dialog');
      title.setAttribute('aria-controls', 'task-detail');
      title.addEventListener('click', () => openDetails(task, title));
      const assignee = document.createElement('span');
      assignee.className = 'task-assignee';
      assignee.textContent = task.assignee?.trim() || 'Unassigned';
      content.append(id, title, assignee);
      const activity = document.createElement('div');
      activity.className = 'task-activity';
      const updated = document.createElement('span');
      updated.className = 'task-updated';
      updated.append('Updated ', updatedTime(task));
      activity.append(badge(task), updated);
      item.append(content, activity);
      return item;
    }));
    summary.textContent = view.total
      ? `Showing ${(view.page - 1) * 10 + 1}–${Math.min(view.page * 10, view.total)} of ${view.total} tasks`
      : '0 tasks';
    results.hidden = false;
    empty.hidden = view.total !== 0;
    pagination.hidden = view.total === 0;
    previous.disabled = view.page === 1;
    next.disabled = view.page === view.pageCount;
    pageLabel.textContent = `Page ${view.page} of ${view.pageCount}`;
  }

  /** @param {Partial<import('./state.js').TaskState>} patch @param {boolean} focusResults */
  function navigate(patch, focusResults = false) {
    state = updateState(state, patch);
    // Clamp the requested page before writing a new history entry.
    state.page = selectTasks(tasks, state).page;
    writeUrl('push');
    render();
    if (focusResults) summary.focus();
  }

  function applyFilters() {
    const values = new URLSearchParams({ q: search.value, status: status.value, sort: sort.value });
    const filters = readState(values.toString());
    navigate({ q: filters.q, status: filters.status, sort: filters.sort });
  }

  form.addEventListener('submit', event => { event.preventDefault(); applyFilters(); });
  status.addEventListener('change', applyFilters);
  sort.addEventListener('change', applyFilters);
  root.querySelectorAll('[data-clear-filters]').forEach(button => {
    button.addEventListener('click', () => { navigate({ q: '', status: 'all', sort: 'recent', page: 1 }); search.focus(); });
  });
  previous.addEventListener('click', () => navigate({ page: state.page - 1 }, true));
  next.addEventListener('click', () => navigate({ page: state.page + 1 }, true));
  window.addEventListener('popstate', () => {
    if (dialog.open) dialog.close();
    state = readState(location.search);
    syncControls();
    render();
  });
  dialog.addEventListener('close', () => {
    if (detailTrigger?.isConnected) detailTrigger.focus();
    else summary.focus();
  });

  async function load() {
    ready = false;
    loading.hidden = false;
    error.hidden = true;
    results.hidden = true;
    controls.forEach(control => control.setAttribute('disabled', ''));
    root.setAttribute('aria-busy', 'true');
    try {
      tasks = await loadTasks(fixtureUrl);
      ready = true;
    } catch {
      error.hidden = false;
    } finally {
      loading.hidden = true;
      root.setAttribute('aria-busy', 'false');
      if (ready) {
        controls.forEach(control => control.removeAttribute('disabled'));
        render();
      }
    }
  }

  root.querySelector('#task-retry')?.addEventListener('click', async () => {
    await load();
    if (ready) summary.focus();
    else /** @type {HTMLButtonElement} */ (root.querySelector('#task-retry')).focus();
  });
  syncControls();
  void load();
}
