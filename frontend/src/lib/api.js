import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Projects
export const getProjects = () => api.get('/projects').then(r => r.data);
export const createProject = (data) => api.post('/projects', data).then(r => r.data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data).then(r => r.data);
export const deleteProject = (id) => api.delete(`/projects/${id}`).then(r => r.data);

// Tasks
export const getTasks = (params) => api.get('/tasks', { params }).then(r => r.data);
export const createTask = (projectId, data) => api.post(`/tasks?project_id=${projectId}`, data).then(r => r.data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then(r => r.data);

// Time Entries
export const getTimeEntries = (params) => api.get('/time-entries', { params }).then(r => r.data);
export const startTimer = (data) => api.post('/time-entries/start', data).then(r => r.data);
export const stopTimer = () => api.post('/time-entries/stop').then(r => r.data);
export const getActiveTimer = () => api.get('/time-entries/active').then(r => r.data);

// Goals
export const getGoals = () => api.get('/goals').then(r => r.data);
export const createGoal = (data) => api.post('/goals', data).then(r => r.data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data).then(r => r.data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`).then(r => r.data);

// Comments
export const getComments = (taskId) => api.get(`/comments?task_id=${taskId}`).then(r => r.data);
export const createComment = (data) => api.post('/comments', data).then(r => r.data);
export const deleteComment = (id) => api.delete(`/comments/${id}`).then(r => r.data);

// Attachments
export const getAttachments = (taskId) => api.get(`/attachments?task_id=${taskId}`).then(r => r.data);
export const createAttachment = (data) => api.post('/attachments', data).then(r => r.data);
export const deleteAttachment = (id) => api.delete(`/attachments/${id}`).then(r => r.data);

// Automations
export const getAutomations = (params) => api.get('/automations', { params }).then(r => r.data);
export const createAutomation = (data) => api.post('/automations', data).then(r => r.data);
export const updateAutomation = (id, data) => api.put(`/automations/${id}`, data).then(r => r.data);
export const toggleAutomation = (id) => api.post(`/automations/${id}/toggle`).then(r => r.data);
export const deleteAutomation = (id) => api.delete(`/automations/${id}`).then(r => r.data);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats').then(r => r.data);

// Members
export const getMembers = () => api.get('/members').then(r => r.data);
export const updateMemberRole = (id, role) => api.put(`/members/${id}/role?role=${role}`).then(r => r.data);

export default api;
