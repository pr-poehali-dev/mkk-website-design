import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { apiListEmails, type EmailLogItem } from '@/lib/api';

const SOURCE_META: Record<string, { label: string; className: string; icon: string }> = {
  register: { label: 'Заявка принята', className: 'bg-blue-100 text-blue-700', icon: 'FileCheck' },
  manual: { label: 'Письмо оператора', className: 'bg-purple-100 text-purple-700', icon: 'UserRound' },
  reminder: { label: 'Напоминание', className: 'bg-orange-100 text-orange-700', icon: 'BellRing' },
  support_reply: { label: 'Ответ поддержки', className: 'bg-teal-100 text-teal-700', icon: 'MessageCircleQuestion' },
};

const getSourceMeta = (source: string) => {
  if (SOURCE_META[source]) return SOURCE_META[source];
  if (source.startsWith('status_')) {
    return { label: 'Смена статуса', className: 'bg-green-100 text-green-700', icon: 'RefreshCw' };
  }
  return { label: source, className: 'bg-secondary text-muted-foreground', icon: 'Mail' };
};

interface Props {
  refNumber: string;
}

const AdminEmailHistory = ({ refNumber }: Props) => {
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListEmails(refNumber);
      setEmails(data);
    } catch (_e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [refNumber]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg font-bold text-primary">История писем клиенту</p>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors">
          <Icon name="RefreshCw" size={13} /> Обновить
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Icon name="Loader2" size={22} className="animate-spin text-muted-foreground" />
        </div>
      ) : emails.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Писем пока не отправляли</p>
      ) : (
        <div className="space-y-2">
          {emails.map((e) => {
            const meta = getSourceMeta(e.source);
            const isOpened = !!e.opened_at;
            return (
              <div key={e.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.className}`}>
                    <Icon name={meta.icon} size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{e.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {meta.label} · {e.email} · {new Date(e.sent_at).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {e.preview && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{e.preview}</p>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {isOpened ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                      <Icon name="MailOpen" size={12} />
                      Прочитано {e.open_count > 1 ? `(${e.open_count}×)` : ''} · {new Date(e.opened_at as string).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      <Icon name="Mail" size={12} />
                      Отправлено, не открыто
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEmailHistory;
