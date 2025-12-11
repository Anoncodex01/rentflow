import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tenant, Room } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Loader2, Users, Phone, CreditCard, Home } from 'lucide-react';

const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  idNumber: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface EditTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
  room?: Room;
  onUpdateTenant: (tenantId: string, data: Partial<Tenant>) => Promise<void>;
}

export function EditTenantDialog({
  open,
  onOpenChange,
  tenant,
  room,
  onUpdateTenant,
}: EditTenantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState<Date | undefined>(undefined);
  const [moveOutCalendarOpen, setMoveOutCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  });

  // Reset form when tenant changes
  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        phone: tenant.phone,
        idNumber: tenant.idNumber || '',
      });
      setMoveOutDate(tenant.moveOutDate ? parseISO(tenant.moveOutDate) : undefined);
    }
  }, [tenant, reset]);

  const onSubmit = async (data: TenantFormData) => {
    if (!tenant) return;

    setIsSubmitting(true);
    
    try {
      await onUpdateTenant(tenant.id, {
        name: data.name,
        phone: data.phone,
        idNumber: data.idNumber || undefined,
        moveOutDate: moveOutDate ? format(moveOutDate, 'yyyy-MM-dd') : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update tenant:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (tenant) {
      reset({
        name: tenant.name,
        phone: tenant.phone,
        idNumber: tenant.idNumber || '',
      });
      setMoveOutDate(tenant.moveOutDate ? parseISO(tenant.moveOutDate) : undefined);
    }
    onOpenChange(false);
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            Edit Tenant
          </DialogTitle>
          <DialogDescription>
            Update tenant information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          {/* Current Room Info */}
          <div className="rounded-xl bg-muted/50 p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Home className="h-4 w-4" />
              <span className="text-xs">Current Room</span>
            </div>
            <p className="font-semibold">
              {room ? `Room ${room.roomNumber}${room.roomName ? ` - ${room.roomName}` : ''}` : 'Not assigned'}
            </p>
            <p className="text-sm text-muted-foreground">
              Move-in: {format(parseISO(tenant.moveInDate), 'PPP')}
            </p>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('name')}
                id="name"
                placeholder="John Doe"
                className="pl-10"
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('phone')}
                id="phone"
                placeholder="+255 123 456 789"
                className="pl-10"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* ID Number Field */}
          <div className="space-y-2">
            <Label htmlFor="idNumber" className="text-sm font-medium">
              ID Number <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('idNumber')}
                id="idNumber"
                placeholder="National ID or Passport"
                className="pl-10"
              />
            </div>
          </div>

          {/* Move Out Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Move Out Date <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Popover open={moveOutCalendarOpen} onOpenChange={setMoveOutCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !moveOutDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {moveOutDate ? format(moveOutDate, 'PPP') : 'Select move out date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={moveOutDate}
                  onSelect={(date) => {
                    setMoveOutDate(date);
                    setMoveOutCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {moveOutDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setMoveOutDate(undefined)}
              >
                Clear move out date
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Setting a move out date will mark the room as vacant.
            </p>
          </div>

          <DialogFooter className="pt-4 border-t border-border flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gradient-primary text-primary-foreground w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

