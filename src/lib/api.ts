// API Configuration
// In production (Railway/Render), API is on same domain
// In development, use localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

// Token management
const getToken = () => localStorage.getItem('rentflow_token');
const setToken = (token: string) => localStorage.setItem('rentflow_token', token);
const removeToken = () => localStorage.removeItem('rentflow_token');

// Generic fetch wrapper with auth
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ============ AUTH API ============
export const authAPI = {
  login: async (email: string, password: string) => {
    const data = await fetchAPI<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  logout: () => {
    removeToken();
  },

  getMe: async () => {
    return fetchAPI<{ user: User }>('/auth/me');
  },

  register: async (email: string, password: string, name: string, role?: string) => {
    const data = await fetchAPI<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
    setToken(data.token);
    return data;
  },
};

// ============ ROOMS API ============
export const roomsAPI = {
  getAll: () => fetchAPI<Room[]>('/rooms'),
  
  getById: (id: string) => fetchAPI<Room>(`/rooms/${id}`),
  
  create: (data: CreateRoomData) => 
    fetchAPI<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Room>) =>
    fetchAPI<Room>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/rooms/${id}`, {
      method: 'DELETE',
    }),
};

// ============ TENANTS API ============
export const tenantsAPI = {
  getAll: () => fetchAPI<Tenant[]>('/tenants'),
  
  getById: (id: string) => fetchAPI<Tenant>(`/tenants/${id}`),
  
  create: (data: CreateTenantData) =>
    fetchAPI<Tenant>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Tenant>) =>
    fetchAPI<Tenant>(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/tenants/${id}`, {
      method: 'DELETE',
    }),
};

// ============ PAYMENTS API ============
export const paymentsAPI = {
  getAll: () => fetchAPI<Payment[]>('/payments'),
  
  getById: (id: string) => fetchAPI<Payment>(`/payments/${id}`),
  
  create: (data: CreatePaymentData) =>
    fetchAPI<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Payment>) =>
    fetchAPI<Payment>(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  markAsPaid: (id: string) =>
    fetchAPI<Payment>(`/payments/${id}/mark-paid`, {
      method: 'PATCH',
    }),
  
  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/payments/${id}`, {
      method: 'DELETE',
    }),
};

// ============ DASHBOARD API ============
export const dashboardAPI = {
  getStats: () => fetchAPI<DashboardStats>('/dashboard/stats'),
  
  getRecentPayments: () => fetchAPI<Payment[]>('/dashboard/recent-payments'),
};

// ============ ALERTS API ============
export const alertsAPI = {
  getAll: () => fetchAPI<Alert[]>('/alerts'),
  
  create: (data: CreateAlertData) =>
    fetchAPI<Alert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  markAsRead: (id: string) =>
    fetchAPI<Alert>(`/alerts/${id}/read`, {
      method: 'PATCH',
    }),
  
  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/alerts/${id}`, {
      method: 'DELETE',
    }),
};

// ============ TYPES ============
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'viewer';
  avatar?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  roomName?: string;
  monthlyRent: number;
  status: 'occupied' | 'vacant';
  images?: string[];
  notes?: string;
  tenant?: Tenant;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  idNumber?: string;
  moveInDate: string;
  moveOutDate?: string;
  roomId: string;
  room?: Room;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  datePaid?: string;
  monthPaidFor: string;
  status: 'paid' | 'pending';
  batchId?: string;
  tenantId: string;
  tenant?: Tenant;
  roomId: string;
  room?: Room;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  type: 'rent_due' | 'rent_overdue' | 'vacant_room';
  message: string;
  roomId?: string;
  tenantId?: string;
  date: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  rooms: {
    total: number;
    occupied: number;
    vacant: number;
  };
  tenants: {
    active: number;
  };
  payments: {
    totalCollected: number;
    paidCount: number;
    pendingAmount: number;
    pendingCount: number;
  };
  alerts: number;
}

// Create data types
export interface CreateRoomData {
  roomNumber: string;
  roomName?: string;
  monthlyRent: number;
  images?: string[];
  notes?: string;
}

export interface CreateTenantData {
  name: string;
  phone: string;
  idNumber?: string;
  roomId: string;
  moveInDate: string;
}

export interface CreatePaymentData {
  tenantId: string;
  roomId: string;
  amount: number;
  datePaid?: string;
  monthPaidFor: string;
  status: 'paid' | 'pending';
  batchId?: string;
}

export interface CreateAlertData {
  type: string;
  message: string;
  roomId?: string;
  tenantId?: string;
  date?: string;
}

export interface UpdateRoomData {
  roomNumber?: string;
  roomName?: string;
  monthlyRent?: number;
  images?: string[];
  notes?: string;
}

