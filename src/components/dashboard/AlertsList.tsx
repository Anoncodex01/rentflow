import { Alert } from '@/lib/api';
import { AlertTriangle, DoorOpen, Clock, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertsListProps {
  alerts: Alert[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'rent_due':
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />;
      case 'rent_overdue':
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />;
      case 'vacant_room':
        return <DoorOpen className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />;
      default:
        return <Bell className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'rent_due':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'rent_overdue':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'vacant_room':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Show only unread or recent alerts
  const activeAlerts = alerts.filter(a => !a.isRead).slice(0, 5);

  return (
    <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card border border-border">
      <h3 className="font-display text-lg font-semibold text-card-foreground mb-4">
        Active Alerts
      </h3>
      <div className="space-y-3">
        {activeAlerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">No active alerts</p>
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-2 sm:gap-3 rounded-lg border p-2.5 sm:p-3 transition-all duration-200 hover:shadow-sm",
                getAlertStyle(alert.type)
              )}
            >
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium leading-tight">{alert.message}</p>
                <p className="text-xs opacity-70 mt-0.5">
                  {new Date(alert.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
