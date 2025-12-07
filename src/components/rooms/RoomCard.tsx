import { Room, Tenant } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DoorOpen, User, Edit, Trash2, ImageIcon, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface RoomCardProps {
  room: Room;
  tenant?: Tenant;
  onView?: (room: Room) => void;
  onEdit?: (room: Room) => void;
  onDelete?: (room: Room) => void;
}

export function RoomCard({ room, tenant, onView, onEdit, onDelete }: RoomCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasImages = room.images && room.images.length > 0;

  return (
    <div className="group relative overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover animate-fade-in">
      {/* Image Section */}
      {hasImages ? (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={room.images![currentImageIndex]}
            alt={`Room ${room.roomNumber}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {room.images!.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {room.images!.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentImageIndex 
                      ? "bg-white" 
                      : "bg-white/50 hover:bg-white/75"
                  )}
                />
              ))}
            </div>
          )}
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
          {room.images!.length > 1 && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {room.images!.length}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center relative">
          <DoorOpen className="h-12 w-12 text-muted-foreground/30" />
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

      {/* Content Section */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display font-semibold text-card-foreground text-lg">
              Room {room.roomNumber}
            </h3>
            {room.roomName && (
              <p className="text-sm text-primary font-medium">{room.roomName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monthly Rent</span>
            <span className="font-semibold text-card-foreground">
              TZS {room.monthlyRent.toLocaleString()}
            </span>
          </div>
          
          {(tenant || room.tenant) && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tenant:</span>
              <span className="font-medium text-card-foreground">
                {tenant?.name || room.tenant?.name}
              </span>
            </div>
          )}

          {room.notes && (
            <p className="text-sm text-muted-foreground italic line-clamp-2">{room.notes}</p>
          )}
        </div>

        <div className="mt-4 flex gap-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(room)}
          >
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit?.(room)}
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onDelete?.(room)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
