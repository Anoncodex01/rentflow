import { Tenant, Room } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { Edit, Trash2, Phone, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RentExpirationInfo {
  lastPaidMonth: string | null;
  expiresOn: Date | null;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  status: 'paid' | 'expiring' | 'expired' | 'no_payments';
}

interface TenantRowProps {
  tenant: Tenant;
  room?: Room;
  rentExpiration?: RentExpirationInfo;
  onEdit?: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
}

export function TenantRow({ tenant, room, rentExpiration, onEdit, onDelete }: TenantRowProps) {
  const getRentStatusBadge = () => {
    if (!rentExpiration) return null;

    switch (rentExpiration.status) {
      case 'expired':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case 'expiring':
        return (
          <Badge className="bg-accent/10 text-accent border-accent/20">
            <Clock className="h-3 w-3 mr-1" />
            {rentExpiration.daysUntilExpiry} days left
          </Badge>
        );
      case 'paid':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Paid until {rentExpiration.lastPaidMonth}
          </Badge>
        );
      case 'no_payments':
        return (
          <Badge className="bg-muted text-muted-foreground">
            No payments
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <TableRow className={cn(
      "group",
      rentExpiration?.status === 'expired' && "bg-destructive/5"
    )}>
      <TableCell className="font-medium">{tenant.name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {tenant.phone}
        </div>
      </TableCell>
      <TableCell>
        {room ? (
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            Room {room.roomNumber}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {new Date(tenant.moveInDate).toLocaleDateString()}
        </div>
      </TableCell>
      <TableCell>
        {getRentStatusBadge()}
      </TableCell>
      <TableCell>
        <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onEdit?.(tenant)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onDelete?.(tenant)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
