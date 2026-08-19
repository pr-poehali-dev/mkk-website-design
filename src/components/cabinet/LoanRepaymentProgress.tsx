import Icon from '@/components/ui/icon';

const fmt = (n: number) => n.toLocaleString('ru-RU');

interface Props {
  amount: number;
  days: number;
  startDate: string;
  overpay: number;
}

const LoanRepaymentProgress = ({ amount, days, startDate, overpay }: Props) => {
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
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 2;

  const total = amount + overpay;
  const dueLabel = due.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  const barColor = isOverdue ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-accent';
  const badgeColor = isOverdue
    ? 'bg-red-50 text-red-600 border-red-200'
    : isUrgent
    ? 'bg-orange-50 text-orange-600 border-orange-200'
    : 'bg-accent/10 text-accent border-accent/20';

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Icon name="CalendarClock" size={16} className="text-accent shrink-0" />
          Срок до погашения
        </p>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}>
          {isOverdue ? `Просрочка ${Math.abs(daysLeft)} дн.` : daysLeft === 0 ? 'Сегодня последний день' : `Осталось ${daysLeft} дн.`}
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

      <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5">
        <span className="text-sm text-muted-foreground">Сумма к возврату</span>
        <span className="font-display text-lg font-bold text-primary">{fmt(total)} ₽</span>
      </div>
    </div>
  );
};

export default LoanRepaymentProgress;
