import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Room, UpdateRoomData } from '@/lib/api';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, DoorOpen, Hash, DollarSign, FileText, ImagePlus, X, Home } from 'lucide-react';

const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  roomName: z.string().optional(),
  monthlyRent: z.coerce.number().min(1, 'Monthly rent must be greater than 0'),
  notes: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface EditRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onUpdateRoom: (roomId: string, data: UpdateRoomData) => Promise<void>;
  existingRoomNumbers: string[];
}

export function EditRoomDialog({
  open,
  onOpenChange,
  room,
  onUpdateRoom,
  existingRoomNumbers,
}: EditRoomDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });

  // Reset form when room changes
  useEffect(() => {
    if (room) {
      reset({
        roomNumber: room.roomNumber,
        roomName: room.roomName || '',
        monthlyRent: room.monthlyRent,
        notes: room.notes || '',
      });
      setImages(room.images || []);
    }
  }, [room, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 4 - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => {
          if (prev.length < 4) {
            return [...prev, reader.result as string];
          }
          return prev;
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: RoomFormData) => {
    if (!room) return;

    // Check if room number already exists (excluding current room)
    const otherRoomNumbers = existingRoomNumbers.filter(
      num => num !== room.roomNumber.toUpperCase()
    );
    if (otherRoomNumbers.includes(data.roomNumber.toUpperCase())) {
      setError('roomNumber', {
        type: 'manual',
        message: 'This room number already exists',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData: UpdateRoomData = {
        roomNumber: data.roomNumber.toUpperCase(),
        roomName: data.roomName || undefined,
        monthlyRent: data.monthlyRent,
        notes: data.notes || undefined,
        images: images.length > 0 ? images : undefined,
      };

      await onUpdateRoom(room.id, updateData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update room:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (room) {
      reset({
        roomNumber: room.roomNumber,
        roomName: room.roomName || '',
        monthlyRent: room.monthlyRent,
        notes: room.notes || '',
      });
      setImages(room.images || []);
    }
    onOpenChange(false);
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <DoorOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            Edit Room {room.roomNumber}
          </DialogTitle>
          <DialogDescription>
            Update the room details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-5">
              {/* Room Number Field */}
              <div className="space-y-2">
                <Label htmlFor="roomNumber" className="text-sm font-medium">
                  Room Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('roomNumber')}
                    id="roomNumber"
                    placeholder="A101"
                    className="pl-10 uppercase"
                  />
                </div>
                {errors.roomNumber && (
                  <p className="text-sm text-destructive">{errors.roomNumber.message}</p>
                )}
              </div>

              {/* Room Name Field */}
              <div className="space-y-2">
                <Label htmlFor="roomName" className="text-sm font-medium">
                  Room Name <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('roomName')}
                    id="roomName"
                    placeholder="Deluxe Suite"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Monthly Rent Field */}
              <div className="space-y-2">
                <Label htmlFor="monthlyRent" className="text-sm font-medium">
                  Monthly Rent (TZS) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('monthlyRent')}
                    id="monthlyRent"
                    type="number"
                    placeholder="500000"
                    className="pl-10"
                    min="0"
                  />
                </div>
                {errors.monthlyRent && (
                  <p className="text-sm text-destructive">{errors.monthlyRent.message}</p>
                )}
              </div>

              {/* Notes Field */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    {...register('notes')}
                    id="notes"
                    placeholder="Any additional notes about this room..."
                    className="pl-10 min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Room Images <span className="text-muted-foreground text-xs">(up to 4 images)</span>
                </Label>
                
                {/* Image Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Existing Images */}
                  {images.map((image, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-video rounded-xl overflow-hidden border border-border group"
                    >
                      <img
                        src={image}
                        alt={`Room image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/50 text-white text-xs">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Image Button */}
                  {images.length < 4 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-sm font-medium">Add Image</span>
                      <span className="text-xs">{images.length}/4</span>
                    </button>
                  )}
                  
                  {/* Empty Slots */}
                  {images.length < 3 && Array.from({ length: 3 - images.length }).map((_, index) => (
                    <div 
                      key={`empty-${index}`}
                      className="aspect-video rounded-xl border border-dashed border-border/50 bg-muted/30 flex items-center justify-center"
                    >
                      <span className="text-xs text-muted-foreground/50">Empty slot</span>
                    </div>
                  ))}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF, WebP
                </p>
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

