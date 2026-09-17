import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { apiListPayments, apiAddPayment, type LoanPayment } from '@/lib/api';

const fmt = (n: number) => n.toLocaleString('ru-RU');

const METHOD_LABELS: Record<string, string> = {
  card: 'Банковская карта',
  sbp: 'СБП',
  cash: 'Наличные',
  new_card: 'Новая карта',
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  success: { label: 'Успешно', className: 'bg-green-100 text-green-700' },
  pending: { label: 'В обработке', className: 'bg-amber-100 text-amber-700' },
  failed: { label: 'Ошибка', className: 'bg-red-100 text-red-700' },
};

interface Props {
  refNumber: string;
}

const AdminPaymentHistory = ({ refNumber }: Props) => {
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [transactionId, setTransactionId] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListPayments(refNumber);
      setPayments(data);
    } catch (_e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [refNumber]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setAdding(true);
    try {
      await apiAddPayment({
        ref_number: refNumber,
        amount: amt,
        payment_method: method,
        transaction_id: transactionId.trim() || undefined,
      });
      setAmount('');
      setTransactionId('');
      await load();
    } catch (_e) {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-4 font-display text-lg font-bold text-primary">
        История платежей по займу {refNumber}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Icon name="Loader2" size={22} className="animate-spin text-muted-foreground" />
        </div>
      ) : payments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Платежей пока нет</p>
      ) : (
        <>
          {/* Таблица на десктопе */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">ID</th>
                  <th className="py-2 pr-3 font-medium">Дата платежа</th>
                  <th className="py-2 pr-3 font-medium">Сумма платежа</th>
                  <th className="py-2 pr-3 font-medium">Способ оплаты</th>
                  <th className="py-2 pr-3 font-medium">Номер транзакции</th>
                  <th className="py-2 pr-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const st = STATUS_META[p.status] || STATUS_META.success;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-primary">#{p.id}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {new Date(p.created_at).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-green-600">{fmt(p.amount)} ₽</td>
                      <td className="py-2.5 pr-3 text-primary">{METHOD_LABELS[p.payment_method] || p.payment_method}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{p.transaction_id || '—'}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Карточки на мобильном */}
          <div className="space-y-2 sm:hidden">
            {payments.map((p) => {
              const st = STATUS_META[p.status] || STATUS_META.success;
              return (
                <div key={p.id} className="rounded-xl border border-border bg-secondary/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">#{p.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                  </div>
                  <p className="mt-1 font-semibold text-green-600">{fmt(p.amount)} ₽</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {METHOD_LABELS[p.payment_method] || p.payment_method} · {p.transaction_id || 'без транзакции'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Форма добавления платежа */}
      <div className="mt-5 rounded-xl border border-dashed border-border bg-secondary/30 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Внести платёж в историю</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Сумма (₽)</label>
            <Input type="number" min={1} placeholder="10000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Способ оплаты</label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Банковская карта</SelectItem>
                <SelectItem value="sbp">СБП</SelectItem>
                <SelectItem value="cash">Наличные</SelectItem>
                <SelectItem value="new_card">Новая карта</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">ID транзакции</label>
            <Input placeholder="Автоматически" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
          </div>
        </div>
        <Button
          className="mt-3 w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
          disabled={adding || !amount}
          onClick={handleAdd}
        >
          {adding
            ? <span className="flex items-center gap-1.5"><Icon name="Loader2" size={14} className="animate-spin" /> Проводим...</span>
            : <span className="flex items-center gap-1.5"><Icon name="Plus" size={14} /> Провести платёж</span>}
        </Button>
      </div>
    </div>
  );
};

export default AdminPaymentHistory;
