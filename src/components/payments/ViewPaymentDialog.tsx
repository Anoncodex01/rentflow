import { Payment, Tenant, Room } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CreditCard, User, Home, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GroupedPayment {
  batchId: string;
  payments: Payment[];
  tenant?: Tenant;
  room?: Room;
  totalAmount: number;
  status: 'paid' | 'pending';
  datePaid?: string;
  startMonth: string;
  endMonth: string;
  monthCount: number;
}

interface ViewPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedPayment: GroupedPayment | null;
}

export function ViewPaymentDialog({
  open,
  onOpenChange,
  groupedPayment,
}: ViewPaymentDialogProps) {
  if (!groupedPayment) return null;

  const { payments, tenant, room, totalAmount, status, datePaid, startMonth, endMonth, monthCount } = groupedPayment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <CreditCard className="h-5 w-5 text-primary-foreground" />
            </div>
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge 
              className={cn(
                "text-sm px-4 py-2",
                status === 'paid' 
                  ? 'bg-success/10 text-success' 
                  : 'bg-accent/10 text-accent'
              )}
            >
              {status === 'paid' ? (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Paid</>
              ) : (
                <><Clock className="h-4 w-4 mr-2" /> Pending</>
              )}
            </Badge>
          </div>

          {/* Tenant & Room Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-3 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <User className="h-4 w-4" />
                <span className="text-xs">Tenant</span>
              </div>
              <p className="font-semibold">{tenant?.name || 'Unknown'}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Home className="h-4 w-4" />
                <span className="text-xs">Room</span>
              </div>
              <p className="font-semibold">{room ? `Room ${room.roomNumber}` : 'Unknown'}</p>
            </div>
          </div>

          {/* Payment Period */}
          <div className="rounded-xl bg-primary/5 p-4 border border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Payment Period</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {monthCount === 1 ? startMonth : `${startMonth} - ${endMonth}`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {monthCount} {monthCount === 1 ? 'month' : 'months'}
            </p>
          </div>

          {/* Amount Details */}
          <div className="rounded-xl bg-muted/50 p-4 border border-border space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-medium">TZS {(totalAmount / monthCount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Number of Months</span>
              <span className="font-medium">{monthCount}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-medium">Total Amount</span>
              <span className="font-bold text-lg text-primary">
                TZS {totalAmount.toLocaleString()}
              </span>
            </div>
            {datePaid && (
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Date Paid</span>
                <span className="font-medium">
                  {new Date(datePaid).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Monthly Breakdown */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b border-border">
              <h4 className="font-medium text-sm">Monthly Breakdown</h4>
            </div>
            <div className="divide-y divide-border max-h-48 overflow-y-auto">
              {payments.map((payment, index) => (
                <div key={payment.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm">{payment.monthPaidFor}</span>
                  </div>
                  <span className="font-medium text-sm">TZS {payment.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

