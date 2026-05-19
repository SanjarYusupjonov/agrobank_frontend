import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Department APIs
export const departmentAPI = {
  getAll: () => api.get('/department/getAll'),
};

// Attendance APIs
export const attendanceAPI = {
  getAll: () => api.get('/attendance/timeline'),
  getAllTimelinesByDepartment: (departmentId) =>
    api.get('/attendance/timelineByDepartment', { params: { departmentId } }),
  searchByName: (name) =>
    api.get('/attendance/timelineByName', { params: { name } }),
  getByDateRange: (fromDate, toDate) =>
    api.get('/attendance/getByDateRange', { params: { fromDate, toDate } }),
};

export default api;
