import { Room, Tenant } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, User, Phone, Calendar, CreditCard, ImageIcon, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ViewRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  tenant?: Tenant | null;
}

export function ViewRoomDialog({
  open,
  onOpenChange,
  room,
  tenant,
}: ViewRoomDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!room) return null;

  const hasImages = room.images && room.images.length > 0;
  const actualTenant = tenant || room.tenant;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto p-0">
        {/* Image Section */}
        {hasImages ? (
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            <img
              src={room.images![currentImageIndex]}
              alt={`Room ${room.roomNumber}`}
              className="w-full h-full object-cover"
            />
            {room.images!.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {room.images!.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors",
                      index === currentImageIndex 
                        ? "bg-white" 
                        : "bg-white/50 hover:bg-white/75"
                    )}
                  />
                ))}
              </div>
            )}
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {currentImageIndex + 1}/{room.images!.length}
            </div>
            <Badge 
              variant={room.status === 'occupied' ? 'default' : 'secondary'}
              className={cn(
                "absolute top-3 right-3",
                room.status === 'occupied' 
                  ? 'bg-success text-success-foreground' 
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {room.status}
            </Badge>
          </div>
        ) : (
          <div className="aspect-video bg-muted flex items-center justify-center relative rounded-t-lg">
            <DoorOpen className="h-16 w-16 text-muted-foreground/30" />
            <Badge 
              variant={room.status === 'occupied' ? 'default' : 'secondary'}
              className={cn(
                "absolute top-3 right-3",
                room.status === 'occupied' 
                  ? 'bg-success text-success-foreground' 
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {room.status}
            </Badge>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-4">
          <DialogHeader className="p-0">
            <DialogTitle className="font-display text-xl flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <DoorOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span>Room {room.roomNumber}</span>
                {room.roomName && (
                  <p className="text-sm font-normal text-primary mt-0.5">{room.roomName}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Room Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-3 border border-border">
              <p className="text-xs text-muted-foreground">Monthly Rent</p>
              <p className="font-bold text-lg text-foreground">
                TZS {room.monthlyRent.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 border border-border">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className={cn(
                "font-bold text-lg capitalize",
                room.status === 'occupied' ? 'text-success' : 'text-accent'
              )}>
                {room.status}
              </p>
            </div>
          </div>

          {/* Notes */}
          {room.notes && (
            <div className="rounded-xl bg-muted/50 p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-foreground">{room.notes}</p>
            </div>
          )}

          {/* Tenant Section */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b border-border">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Tenant Information
              </h4>
            </div>
            <div className="p-4">
              {actualTenant ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{actualTenant.name}</p>
                      <p className="text-xs text-muted-foreground">Current Tenant</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{actualTenant.phone}</span>
                    </div>
                    {actualTenant.idNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-medium">{actualTenant.idNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Move-in:</span>
                      <span className="font-medium">
                        {new Date(actualTenant.moveInDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Room:</span>
                      <span className="font-medium">{room.roomNumber}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-2">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">No tenant assigned</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    This room is currently vacant
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

