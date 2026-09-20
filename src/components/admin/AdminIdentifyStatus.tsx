import Icon from '@/components/ui/icon';
import { type UserSession } from '@/lib/api';

interface Props {
  selected: UserSession;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

const AdminIdentifyStatus = ({ selected }: Props) => {
  const submittedAt = selected.identify_submitted_at;
  const expiresAt = selected.identify_token_expires_at;
  const isExpired = !submittedAt && !!expiresAt && new Date(expiresAt).getTime() < Date.now();
  const isPending = !submittedAt && !!expiresAt && !isExpired;

  let icon: string;
  let title: string;
  let subtitle: string;
  let className: string;

  if (submittedAt) {
    icon = 'CheckCircle2';
    title = 'Клиент загрузил документы по ссылке';
    subtitle = `Отправлено ${fmtDate(submittedAt)}`;
    className = 'border-green-300 bg-green-50 text-green-700';
  } else if (isPending) {
    icon = 'Clock';
    title = 'Ссылка отправлена, документы ещё не загружены';
    subtitle = `Действует до ${fmtDate(expiresAt as string)}`;
    className = 'border-orange-200 bg-orange-50 text-orange-700';
  } else if (isExpired) {
    icon = 'AlertTriangle';
    title = 'Ссылка истекла, документы не загружены';
    subtitle = 'Отправьте клиенту новую ссылку для идентификации';
    className = 'border-red-300 bg-red-50 text-red-700';
  } else {
    icon = 'Link2Off';
    title = 'Ссылка идентификации ещё не отправлялась';
    subtitle = 'Нажмите «Ссылка на идентификацию», чтобы отправить клиенту';
    className = 'border-border bg-secondary/30 text-muted-foreground';
  }

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${className}`}>
      <Icon name={icon} size={20} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs opacity-80">{subtitle}</p>
      </div>
    </div>
  );
};

export default AdminIdentifyStatus;
