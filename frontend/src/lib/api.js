import axios from 'axios';
const API = process.env.REACT_APP_BACKEND_URL + '/api';
const api = axios.create({ baseURL: API, withCredentials: true });

// Projects
export const getProjects = () => api.get('/projects').then(r => r.data);
export const getProject = (id) => api.get(`/projects/${id}`).then(r => r.data);
export const createProject = (data) => api.post('/projects', data).then(r => r.data);
export const deleteProject = (id) => api.delete(`/projects/${id}`).then(r => r.data);

// Tasks
export const getTasks = (params) => api.get('/tasks', { params }).then(r => r.data);
export const getMyTasks = () => api.get('/tasks/my').then(r => r.data);
export const createTask = (projectId, data) => api.post(`/tasks?project_id=${projectId}`, data).then(r => r.data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then(r => r.data);

// Bugs
export const getBugs = (params) => api.get('/bugs', { params }).then(r => r.data);
export const getAllBugs = () => api.get('/bugs/all').then(r => r.data);
export const createBug = (projectId, data) => api.post(`/bugs?project_id=${projectId}`, data).then(r => r.data);
export const updateBug = (id, data) => api.put(`/bugs/${id}`, data).then(r => r.data);
export const deleteBug = (id) => api.delete(`/bugs/${id}`).then(r => r.data);
export const addBugAttachment = (bugId, data) => api.post(`/bugs/${bugId}/attachments`, data).then(r => r.data);
export const removeBugAttachment = (bugId, attId) => api.delete(`/bugs/${bugId}/attachments/${attId}`).then(r => r.data);

// Comments
export const getComments = (entityId, entityType = 'task') => api.get(`/comments?entity_id=${entityId}&entity_type=${entityType}`).then(r => r.data);
export const createComment = (data) => api.post('/comments', data).then(r => r.data);
export const deleteComment = (id) => api.delete(`/comments/${id}`).then(r => r.data);

// Notifications
export const getNotifications = () => api.get('/notifications').then(r => r.data);
export const getUnreadCount = () => api.get('/notifications/unread-count').then(r => r.data);
export const markAllRead = () => api.post('/notifications/mark-read').then(r => r.data);

// Members
export const getMembers = () => api.get('/members').then(r => r.data);

export default api;
