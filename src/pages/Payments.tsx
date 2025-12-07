import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { ViewPaymentDialog, GroupedPayment } from '@/components/payments/ViewPaymentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePayments, useTenants, useRooms, useAlerts } from '@/hooks/use-api';
import { Plus, Search, Filter, CreditCard, TrendingUp, Clock, CheckCircle2, Loader2, Eye, Download } from 'lucide-react';
import { CreatePaymentData, Payment } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { exportDetailedPaymentsToExcel, PaymentDetailExportData } from '@/lib/export-excel';

// Helper function to parse month string to date for sorting
const parseMonthToDate = (monthStr: string): Date => {
  const [month, year] = monthStr.split(' ');
  const monthIndex = new Date(Date.parse(month + " 1, 2000")).getMonth();
  return new Date(parseInt(year), monthIndex, 1);
};

// Generate a grouping key for payments without batchId
const generateGroupKey = (payment: Payment): string => {
  if (payment.batchId) {
    return payment.batchId;
  }
  // Group by tenant + room + datePaid + status + createdAt (within same minute)
  const createdDate = new Date(payment.createdAt);
  const createdMinute = `${createdDate.getFullYear()}-${createdDate.getMonth()}-${createdDate.getDate()}-${createdDate.getHours()}-${createdDate.getMinutes()}`;
  return `legacy_${payment.tenantId}_${payment.roomId}_${payment.datePaid || 'pending'}_${payment.status}_${createdMinute}`;
};

// Group payments by batchId or by tenant+room+date for legacy payments
const groupPayments = (payments: Payment[]): GroupedPayment[] => {
  const groups = new Map<string, Payment[]>();
  
  payments.forEach(payment => {
    const key = generateGroupKey(payment);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(payment);
  });

  return Array.from(groups.entries()).map(([batchId, groupPayments]) => {
    // Sort payments by month
    const sortedPayments = [...groupPayments].sort((a, b) => {
      return parseMonthToDate(a.monthPaidFor).getTime() - parseMonthToDate(b.monthPaidFor).getTime();
    });

    const firstPayment = sortedPayments[0];
    const lastPayment = sortedPayments[sortedPayments.length - 1];
    
    return {
      batchId,
      payments: sortedPayments,
      tenant: firstPayment.tenant,
      room: firstPayment.room,
      totalAmount: sortedPayments.reduce((sum, p) => sum + p.amount, 0),
      status: firstPayment.status,
      datePaid: firstPayment.datePaid,
      startMonth: firstPayment.monthPaidFor,
      endMonth: lastPayment.monthPaidFor,
      monthCount: sortedPayments.length,
    };
  }).sort((a, b) => {
    // Sort by creation date (most recent first)
    return new Date(b.payments[0].createdAt).getTime() - new Date(a.payments[0].createdAt).getTime();
  });
};

const Payments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedGroupedPayment, setSelectedGroupedPayment] = useState<GroupedPayment | null>(null);
  const { payments, isLoading: paymentsLoading, addPayment, markAsPaid } = usePayments();
  const { tenants, isLoading: tenantsLoading } = useTenants();
  const { rooms, isLoading: roomsLoading } = useRooms();
  const { alerts } = useAlerts();
  const { toast } = useToast();

  const isLoading = paymentsLoading || tenantsLoading || roomsLoading;

  // Group payments
  const groupedPayments = useMemo(() => groupPayments(payments), [payments]);

  const filteredGroupedPayments = groupedPayments.filter(group => {
    const matchesSearch = group.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          group.startMonth.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          group.endMonth.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const paidCount = groupedPayments.filter(g => g.status === 'paid').length;
  const pendingCount = groupedPayments.filter(g => g.status === 'pending').length;
  const alertCount = alerts.filter(a => !a.isRead).length;

  const handleAddPayment = async (newPaymentData: CreatePaymentData) => {
    await addPayment(newPaymentData);
  };

  const handleView = (groupedPayment: GroupedPayment) => {
    setSelectedGroupedPayment(groupedPayment);
    setIsViewDialogOpen(true);
  };

  const handleMarkAsPaid = async (groupedPayment: GroupedPayment) => {
    try {
      // Mark all payments in the group as paid
      for (const payment of groupedPayment.payments) {
        if (payment.status === 'pending') {
          await markAsPaid(payment.id);
        }
      }
      toast({
        title: 'Payments Updated',
        description: `${groupedPayment.monthCount} payment(s) marked as paid.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update payments',
        variant: 'destructive',
      });
    }
  };

  const handleExportToExcel = () => {
    // Prepare detailed payment data for export
    const exportData: PaymentDetailExportData[] = [];
    
    filteredGroupedPayments.forEach(group => {
      group.payments.forEach(payment => {
        exportData.push({
          tenant: group.tenant?.name || 'Unknown',
          room: group.room ? `Room ${group.room.roomNumber}` : 'Unknown',
          month: payment.monthPaidFor,
          amount: payment.amount,
          datePaid: payment.datePaid 
            ? new Date(payment.datePaid).toLocaleDateString() 
            : '-',
          status: payment.status,
        });
      });
    });

    if (exportData.length === 0) {
      toast({
        title: 'No Data',
        description: 'There are no payments to export.',
        variant: 'destructive',
      });
      return;
    }

    try {
      exportDetailedPaymentsToExcel(exportData, 'rentflow-payments');
      toast({
        title: 'Export Successful',
        description: `${exportData.length} payment records exported to Excel.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export payments to Excel.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Layout title="Payments" alertCount={0}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Payments" alertCount={alertCount}>
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{groupedPayments.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-success/10 shrink-0">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-success truncate">TZS {totalPaid.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{paidCount} Paid</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-accent/10 shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-accent truncate">TZS {totalPending.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{pendingCount} Pending</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  TZS {(totalPaid + totalPending).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Expected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={handleExportToExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              className="gradient-primary text-primary-foreground shadow-glow flex-1 sm:flex-none"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Mobile: Card view */}
        <div className="block sm:hidden space-y-3">
          {filteredGroupedPayments.map((group) => (
            <div 
              key={group.batchId} 
              className="rounded-xl bg-card p-4 shadow-card border border-border space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{group.tenant?.name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    {group.room ? `Room ${group.room.roomNumber}` : '-'}
                  </p>
                </div>
                <Badge 
                  className={cn(
                    group.status === 'paid' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-accent/10 text-accent'
                  )}
                >
                  {group.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {group.monthCount === 1 
                      ? group.startMonth 
                      : `${group.startMonth} - ${group.endMonth}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.monthCount} {group.monthCount === 1 ? 'month' : 'months'}
                  </p>
                </div>
                <p className="text-lg font-bold text-foreground">TZS {group.totalAmount.toLocaleString()}</p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleView(group)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {group.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-success hover:text-success hover:bg-success/10"
                    onClick={() => handleMarkAsPaid(group)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Mark Paid
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden sm:block rounded-xl bg-card shadow-card overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tenant</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Months</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroupedPayments.map((group) => (
                  <TableRow key={group.batchId}>
                    <TableCell className="font-medium">
                      {group.tenant?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {group.room ? `Room ${group.room.roomNumber}` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {group.monthCount === 1 
                          ? group.startMonth 
                          : `${group.startMonth} - ${group.endMonth}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {group.monthCount} {group.monthCount === 1 ? 'month' : 'months'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      TZS {group.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {group.datePaid 
                        ? new Date(group.datePaid).toLocaleDateString() 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          group.status === 'paid' 
                            ? 'bg-success/10 text-success hover:bg-success/20' 
                            : 'bg-accent/10 text-accent hover:bg-accent/20'
                        )}
                      >
                        {group.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleView(group)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {group.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-success hover:text-success hover:bg-success/10"
                            onClick={() => handleMarkAsPaid(group)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredGroupedPayments.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">No payments found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter' 
                  : 'Record your first payment to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Mobile empty state */}
        {filteredGroupedPayments.length === 0 && (
          <div className="block sm:hidden text-center py-12">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No payments found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter' 
                : 'Record your first payment to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            )}
          </div>
        )}

        {/* Add Payment Dialog */}
        <AddPaymentDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          tenants={tenants}
          rooms={rooms}
          onAddPayment={handleAddPayment}
        />

        {/* View Payment Dialog */}
        <ViewPaymentDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          groupedPayment={selectedGroupedPayment}
        />
      </div>
    </Layout>
  );
};

export default Payments;
