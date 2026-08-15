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

const badge = (status: string) => {
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
    const isChecked = checkedRefs.has(r.ref_number);
    return (
      <div
        onClick={() => onEdit(r)}
        className={`animate-fade-up group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border-2 bg-card pl-5 pr-4 py-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${isChecked ? 'border-red-300 bg-red-50' : `${m.border} ${m.cardBg}`}`}
      >
        <span className={`absolute left-0 top-0 h-full w-1.5 ${m.dot}`} />
        <div className="flex min-w-0 items-center gap-3">
          <input
            type="checkbox"
            checked={isChecked}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onCheck(r.ref_number, e.target.checked)}
            className="h-4 w-4 shrink-0 cursor-pointer accent-red-600"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-base font-bold text-primary">{r.ref_number}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full ${m.bg} px-2.5 py-0.5 text-xs font-semibold ${m.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} /> {m.label}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-primary truncate">{r.full_name}</p>
            {badge(r.status)}
            <p className="mt-1 text-xs text-muted-foreground">{r.phone} · Создан {r.created_at?.slice(0, 10)}</p>
            {r.operator_comment && (
              <p className="mt-1 flex items-center gap-1 text-xs text-accent"><Icon name="MessageSquare" size={12} /> {r.operator_comment}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
          <span className="font-display text-xl font-bold text-primary">{fmt(r.amount)} ₽</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(r); }} className="hidden items-center gap-1.5 sm:flex">
              <Icon name="Pencil" size={14} /> Изменить
            </Button>
            <Icon name="ChevronRight" size={18} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
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
              <div key={r.ref_number} className={`relative flex flex-col gap-3 px-5 py-4 pl-6 sm:flex-row sm:items-center sm:justify-between ${checkedRefs.has(r.ref_number) ? 'bg-red-50' : i === 0 ? 'bg-secondary/30' : ''}`}>
                <span className={`absolute left-0 top-0 h-full w-1 ${m.dot}`} />
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={checkedRefs.has(r.ref_number)} onChange={(e) => onCheck(r.ref_number, e.target.checked)} className="h-4 w-4 shrink-0 cursor-pointer accent-red-600" />
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.bg} ${m.color}`}>
                    <Icon name={m.icon} size={16} />
                  </div>
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
                      <span className="text-xs text-muted-foreground">{r.ref_number}</span>
                      {badge(r.status)}
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