import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const departmentAPI = {
  getAll: () => api.get('/department/getAll'),
};

export const attendanceAPI = {
  /**
   * Unified /attendance/timeline endpoint.
   * Caller passes only the relevant params (one filter at a time).
   *
   * Supported combinations (matches backend priority order):
   *   { departmentId }          → ?departmentId=…
   *   { name }                  → ?name=…
   *   { date }                  → ?date=…          (LocalDate: "YYYY-MM-DD")
   *   { fromDate, toDate }      → ?fromDate=…&toDate=…  (LocalDateTime: "YYYY-MM-DDTHH:mm:ss")
   *   {}                        → all timelines
   *
   * Always adds page + size.
   */
  getTimeline: (params = {}) => {
    const { page = 0, size = 10, ...filters } = params;
    // Strip undefined/null/empty values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    return api.get('/attendance/timeline', {
      params: { ...cleanFilters, page, size },
    });
  },

  // Legacy compat
  getByDateRange: (fromDate, toDate) =>
    api.get('/attendance/timeline', {
      params: { fromDate, toDate },
    }),

  getAll: (page = 0, size = 10) =>
    api.get('/attendance/timeline', { params: { page, size } }),
};

export default api;