import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { RoomCard } from '@/components/rooms/RoomCard';
import { AddRoomDialog } from '@/components/rooms/AddRoomDialog';
import { ViewRoomDialog } from '@/components/rooms/ViewRoomDialog';
import { EditRoomDialog } from '@/components/rooms/EditRoomDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRooms, useAlerts, useTenants } from '@/hooks/use-api';
import { Plus, Search, Filter, DoorOpen, Loader2 } from 'lucide-react';
import { Room, CreateRoomData, UpdateRoomData } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Rooms = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { rooms, isLoading, addRoom, updateRoom, deleteRoom } = useRooms();
  const { tenants } = useTenants();
  const { alerts } = useAlerts();
  const { toast } = useToast();

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;
  const totalRent = rooms.reduce((sum, r) => sum + r.monthlyRent, 0);
  const alertCount = alerts.filter(a => !a.isRead).length;

  const getTenantForRoom = (roomId: string) => {
    return tenants.find(t => t.roomId === roomId);
  };

  const handleAddRoom = async (newRoomData: CreateRoomData) => {
    try {
      await addRoom(newRoomData);
      toast({
        title: 'Room Added',
        description: `Room ${newRoomData.roomNumber} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add room',
        variant: 'destructive',
      });
    }
  };

  const handleView = (room: Room) => {
    setSelectedRoom(room);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRoom = async (roomId: string, data: UpdateRoomData) => {
    try {
      await updateRoom(roomId, data);
      toast({
        title: 'Room Updated',
        description: `Room ${data.roomNumber} has been successfully updated.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update room',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (room: Room) => {
    if (room.status === 'occupied') {
      toast({
        title: 'Cannot Delete',
        description: 'Please remove the tenant before deleting this room.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteRoom(room.id);
      toast({
        title: 'Room Deleted',
        description: `Room ${room.roomNumber} has been removed.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete room',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Layout title="Rooms" alertCount={0}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Rooms" alertCount={alertCount}>
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
                <DoorOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{rooms.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Rooms</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-success/10 shrink-0">
                <DoorOpen className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{occupiedCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Occupied</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-accent/10 shrink-0">
                <DoorOpen className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{vacantCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Vacant</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
                <DoorOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">TZS {totalRent.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Rent/mo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="gradient-primary text-primary-foreground shadow-glow w-full sm:w-auto"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        {/* Rooms Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              tenant={getTenantForRoom(room.id) || room.tenant}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No rooms found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter' 
                : 'Add your first room to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            )}
          </div>
        )}

        {/* Add Room Dialog */}
        <AddRoomDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddRoom={handleAddRoom}
          existingRoomNumbers={rooms.map(r => r.roomNumber.toUpperCase())}
        />

        {/* View Room Dialog */}
        <ViewRoomDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          room={selectedRoom}
          tenant={selectedRoom ? getTenantForRoom(selectedRoom.id) : null}
        />

        {/* Edit Room Dialog */}
        <EditRoomDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          room={selectedRoom}
          onUpdateRoom={handleUpdateRoom}
          existingRoomNumbers={rooms.map(r => r.roomNumber.toUpperCase())}
        />
      </div>
    </Layout>
  );
};

export default Rooms;
