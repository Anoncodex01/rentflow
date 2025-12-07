import { Payment, Tenant, Room } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface PaymentRowProps {
  payment: Payment;
  tenant?: Tenant;
  room?: Room;
  onMarkAsPaid?: () => void;
}

export function PaymentRow({ payment, tenant, room, onMarkAsPaid }: PaymentRowProps) {
  return (
    <TableRow className="group">
      <TableCell className="font-medium">
        {tenant?.name || 'Unknown'}
      </TableCell>
      <TableCell>
        {room ? `Room ${room.roomNumber}` : '-'}
      </TableCell>
      <TableCell>{payment.monthPaidFor}</TableCell>
      <TableCell className="font-semibold">
        TZS {payment.amount.toLocaleString()}
      </TableCell>
      <TableCell>
        {payment.datePaid ? new Date(payment.datePaid).toLocaleDateString() : '-'}
      </TableCell>
      <TableCell>
        <Badge 
          className={cn(
            payment.status === 'paid' 
              ? 'bg-success/10 text-success hover:bg-success/20' 
              : 'bg-accent/10 text-accent hover:bg-accent/20'
          )}
        >
          {payment.status}
        </Badge>
      </TableCell>
      <TableCell>
        {onMarkAsPaid && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAsPaid}
            className="text-success hover:text-success hover:bg-success/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Pay
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
