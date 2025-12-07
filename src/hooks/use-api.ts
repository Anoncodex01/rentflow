import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  roomsAPI, 
  tenantsAPI, 
  paymentsAPI, 
  alertsAPI, 
  dashboardAPI,
  Room,
  Tenant,
  Payment,
  Alert,
  DashboardStats,
  CreateRoomData,
  CreateTenantData,
  CreatePaymentData
} from '@/lib/api';
import { addMonths, format, parseISO, isAfter, isBefore } from 'date-fns';

// Helper function to parse month string to date
const parseMonthString = (monthStr: string): Date => {
  const [month, year] = monthStr.split(' ');
  const monthIndex = new Date(Date.parse(month + " 1, 2000")).getMonth();
  return new Date(parseInt(year), monthIndex, 1);
};

// Calculate rent expiration for a tenant based on their payments
export const calculateRentExpiration = (tenantId: string, payments: Payment[]): { 
  lastPaidMonth: string | null;
  expiresOn: Date | null;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  status: 'paid' | 'expiring' | 'expired' | 'no_payments';
} => {
  const tenantPayments = payments.filter(p => p.tenantId === tenantId && p.status === 'paid');
  
  if (tenantPayments.length === 0) {
    return {
      lastPaidMonth: null,
      expiresOn: null,
      isExpired: true,
      daysUntilExpiry: null,
      status: 'no_payments'
    };
  }

  // Find the latest paid month
  const sortedPayments = tenantPayments.sort((a, b) => {
    const dateA = parseMonthString(a.monthPaidFor);
    const dateB = parseMonthString(b.monthPaidFor);
    return dateB.getTime() - dateA.getTime();
  });

  const lastPaidMonth = sortedPayments[0].monthPaidFor;
  const lastPaidDate = parseMonthString(lastPaidMonth);
  
  // Rent expires at the end of the last paid month (start of next month)
  const expiresOn = addMonths(lastPaidDate, 1);
  
  const now = new Date();
  const isExpired = isAfter(now, expiresOn);
  
  const timeDiff = expiresOn.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  let status: 'paid' | 'expiring' | 'expired' | 'no_payments' = 'paid';
  if (isExpired) {
    status = 'expired';
  } else if (daysUntilExpiry <= 7) {
    status = 'expiring';
  }

  return {
    lastPaidMonth,
    expiresOn,
    isExpired,
    daysUntilExpiry,
    status
  };
};

// Generic hook for data fetching
function useApiData<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch, setData };
}

// ============ ROOMS HOOKS ============
export function useRooms() {
  const { data, isLoading, error, refetch, setData } = useApiData<Room[]>(
    () => roomsAPI.getAll(),
    []
  );

  const addRoom = async (roomData: CreateRoomData) => {
    const newRoom = await roomsAPI.create(roomData);
    setData(prev => prev ? [...prev, newRoom] : [newRoom]);
    return newRoom;
  };

  const updateRoom = async (id: string, roomData: Partial<Room>) => {
    const updatedRoom = await roomsAPI.update(id, roomData);
    setData(prev => prev?.map(r => r.id === id ? updatedRoom : r) || null);
    return updatedRoom;
  };

  const deleteRoom = async (id: string) => {
    await roomsAPI.delete(id);
    setData(prev => prev?.filter(r => r.id !== id) || null);
  };

  return {
    rooms: data || [],
    isLoading,
    error,
    refetch,
    addRoom,
    updateRoom,
    deleteRoom
  };
}

// ============ TENANTS HOOKS ============
export function useTenants() {
  const { data, isLoading, error, refetch, setData } = useApiData<Tenant[]>(
    () => tenantsAPI.getAll(),
    []
  );

  const addTenant = async (tenantData: CreateTenantData) => {
    const newTenant = await tenantsAPI.create(tenantData);
    setData(prev => prev ? [...prev, newTenant] : [newTenant]);
    return newTenant;
  };

  const updateTenant = async (id: string, tenantData: Partial<Tenant>) => {
    const updatedTenant = await tenantsAPI.update(id, tenantData);
    setData(prev => prev?.map(t => t.id === id ? updatedTenant : t) || null);
    return updatedTenant;
  };

  const deleteTenant = async (id: string) => {
    await tenantsAPI.delete(id);
    setData(prev => prev?.filter(t => t.id !== id) || null);
  };

  return {
    tenants: data || [],
    isLoading,
    error,
    refetch,
    addTenant,
    updateTenant,
    deleteTenant
  };
}

// ============ PAYMENTS HOOKS ============
export function usePayments() {
  const { data, isLoading, error, refetch, setData } = useApiData<Payment[]>(
    () => paymentsAPI.getAll(),
    []
  );

  const addPayment = async (paymentData: CreatePaymentData) => {
    const newPayment = await paymentsAPI.create(paymentData);
    setData(prev => prev ? [newPayment, ...prev] : [newPayment]);
    return newPayment;
  };

  const updatePayment = async (id: string, paymentData: Partial<Payment>) => {
    const updatedPayment = await paymentsAPI.update(id, paymentData);
    setData(prev => prev?.map(p => p.id === id ? updatedPayment : p) || null);
    return updatedPayment;
  };

  const markAsPaid = async (id: string) => {
    const updatedPayment = await paymentsAPI.markAsPaid(id);
    setData(prev => prev?.map(p => p.id === id ? updatedPayment : p) || null);
    return updatedPayment;
  };

  const deletePayment = async (id: string) => {
    await paymentsAPI.delete(id);
    setData(prev => prev?.filter(p => p.id !== id) || null);
  };

  return {
    payments: data || [],
    isLoading,
    error,
    refetch,
    addPayment,
    updatePayment,
    markAsPaid,
    deletePayment
  };
}

// ============ ALERTS HOOKS ============
export function useAlerts() {
  const { data, isLoading, error, refetch, setData } = useApiData<Alert[]>(
    () => alertsAPI.getAll(),
    []
  );

  const markAsRead = async (id: string) => {
    const updatedAlert = await alertsAPI.markAsRead(id);
    setData(prev => prev?.map(a => a.id === id ? updatedAlert : a) || null);
    return updatedAlert;
  };

  const deleteAlert = async (id: string) => {
    await alertsAPI.delete(id);
    setData(prev => prev?.filter(a => a.id !== id) || null);
  };

  return {
    alerts: data || [],
    isLoading,
    error,
    refetch,
    markAsRead,
    deleteAlert
  };
}

// ============ DASHBOARD HOOKS ============
export function useDashboard() {
  const stats = useApiData<DashboardStats>(
    () => dashboardAPI.getStats(),
    []
  );

  const recentPayments = useApiData<Payment[]>(
    () => dashboardAPI.getRecentPayments(),
    []
  );

  return {
    stats: stats.data,
    recentPayments: recentPayments.data || [],
    isLoading: stats.isLoading || recentPayments.isLoading,
    error: stats.error || recentPayments.error,
    refetch: () => {
      stats.refetch();
      recentPayments.refetch();
    }
  };
}

