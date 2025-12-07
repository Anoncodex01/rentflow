import { Tenant, Room } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Phone, Calendar, Home, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RentExpirationInfo } from './TenantRow';

interface TenantCardProps {
  tenant: Tenant;
  room?: Room;
  rentExpiration?: RentExpirationInfo;
  onEdit?: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
}

export function TenantCard({ tenant, room, rentExpiration, onEdit, onDelete }: TenantCardProps) {
  const getRentStatusBadge = () => {
    if (!rentExpiration) return null;

    switch (rentExpiration.status) {
      case 'expired':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Rent Expired
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
            Paid
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
    <div className={cn(
      "rounded-xl bg-card p-4 shadow-card border border-border space-y-3",
      rentExpiration?.status === 'expired' && "border-destructive/30 bg-destructive/5"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{tenant.name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Phone className="h-3.5 w-3.5" />
            {tenant.phone}
          </div>
        </div>
        {getRentStatusBadge()}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {room && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Home className="h-3.5 w-3.5" />
            <span>Room {room.roomNumber}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(tenant.moveInDate).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Rent Expiration Info */}
      {rentExpiration && rentExpiration.lastPaidMonth && (
        <div className={cn(
          "text-xs p-2 rounded-lg",
          rentExpiration.status === 'expired' ? "bg-destructive/10 text-destructive" :
          rentExpiration.status === 'expiring' ? "bg-accent/10 text-accent" :
          "bg-success/10 text-success"
        )}>
          {rentExpiration.status === 'expired' ? (
            <span>Rent expired. Last paid: {rentExpiration.lastPaidMonth}</span>
          ) : rentExpiration.status === 'expiring' ? (
            <span>Rent expires in {rentExpiration.daysUntilExpiry} days. Paid until: {rentExpiration.lastPaidMonth}</span>
          ) : (
            <span>Paid until: {rentExpiration.lastPaidMonth}</span>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => onEdit?.(tenant)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onDelete?.(tenant)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
