import { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import Icon from '@/components/ui/icon';
import { apiGetNotifications, apiMarkNotificationsRead, type AppNotification } from '@/lib/api';

interface Props {
  phone: string;
}

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  status: { icon: 'RefreshCw', color: 'text-blue-600', bg: 'bg-blue-100' },
  comment: { icon: 'MessageSquare', color: 'text-accent', bg: 'bg-accent/15' },
  support: { icon: 'MessageCircleQuestion', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const NotificationsBell = ({ phone }: Props) => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const data = await apiGetNotifications(phone);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 60000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const handleOpenChange = async (v: boolean) => {
    setOpen(v);
    if (v && unreadCount > 0) {
      const ids = items.filter((n) => !n.is_read).map((n) => n.id);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      try {
        await apiMarkNotificationsRead(phone, ids);
      } catch {
        // не критично
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-primary hover:bg-secondary transition-colors">
          <Icon name="Bell" size={17} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="font-display text-base font-bold text-primary">Уведомления</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              <Icon name="BellOff" size={24} className="mx-auto mb-2 opacity-40" />
              Пока нет уведомлений
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.status;
                return (
                  <div key={n.id} className={`flex gap-3 px-4 py-3 ${!n.is_read ? 'bg-accent/5' : ''}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}>
                      <Icon name={meta.icon} size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-primary leading-tight">{n.title}</p>
                        {!n.is_read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                      </div>
                      {n.message && (
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground/70">{fmtDate(n.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
