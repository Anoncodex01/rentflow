import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tenant, Room, CreatePaymentData } from '@/lib/api';
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
import { format, addMonths } from 'date-fns';
import { 
  CalendarIcon, 
  Loader2, 
  CreditCard, 
  User, 
  Home, 
  CheckCircle2,
  Clock,
  Receipt,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const paymentSchema = z.object({
  tenantId: z.string().min(1, 'Please select a tenant'),
  numberOfMonths: z.coerce.number().min(1).max(12),
  status: z.enum(['paid', 'pending']),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenants: Tenant[];
  rooms: Room[];
  onAddPayment: (payment: CreatePaymentData) => Promise<void>;
}

// Generate the list of months being paid for
const generatePaidMonths = (startDate: Date, numberOfMonths: number) => {
  const months = [];
  for (let i = 0; i < numberOfMonths; i++) {
    const date = addMonths(startDate, i);
    months.push(format(date, 'MMMM yyyy'));
  }
  return months;
};

export function AddPaymentDialog({
  open,
  onOpenChange,
  tenants,
  rooms,
  onAddPayment,
}: AddPaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePaid, setDatePaid] = useState<Date | undefined>(new Date());
  const [startingMonth, setStartingMonth] = useState<Date | undefined>(new Date());
  const [datePaidCalendarOpen, setDatePaidCalendarOpen] = useState(false);
  const [startingMonthCalendarOpen, setStartingMonthCalendarOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { toast } = useToast();

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      tenantId: '',
      numberOfMonths: 1,
      status: 'paid',
    },
  });

  const watchTenantId = watch('tenantId');
  const watchStatus = watch('status');
  const watchNumberOfMonths = watch('numberOfMonths');

  // Calculate amounts
  const monthlyRent = selectedRoom?.monthlyRent || 0;
  const totalAmount = monthlyRent * watchNumberOfMonths;
  const paidMonths = startingMonth ? generatePaidMonths(startingMonth, watchNumberOfMonths) : [];

  // Update selected tenant and room when tenant changes
  useEffect(() => {
    if (watchTenantId) {
      const tenant = tenants.find(t => t.id === watchTenantId);
      setSelectedTenant(tenant || null);
      
      if (tenant) {
        const room = rooms.find(r => r.id === tenant.roomId);
        setSelectedRoom(room || null);
      }
    } else {
      setSelectedTenant(null);
      setSelectedRoom(null);
    }
  }, [watchTenantId, tenants, rooms]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!selectedRoom || !selectedTenant || !startingMonth) return;

    setIsSubmitting(true);
    
    try {
      // Generate a unique batch ID for this group of payments
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a payment for each month with the same batchId
      for (const month of paidMonths) {
        const newPayment: CreatePaymentData = {
          tenantId: data.tenantId,
          roomId: selectedRoom.id,
          amount: monthlyRent,
          datePaid: data.status === 'paid' && datePaid ? format(datePaid, 'yyyy-MM-dd') : undefined,
          monthPaidFor: month,
          status: data.status,
          batchId: paidMonths.length > 1 ? batchId : undefined, // Only set batchId for multi-month payments
        };
        await onAddPayment(newPayment);
      }
      
      // Show success toast
      toast({
        title: data.status === 'paid' ? 'Payments Recorded' : 'Payments Pending',
        description: `${paidMonths.length} payment${paidMonths.length > 1 ? 's' : ''} (TZS ${totalAmount.toLocaleString()}) for ${selectedTenant.name} has been recorded.`,
      });
      
      handleClose();
    } catch (error) {
      console.error('Failed to add payments:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record payments',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTenant(null);
    setSelectedRoom(null);
    // Reset dates to current date when closing
    const now = new Date();
    setDatePaid(now);
    setStartingMonth(now);
    setDatePaidCalendarOpen(false);
    setStartingMonthCalendarOpen(false);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  // Reset dates when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      setDatePaid(now);
      setStartingMonth(now);
    }
  }, [open]);

  // Filter tenants who have a room assigned
  const tenantsWithRooms = tenants.filter(t => {
    const room = rooms.find(r => r.id === t.roomId);
    return room !== undefined;
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <CreditCard className="h-5 w-5 text-primary-foreground" />
            </div>
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record rent payment for one or multiple months.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Tenant & Months */}
            <div className="space-y-5">
              {/* Tenant Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Tenant <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watchTenantId}
                  onValueChange={(value) => setValue('tenantId', value, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select a tenant" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsWithRooms.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No tenants available
                      </div>
                    ) : (
                      tenantsWithRooms.map((tenant) => {
                        const room = rooms.find(r => r.id === tenant.roomId);
                        return (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            <div className="flex items-center gap-2">
                              <span>{tenant.name}</span>
                              {room && (
                                <span className="text-muted-foreground text-xs">
                                  (Room {room.roomNumber})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                {errors.tenantId && (
                  <p className="text-sm text-destructive">{errors.tenantId.message}</p>
                )}
              </div>

              {/* Room (Auto-filled) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Room</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={selectedRoom ? `Room ${selectedRoom.roomNumber}${selectedRoom.roomName ? ` - ${selectedRoom.roomName}` : ''}` : ''}
                    placeholder="Select a tenant first"
                    className="pl-10"
                    disabled
                  />
                </div>
                {selectedRoom && (
                  <p className="text-xs text-muted-foreground">
                    Monthly rent: TZS {selectedRoom.monthlyRent.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Number of Months */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Number of Months <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={String(watchNumberOfMonths)}
                  onValueChange={(value) => setValue('numberOfMonths', Number(value), { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select months" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <SelectItem key={num} value={String(num)}>
                        {num} {num === 1 ? 'Month' : 'Months'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Starting Month - Calendar */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Starting Month <span className="text-destructive">*</span>
                </Label>
                <Popover open={startingMonthCalendarOpen} onOpenChange={setStartingMonthCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startingMonth && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startingMonth ? format(startingMonth, 'MMMM yyyy') : 'Select starting month'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startingMonth}
                      onSelect={(date) => {
                        if (date) {
                          // Set to first day of the month
                          const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                          setStartingMonth(firstOfMonth);
                        }
                        setStartingMonthCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Select any date - the month will be used as the starting month
                </p>
              </div>
            </div>

            {/* Right Column - Status & Summary */}
            <div className="space-y-5">
              {/* Payment Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Payment Status <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('status', 'paid')}
                    className={cn(
                      "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                      watchStatus === 'paid'
                        ? "border-success bg-success/10 text-success"
                        : "border-border hover:border-success/50 text-muted-foreground hover:text-success"
                    )}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Paid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('status', 'pending')}
                    className={cn(
                      "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                      watchStatus === 'pending'
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border hover:border-accent/50 text-muted-foreground hover:text-accent"
                    )}
                  >
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Pending</span>
                  </button>
                </div>
              </div>

              {/* Date Paid (only if status is paid) */}
              {watchStatus === 'paid' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Date Paid <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={datePaidCalendarOpen} onOpenChange={setDatePaidCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !datePaid && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {datePaid ? format(datePaid, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={datePaid}
                        onSelect={(date) => {
                          setDatePaid(date);
                          setDatePaidCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    The date when payment was received
                  </p>
                </div>
              )}

              {/* Payment Summary Card */}
              <div className="rounded-xl bg-muted/50 p-4 border border-border space-y-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Payment Summary</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tenant</span>
                    <span className="font-medium">{selectedTenant?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Room</span>
                    <span className="font-medium">{selectedRoom ? `Room ${selectedRoom.roomNumber}` : '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Rent</span>
                    <span className="font-medium">TZS {monthlyRent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Number of Months</span>
                    <span className="font-medium">{watchNumberOfMonths}</span>
                  </div>
                  
                  {/* Months being paid */}
                  {paidMonths.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Months covered:</p>
                      <div className="flex flex-wrap gap-1">
                        {paidMonths.map((month, index) => (
                          <span 
                            key={index}
                            className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
                          >
                            {month}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-medium">Total Amount</span>
                    <span className="font-bold text-lg text-primary">
                      TZS {totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className={cn(
                      "font-medium capitalize",
                      watchStatus === 'paid' ? 'text-success' : 'text-accent'
                    )}>
                      {watchStatus}
                    </span>
                  </div>
                  {watchStatus === 'paid' && datePaid && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date Paid</span>
                      <span className="font-medium">{format(datePaid, 'PPP')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 mt-6 border-t border-border flex-col-reverse sm:flex-row gap-2">
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
              disabled={isSubmitting || !selectedTenant || !startingMonth}
              className="gradient-primary text-primary-foreground w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording {watchNumberOfMonths} payment{watchNumberOfMonths > 1 ? 's' : ''}...
                </>
              ) : (
                `Record ${watchNumberOfMonths} Payment${watchNumberOfMonths > 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
