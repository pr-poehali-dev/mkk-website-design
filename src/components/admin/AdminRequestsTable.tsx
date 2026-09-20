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

const AdminRequestsTable = ({ requests, checkedRefs, onCheck, onEdit, fmt }: Props) => {
  const allChecked = requests.length > 0 && requests.every((r) => checkedRefs.has(r.ref_number));

  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card sm:block">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-10 py-3 pl-4">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => requests.forEach((r) => onCheck(r.ref_number, e.target.checked))}
                className="h-4 w-4 cursor-pointer accent-red-600"
              />
            </th>
            <th className="py-3 pr-3 font-medium">ID</th>
            <th className="py-3 pr-3 font-medium">Заёмщик (ФИО)</th>
            <th className="py-3 pr-3 font-medium">Телефон</th>
            <th className="py-3 pr-3 font-medium">Сумма займа</th>
            <th className="py-3 pr-3 font-medium">Срок</th>
            <th className="py-3 pr-3 font-medium">К возврату</th>
            <th className="py-3 pr-3 font-medium">Статус</th>
            <th className="py-3 pr-3 font-medium">Дата подачи</th>
            <th className="py-3 pr-4 font-medium">Действия</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const st = (r.status as StatusKey) in STATUS_META ? (r.status as StatusKey) : 'review';
            const m = STATUS_META[st];
            const isChecked = checkedRefs.has(r.ref_number);
            const overpay = Math.round(r.amount * 0.008 * r.days);
            const toReturn = r.status === 'repaid' ? 0 : r.amount + overpay;
            return (
              <tr
                key={r.ref_number}
                onClick={() => onEdit(r)}
                className={`cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-secondary/40 ${isChecked ? 'bg-red-50' : ''}`}
              >
                <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onCheck(r.ref_number, e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-red-600"
                  />
                </td>
                <td className="py-3 pr-3 font-semibold text-primary">{r.ref_number}</td>
                <td className="py-3 pr-3 text-primary">{r.full_name}</td>
                <td className="py-3 pr-3 text-muted-foreground">{r.phone}</td>
                <td className="py-3 pr-3 font-medium text-primary">{fmt(r.amount)} ₽</td>
                <td className="py-3 pr-3 text-muted-foreground">{r.days} дн.</td>
                <td className="py-3 pr-3 font-medium text-green-600">{fmt(toReturn)} ₽</td>
                <td className="py-3 pr-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full ${m.bg} px-2.5 py-0.5 text-xs font-semibold ${m.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} /> {m.label}
                  </span>
                  {r.identify_submitted_at && (
                    <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                      <Icon name="CheckCircle2" size={10} /> Запрос фото ок
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3 text-muted-foreground">
                  {r.created_at ? new Date(r.created_at).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => onEdit(r)}>
                      <Icon name="Pencil" size={13} className="mr-1" /> Анкета
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
          {requests.length === 0 && (
            <tr>
              <td colSpan={10} className="py-10 text-center text-muted-foreground">Заявок не найдено</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminRequestsTable;