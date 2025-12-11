import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { TenantRow } from '@/components/tenants/TenantRow';
import { AddTenantDialog } from '@/components/tenants/AddTenantDialog';
import { EditTenantDialog } from '@/components/tenants/EditTenantDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenants, useRooms, useAlerts, usePayments, calculateRentExpiration } from '@/hooks/use-api';
import { Plus, Search, Users, Loader2 } from 'lucide-react';
import { Tenant, CreateTenantData } from '@/lib/api';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { TenantCard } from '@/components/tenants/TenantCard';

const Tenants = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const { tenants, isLoading: tenantsLoading, addTenant, updateTenant, deleteTenant } = useTenants();
  const { rooms, isLoading: roomsLoading, refetch: refetchRooms } = useRooms();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { alerts } = useAlerts();
  const { toast } = useToast();

  const isLoading = tenantsLoading || roomsLoading || paymentsLoading;

  // Calculate rent expiration for each tenant
  const getRentExpiration = (tenantId: string) => {
    return calculateRentExpiration(tenantId, payments);
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.phone.includes(searchQuery)
  );

  const getRoomForTenant = (roomId: string) => {
    return rooms.find(r => r.id === roomId);
  };

  // Get only vacant rooms for the add tenant dialog
  const vacantRooms = rooms.filter(room => room.status === 'vacant');
  const alertCount = alerts.filter(a => !a.isRead).length;

  const handleAddTenant = async (newTenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const createData: CreateTenantData = {
        name: newTenantData.name,
        phone: newTenantData.phone,
        idNumber: newTenantData.idNumber,
        roomId: newTenantData.roomId,
        moveInDate: newTenantData.moveInDate,
      };
      await addTenant(createData);
      refetchRooms();
      toast({
        title: 'Tenant Added',
        description: `${newTenantData.name} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add tenant',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTenant = async (tenantId: string, data: Partial<Tenant>) => {
    try {
      await updateTenant(tenantId, data);
      refetchRooms();
      toast({
        title: 'Tenant Updated',
        description: `${data.name || selectedTenant?.name} has been successfully updated.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update tenant',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    try {
      await deleteTenant(tenant.id);
      refetchRooms();
      toast({
        title: 'Tenant Removed',
        description: `${tenant.name} has been removed from the system.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete tenant',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Layout title="Tenants" alertCount={0}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tenants" alertCount={alertCount}>
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{tenants.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-success/10 shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {tenants.filter(t => !t.moveOutDate).length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Active</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-3 sm:p-4 shadow-card border border-border">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-accent/10 shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{vacantRooms.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button 
            className="gradient-primary text-primary-foreground shadow-glow w-full sm:w-auto"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>

        {/* Mobile: Card view */}
        <div className="block sm:hidden space-y-3">
          {filteredTenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              room={getRoomForTenant(tenant.roomId)}
              rentExpiration={getRentExpiration(tenant.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden sm:block rounded-xl bg-card shadow-card overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Move-in Date</TableHead>
                  <TableHead>Rent Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TenantRow
                    key={tenant.id}
                    tenant={tenant}
                    room={getRoomForTenant(tenant.roomId)}
                    rentExpiration={getRentExpiration(tenant.id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredTenants.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">No tenants found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {searchQuery ? 'Try a different search term' : 'Add your first tenant to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Mobile empty state */}
        {filteredTenants.length === 0 && (
          <div className="block sm:hidden text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No tenants found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {searchQuery ? 'Try a different search term' : 'Add your first tenant to get started'}
            </p>
            {!searchQuery && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            )}
          </div>
        )}

        {/* Add Tenant Dialog */}
        <AddTenantDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          availableRooms={vacantRooms}
          onAddTenant={handleAddTenant}
        />

        {/* Edit Tenant Dialog */}
        <EditTenantDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          tenant={selectedTenant}
          room={selectedTenant ? getRoomForTenant(selectedTenant.roomId) : undefined}
          onUpdateTenant={handleUpdateTenant}
        />
      </div>
    </Layout>
  );
};

export default Tenants;
