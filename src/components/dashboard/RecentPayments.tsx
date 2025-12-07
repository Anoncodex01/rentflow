import { Payment, Tenant, Room } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CreditCard } from 'lucide-react';

interface RecentPaymentsProps {
  payments: Payment[];
  tenants: Tenant[];
  rooms: Room[];
}

export function RecentPayments({ payments, tenants, rooms }: RecentPaymentsProps) {
  const getTenantName = (payment: Payment) => {
    return payment.tenant?.name || tenants.find(t => t.id === payment.tenantId)?.name || 'Unknown';
  };

  const getRoomNumber = (payment: Payment) => {
    return payment.room?.roomNumber || rooms.find(r => r.id === payment.roomId)?.roomNumber || 'Unknown';
  };

  const recentPayments = payments.slice(0, 5);

  return (
    <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card border border-border">
      <h3 className="font-display text-lg font-semibold text-card-foreground mb-4">
        Recent Payments
      </h3>
      {recentPayments.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground text-sm">No payments yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentPayments.map((payment) => (
            <div 
              key={payment.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2 sm:gap-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-card-foreground truncate">
                  {getTenantName(payment)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Room {getRoomNumber(payment)} • {payment.monthPaidFor}
                </p>
              </div>
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-0">
                <p className="font-semibold text-card-foreground text-sm sm:text-base">
                  TZS {payment.amount.toLocaleString()}
                </p>
                <Badge 
                  variant={payment.status === 'paid' ? 'default' : 'secondary'}
                  className={cn(
                    "text-xs",
                    payment.status === 'paid' 
                      ? 'bg-success/10 text-success hover:bg-success/20' 
                      : 'bg-accent/10 text-accent hover:bg-accent/20'
                  )}
                >
                  {payment.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
