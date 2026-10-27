// @ts-check
import { statusLabels } from './state.js';

/** @param {unknown} value @returns {value is import('./state.js').Task} */
function isTask(value) {
  if (!value || typeof value !== 'object') return false;
  return 'id' in value && typeof value.id === 'string' && value.id.length > 0
    && 'title' in value && typeof value.title === 'string' && value.title.trim().length > 0
    && 'status' in value && typeof value.status === 'string' && Object.hasOwn(statusLabels, value.status)
    && 'updatedAt' in value && typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt))
    && (!('assignee' in value) || typeof value.assignee === 'string')
    && (!('description' in value) || typeof value.description === 'string');
}

/** @param {string} url @param {typeof fetch} fetchTasks @returns {Promise<import('./state.js').Task[]>} */
export async function loadTasks(url, fetchTasks = fetch) {
  const response = await fetchTasks(url);
  if (!response.ok) throw new Error('Unable to load task activity.');
  /** @type {unknown} */
  const tasks = await response.json();
  if (!Array.isArray(tasks) || !tasks.every(isTask)
    || new Set(tasks.map(task => task.id)).size !== tasks.length) {
    throw new Error('The task fixture contains invalid data.');
  }
  return tasks;
}
