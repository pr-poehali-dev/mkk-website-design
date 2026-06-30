import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';
import { type UserSession } from '@/lib/api';

interface Props {
  r: UserSession;
  checked: boolean;
  onCheck: (ref: string, checked: boolean) => void;
  onEdit: (r: UserSession) => void;
  fmt: (n: number) => string;
  isRepeat?: boolean;
}

const AdminRequestCard = ({ r, checked, onCheck, onEdit, fmt, isRepeat }: Props) => {
  const status = (r.status as StatusKey) in STATUS_META ? (r.status as StatusKey) : 'review';
  const meta = STATUS_META[status];

  return (
    <div
      className={`animate-fade-up flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${checked ? 'border-red-300 bg-red-50' : 'border-border'}`}>
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheck(r.ref_number, e.target.checked)}
          className="h-4 w-4 shrink-0 cursor-pointer accent-red-600"
        />
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.color}`}>
          <Icon name={meta.icon} size={22} />
        </div>
        <div>
          <p className="font-semibold text-primary flex items-center gap-2 flex-wrap">
            {r.full_name} <span className="text-xs font-normal text-muted-foreground">· {r.ref_number}</span>
            {isRepeat ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                <Icon name="RefreshCw" size={10} /> Повторная заявка
              </span>
            ) : r.status === 'repaid' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                <Icon name="CheckCircle2" size={10} /> Погашен
              </span>
            ) : null}
          </p>
          <p className="text-sm text-muted-foreground">
            {r.phone} · {fmt(r.amount)} ₽ / {r.days} дн. · {r.created_at?.slice(0, 10)}
          </p>
          {r.operator_comment && (
            <p className="mt-1 flex items-center gap-1 text-xs text-accent">
              <Icon name="MessageSquare" size={12} /> {r.operator_comment}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`hidden text-sm font-medium sm:block ${meta.color}`}>{meta.label}</span>
        <Button size="sm" variant="outline" onClick={() => onEdit(r)} className="flex items-center gap-1.5">
          <Icon name="Pencil" size={14} /> Изменить
        </Button>
      </div>
    </div>
  );
};

export default AdminRequestCard;