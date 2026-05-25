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
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
};

export const departmentAPI = {
  getAll: (name) => api.get('/department/getAll', {
    params: name ? { name } : {},
  }),
};

export const departmentHeadsAPI = {
  /** GET /heads/getAllByFilter */
  getAll: ({ page = 0, size = 10, query, departmentId } = {}) => {
    const params = { page, size };
    if (query        !== undefined && query        !== '') params.query        = query;
    if (departmentId !== undefined && departmentId !== '') params.departmentId = departmentId;
    return api.get('/heads/getAllByFilter', { params });
  },

  /** POST /heads/create */
  create: (data) => api.post('/heads/create', data),

  /** DELETE /heads/delete/:id */
  delete: (id) => api.delete(`/heads/delete/${id}`),
};

export const attendanceAPI = {
  getTimeline: (params = {}) => {
    const { page = 0, size = 10, ...filters } = params;
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    return api.get('/attendance/timeline', {
      params: { ...cleanFilters, page, size },
    });
  },

  getTimelineByEmployee: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    return api.get('/attendance/getTimelineByEmployee', { params: cleanParams });
  },

  exportTimeline: (params = {}) => {
    const { page, size, ...filters } = params;
    const cleanParams = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    return api.get('/excel/timeline/export', {
      params: cleanParams,
      responseType: 'blob',
    });
  },

  exportEmployeeTimeline: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    return api.get('/excel/getTimelineByEmployee/export', {
      params: cleanParams,
      responseType: 'blob',
    });
  },

  exportTimelinePdf: (params = {}) => {
    const { page, size, ...filters } = params;
    const cleanParams = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    return api.get('/pdf/timeline/export', {
      params: cleanParams,
      responseType: 'blob',
    });
  },

  exportEmployeeTimelinePdf: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    return api.get('/pdf/getTimelineByEmployee/export', {
      params: cleanParams,
      responseType: 'blob',
    });
  },

  getByDateRange: (fromDate, toDate) =>
    api.get('/attendance/timeline', { params: { fromDate, toDate } }),

  getAll: (page = 0, size = 10) =>
    api.get('/attendance/timeline', { params: { page, size } }),
};

export default api;