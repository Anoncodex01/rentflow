import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentPayments } from '@/components/dashboard/RecentPayments';
import { AlertsList } from '@/components/dashboard/AlertsList';
import { useDashboard, useAlerts, useRooms, useTenants } from '@/hooks/use-api';
import { DoorOpen, Users, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';

const Index = () => {
  const { stats, recentPayments, isLoading: dashboardLoading } = useDashboard();
  const { alerts, isLoading: alertsLoading } = useAlerts();
  const { rooms } = useRooms();
  const { tenants } = useTenants();

  const isLoading = dashboardLoading || alertsLoading;

  if (isLoading) {
    return (
      <Layout title="Dashboard" alertCount={0}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const totalRooms = stats?.rooms.total || 0;
  const occupiedRooms = stats?.rooms.occupied || 0;
  const vacantRooms = stats?.rooms.vacant || 0;
  const totalCollected = stats?.payments.totalCollected || 0;
  const pendingRent = stats?.payments.pendingAmount || 0;
  const alertCount = alerts.filter(a => !a.isRead).length;

  return (
    <Layout title="Dashboard" alertCount={alertCount}>
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Rooms"
            value={totalRooms}
            icon={<DoorOpen className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant="primary"
          />
          <StatCard
            title="Occupied"
            value={occupiedRooms}
            icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant="success"
          />
          <StatCard
            title="Vacant"
            value={vacantRooms}
            icon={<DoorOpen className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant="warning"
          />
          <StatCard
            title="Collected"
            value={`TZS ${totalCollected.toLocaleString()}`}
            icon={<CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />}
          />
        </div>

        {/* Pending Rent Alert */}
        {pendingRent > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3 sm:p-4">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0" />
            <p className="text-xs sm:text-sm font-medium text-accent">
              TZS {pendingRent.toLocaleString()} rent pending this month
            </p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <RecentPayments 
            payments={recentPayments} 
            tenants={tenants} 
            rooms={rooms} 
          />
          <AlertsList alerts={alerts} />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
