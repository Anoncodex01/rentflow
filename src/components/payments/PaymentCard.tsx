import { Payment, Tenant, Room } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentCardProps {
  payment: Payment;
  tenant?: Tenant;
  room?: Room;
  onMarkAsPaid?: () => void;
}

export function PaymentCard({ payment, tenant, room, onMarkAsPaid }: PaymentCardProps) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-card border border-border space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{tenant?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Home className="h-3.5 w-3.5" />
            <span>{room ? `Room ${room.roomNumber}` : '-'}</span>
          </div>
        </div>
        <Badge 
          className={cn(
            payment.status === 'paid' 
              ? 'bg-success/10 text-success' 
              : 'bg-accent/10 text-accent'
          )}
        >
          {payment.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">{payment.monthPaidFor}</p>
          <p className="text-lg font-bold text-foreground">TZS {payment.amount.toLocaleString()}</p>
        </div>
        {payment.datePaid && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(payment.datePaid).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {onMarkAsPaid && (
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkAsPaid}
          className="w-full text-success hover:text-success hover:bg-success/10"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Mark as Paid
        </Button>
      )}
    </div>
  );
}

