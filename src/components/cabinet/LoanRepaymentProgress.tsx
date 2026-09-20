import Icon from '@/components/ui/icon';

const fmt = (n: number) => n.toLocaleString('ru-RU');

interface Props {
  amount: number;
  days: number;
  startDate: string;
  overpay: number;
  statusOverdue?: boolean;
}

const LoanRepaymentProgress = ({ amount, days, startDate, overpay, statusOverdue }: Props) => {
  const start = new Date(startDate);
  const due = new Date(start);
  due.setDate(due.getDate() + days);

  const now = new Date();
  const totalMs = due.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  const rawPercent = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 100;
  const percent = Math.min(100, Math.max(0, rawPercent));

  const msPerDay = 86400000;
  const daysLeft = Math.ceil((due.getTime() - now.getTime()) / msPerDay);
  const isOverdue = statusOverdue || daysLeft < 0;
  const isUrgent = !isOverdue && daysLeft >= 0 && daysLeft <= 2;
  const daysOverdue = isOverdue ? Math.max(1, Math.ceil((now.getTime() - due.getTime()) / msPerDay)) : 0;
  const penaltyTotal = Math.round(amount * 0.01) * daysOverdue;

  const total = amount + overpay + penaltyTotal;
  const dueLabel = due.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  const barColor = isOverdue ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-accent';
  const badgeColor = isOverdue
    ? 'bg-red-50 text-red-600 border-red-200'
    : isUrgent
    ? 'bg-orange-50 text-orange-600 border-orange-200'
    : 'bg-accent/10 text-accent border-accent/20';

  return (
    <div className={`mt-4 rounded-xl border p-4 ${isOverdue ? 'border-red-300 bg-red-50/50' : 'border-border bg-card'}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className={`flex items-center gap-1.5 text-sm font-semibold ${isOverdue ? 'text-red-700' : 'text-primary'}`}>
          <Icon name={isOverdue ? 'AlertCircle' : 'CalendarClock'} size={16} className={`shrink-0 ${isOverdue ? 'text-red-600' : 'text-accent'}`} />
          {isOverdue ? 'Просрочка платежа' : 'Срок до погашения'}
        </p>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}>
          {isOverdue ? `Просрочка ${daysOverdue} дн.` : daysLeft === 0 ? 'Сегодня последний день' : `Осталось ${daysLeft} дн.`}
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
        <span>{dueLabel}</span>
      </div>

      <div className={`mt-4 flex items-center justify-between rounded-lg px-3 py-2.5 ${isOverdue ? 'bg-red-100' : 'bg-secondary'}`}>
        <span className={`text-sm ${isOverdue ? 'text-red-700' : 'text-muted-foreground'}`}>{isOverdue ? 'Сумма к возврату с пеней' : 'Сумма к возврату'}</span>
        <span className={`font-display text-lg font-bold ${isOverdue ? 'text-red-700' : 'text-primary'}`}>{fmt(total)} ₽</span>
      </div>
    </div>
  );
};

export default LoanRepaymentProgress;