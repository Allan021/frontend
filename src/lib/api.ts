import axios from 'axios';

export const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4001';

// ─── Axios instances ──────────────────────────────────────────────────────────
export const publicApi = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

export const adminApi = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

// Attach token on every admin request
adminApi.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ricky_token') : null;
  if (token && token !== 'undefined' && token !== 'null') {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Refresh token interceptor
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token as string);
  });
  failedQueue = [];
};

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', 'Bearer ' + token);
          } else {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return adminApi(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('ricky_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('ricky_token', data.token);
        localStorage.setItem('ricky_refresh_token', data.refreshToken);
        
        adminApi.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
        if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
          originalRequest.headers.set('Authorization', 'Bearer ' + data.token);
        } else {
          originalRequest.headers['Authorization'] = 'Bearer ' + data.token;
        }
        
        processQueue(null, data.token);
        return adminApi(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  price: number;
  active: boolean;
  sort_order: number;
}

export interface BusinessSettings {
  id: number;
  is_open: boolean;
  cash_surcharge: number;
  daily_goal: number;
}

export interface Appointment {
  id: string;
  client_name: string;
  client_contact: string;
  contact_type: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  payment_method: string;
  status: string;
  transfer_image_url?: string;
  created_at: string;
  services?: { name: string; price: number }[];
}

export interface DashboardStats {
  today: { cuts: number; earnings: number; tips: number };
  dailyGoal: number;
  range: { cuts: number; earnings: number; tips: number };
  chartData: { date: string; cuts: number; earnings: number; tips: number }[];
  pendingAppointments: number;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const queryKeys = {
  services: ['services'] as const,
  allServices: ['services', 'all'] as const,
  settings: ['settings'] as const,
  publicSettings: ['settings', 'public'] as const,
  appointments: ['appointments'] as const,
  bookedSlots: ['appointments', 'booked'] as const,
  dashboard: (from?: string, to?: string) => ['dashboard', from, to] as const,
};

// ─── Public API calls ─────────────────────────────────────────────────────────
export const fetchPublicSettings = async (): Promise<BusinessSettings> => {
  const { data } = await publicApi.get('/settings/public');
  return data;
};

export const fetchPublicServices = async (): Promise<Service[]> => {
  const { data } = await publicApi.get('/services');
  return data;
};

export const submitAppointment = async (formData: FormData) => {
  const { data } = await publicApi.post('/appointments', formData);
  return data;
};

export const fetchBookedSlots = async (): Promise<{ appointment_date: string, appointment_time: string }[]> => {
  const { data } = await publicApi.get(`/appointments/booked?t=${Date.now()}`);
  return data;
};

// ─── Admin API calls ──────────────────────────────────────────────────────────
export const fetchAdminSettings = async (): Promise<BusinessSettings> => {
  const { data } = await adminApi.get('/settings');
  return data;
};

export const updateSettings = async (updates: Partial<BusinessSettings>) => {
  const { data } = await adminApi.patch('/settings', updates);
  return data;
};

export const fetchAllServices = async (): Promise<Service[]> => {
  const { data } = await adminApi.get('/services/all');
  return data;
};

export const createService = async (payload: { name: string; price: number; sort_order?: number }) => {
  const { data } = await adminApi.post('/services', payload);
  return data;
};

export const updateService = async (id: string, updates: Partial<Service>) => {
  const { data } = await adminApi.patch(`/services/${id}`, updates);
  return data;
};

export const deleteService = async (id: string) => {
  const { data } = await adminApi.delete(`/services/${id}`);
  return data;
};

export const fetchAppointments = async (): Promise<Appointment[]> => {
  const { data } = await adminApi.get('/appointments');
  return data;
};

export const updateAppointmentStatus = async (id: string, status: string, tip?: number) => {
  const { data } = await adminApi.patch(`/appointments/${id}`, { status, tip });
  return data;
};

export const fetchDashboardStats = async (from?: string, to?: string): Promise<DashboardStats> => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const { data } = await adminApi.get(`/dashboard/stats?${params}`);
  return data;
};
