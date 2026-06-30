import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';
import { type UserSession } from '@/lib/api';

interface Props {
  requests: UserSession[];
  checkedRefs: Set<string>;
  onCheck: (ref: string, checked: boolean) => void;
  onEdit: (r: UserSession) => void;
  fmt: (n: number) => string;
}

const badge = (status: string, isRepeat: boolean, index: number) => {
  if (isRepeat && index > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
        <Icon name="RefreshCw" size={10} /> Повторная заявка
      </span>
    );
  }
  if (status === 'repaid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
        <Icon name="CheckCircle2" size={10} /> Займ погашен
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
        <Icon name="XCircle" size={10} /> Отказ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
      <Icon name="FilePlus" size={10} /> Новая заявка
    </span>
  );
};

const AdminClientGroup = ({ requests, checkedRefs, onCheck, onEdit, fmt }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const isGroup = requests.length > 1;
  const latest = requests[0];
  const status = (latest.status as StatusKey) in STATUS_META ? (latest.status as StatusKey) : 'review';
  const meta = STATUS_META[status];
  const anyChecked = requests.some((r) => checkedRefs.has(r.ref_number));

  if (!isGroup) {
    const r = latest;
    const st = (r.status as StatusKey) in STATUS_META ? (r.status as StatusKey) : 'review';
    const m = STATUS_META[st];
    return (
      <div className={`animate-fade-up flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${checkedRefs.has(r.ref_number) ? 'border-red-300 bg-red-50' : 'border-border'}`}>
        <div className="flex items-center gap-4">
          <input type="checkbox" checked={checkedRefs.has(r.ref_number)} onChange={(e) => onCheck(r.ref_number, e.target.checked)} className="h-4 w-4 shrink-0 cursor-pointer accent-red-600" />
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${m.bg} ${m.color}`}>
            <Icon name={m.icon} size={22} />
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-2 font-semibold text-primary">
              {r.full_name} <span className="text-xs font-normal text-muted-foreground">· {r.ref_number}</span>
              {badge(r.status, false, 0)}
            </p>
            <p className="text-sm text-muted-foreground">{r.phone} · {fmt(r.amount)} ₽ / {r.days} дн. · {r.created_at?.slice(0, 10)}</p>
            {r.operator_comment && (
              <p className="mt-1 flex items-center gap-1 text-xs text-accent"><Icon name="MessageSquare" size={12} /> {r.operator_comment}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`hidden text-sm font-medium sm:block ${m.color}`}>{m.label}</span>
          <Button size="sm" variant="outline" onClick={() => onEdit(r)} className="flex items-center gap-1.5">
            <Icon name="Pencil" size={14} /> Изменить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`animate-fade-up rounded-2xl border bg-card transition-shadow hover:shadow-md ${anyChecked ? 'border-red-300 bg-red-50' : 'border-violet-200'}`}>
      {/* Заголовок группы */}
      <div className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={requests.every((r) => checkedRefs.has(r.ref_number))}
            onChange={(e) => requests.forEach((r) => onCheck(r.ref_number, e.target.checked))}
            className="h-4 w-4 shrink-0 cursor-pointer accent-red-600"
          />
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.color}`}>
            <Icon name={meta.icon} size={22} />
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-2 font-semibold text-primary">
              {latest.full_name}
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                <Icon name="Users" size={10} /> {requests.length} заявки
              </span>
            </p>
            <p className="text-sm text-muted-foreground">{latest.phone}</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
          {expanded ? 'Свернуть' : 'Развернуть'}
        </button>
      </div>

      {/* Заявки внутри группы */}
      <div className={`overflow-hidden transition-all ${expanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
        <div className="border-t border-border divide-y divide-border">
          {requests.map((r, i) => {
            const st = (r.status as StatusKey) in STATUS_META ? (r.status as StatusKey) : 'review';
            const m = STATUS_META[st];
            return (
              <div key={r.ref_number} className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${checkedRefs.has(r.ref_number) ? 'bg-red-50' : i === 0 ? 'bg-secondary/30' : ''}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={checkedRefs.has(r.ref_number)} onChange={(e) => onCheck(r.ref_number, e.target.checked)} className="h-4 w-4 shrink-0 cursor-pointer accent-red-600" />
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.bg} ${m.color}`}>
                    <Icon name={m.icon} size={16} />
                  </div>
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
                      <span className="text-xs text-muted-foreground">{r.ref_number}</span>
                      {badge(r.status, true, i)}
                    </p>
                    <p className="text-xs text-muted-foreground">{fmt(r.amount)} ₽ / {r.days} дн. · {r.created_at?.slice(0, 10)} · <span className={m.color}>{m.label}</span></p>
                    {r.operator_comment && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-accent"><Icon name="MessageSquare" size={10} /> {r.operator_comment}</p>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onEdit(r)} className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Icon name="Pencil" size={14} /> Изменить
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminClientGroup;
