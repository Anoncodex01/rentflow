import { Layout } from '@/components/layout/Layout';
import { useAlerts } from '@/hooks/use-api';
import { Bell, AlertTriangle, DoorOpen, CreditCard, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const Alerts = () => {
  const { alerts, isLoading, markAsRead, deleteAlert } = useAlerts();
  const { toast } = useToast();
  const unreadCount = alerts.filter(a => !a.isRead).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'rent_due':
      case 'rent_overdue':
        return <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />;
      case 'vacant_room':
        return <DoorOpen className="h-4 w-4 sm:h-5 sm:w-5" />;
      default:
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'rent_overdue':
        return 'text-destructive bg-destructive/10';
      case 'rent_due':
        return 'text-accent bg-accent/10';
      case 'vacant_room':
        return 'text-primary bg-primary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark alert as read',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id);
      toast({
        title: 'Alert Deleted',
        description: 'Alert has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Layout title="Alerts" alertCount={0}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Alerts" alertCount={unreadCount}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold">Notifications</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-card border border-border">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">No alerts</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-card border border-border transition-all",
                  !alert.isRead && "border-primary/30 bg-primary/5"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                  getAlertColor(alert.type)
                )}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn(
                        "font-medium text-sm sm:text-base",
                        !alert.isRead && "text-foreground"
                      )}>
                        {alert.message}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {new Date(alert.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "shrink-0 capitalize text-xs w-fit",
                        getAlertColor(alert.type)
                      )}
                    >
                      {alert.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="text-primary hover:text-primary h-8 px-2 sm:px-3"
                      >
                        <CheckCircle2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Mark as read</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(alert.id)}
                      className="text-destructive hover:text-destructive h-8 px-2 sm:px-3"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Alerts;
