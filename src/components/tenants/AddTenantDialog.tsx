import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Room } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, User, Phone, CreditCard, Home } from 'lucide-react';

const tenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  idNumber: z.string().optional(),
  roomId: z.string().min(1, 'Please select a room'),
  moveInDate: z.date({ required_error: 'Please select a move-in date' }),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface AddTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableRooms: Room[];
  onAddTenant: (tenant: {
    name: string;
    phone: string;
    idNumber?: string;
    roomId: string;
    moveInDate: string;
  }) => void;
}

export function AddTenantDialog({
  open,
  onOpenChange,
  availableRooms,
  onAddTenant,
}: AddTenantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      phone: '',
      idNumber: '',
      roomId: '',
    },
  });

  const selectedDate = watch('moveInDate');
  const selectedRoomId = watch('roomId');

  const onSubmit = async (data: TenantFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newTenant = {
      name: data.name,
      phone: data.phone,
      idNumber: data.idNumber || undefined,
      roomId: data.roomId,
      moveInDate: format(data.moveInDate, 'yyyy-MM-dd'),
    };

    onAddTenant(newTenant);
    reset();
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            Add New Tenant
          </DialogTitle>
          <DialogDescription>
            Fill in the details to add a new tenant to your property.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('name')}
                id="name"
                placeholder="John Smith"
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
                placeholder="+1 234 567 8901"
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
                placeholder="ID001"
                className="pl-10"
              />
            </div>
          </div>

          {/* Room Selection */}
          <div className="space-y-2">
            <Label htmlFor="room" className="text-sm font-medium">
              Assign Room <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedRoomId}
              onValueChange={(value) => setValue('roomId', value, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select a room" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableRooms.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No vacant rooms available
                  </div>
                ) : (
                  availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>Room {room.roomNumber}</span>
                        <span className="text-muted-foreground text-xs">
                          TZS {room.monthlyRent.toLocaleString()}/mo
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.roomId && (
              <p className="text-sm text-destructive">{errors.roomId.message}</p>
            )}
          </div>

          {/* Move-in Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Move-in Date <span className="text-destructive">*</span>
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setValue('moveInDate', date, { shouldValidate: true });
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.moveInDate && (
              <p className="text-sm text-destructive">{errors.moveInDate.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4 flex-col-reverse sm:flex-row gap-2">
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
              disabled={isSubmitting || availableRooms.length === 0}
              className="gradient-primary text-primary-foreground w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Tenant'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
