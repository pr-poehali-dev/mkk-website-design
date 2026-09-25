import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { apiListReceipts, apiCreateReceipt, type LoanReceipt } from '@/lib/api';

const fmt = (n: number) => n.toLocaleString('ru-RU');

const TYPE_META: Record<string, { label: string; className: string; icon: string }> = {
  money_sent: { label: 'Займ выдан', className: 'bg-green-100 text-green-700', icon: 'BadgeCheck' },
  repaid: { label: 'Займ погашен', className: 'bg-blue-100 text-blue-700', icon: 'CircleDollarSign' },
};

interface Props {
  refNumber: string;
  loanAmount: number;
}

const AdminReceiptHistory = ({ refNumber, loanAmount }: Props) => {
  const [receipts, setReceipts] = useState<LoanReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListReceipts(refNumber);
      setReceipts(data);
    } catch (_e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [refNumber]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (receipt_type: 'money_sent' | 'repaid') => {
    setCreating(receipt_type);
    try {
      await apiCreateReceipt({ ref_number: refNumber, receipt_type, amount: loanAmount });
      await load();
    } catch (_e) {
      // ignore
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg font-bold text-primary">Чеки по займу {refNumber}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={creating === 'money_sent'} onClick={() => handleCreate('money_sent')} className="gap-1.5">
            {creating === 'money_sent'
              ? <Icon name="Loader2" size={14} className="animate-spin" />
              : <Icon name="BadgeCheck" size={14} />}
            Чек «Займ выдан»
          </Button>
          <Button size="sm" variant="outline" disabled={creating === 'repaid'} onClick={() => handleCreate('repaid')} className="gap-1.5">
            {creating === 'repaid'
              ? <Icon name="Loader2" size={14} className="animate-spin" />
              : <Icon name="CircleDollarSign" size={14} />}
            Чек «Займ погашен»
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Icon name="Loader2" size={22} className="animate-spin text-muted-foreground" />
        </div>
      ) : receipts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Чеков пока нет</p>
      ) : (
        <div className="space-y-2">
          {receipts.map((r) => {
            const meta = TYPE_META[r.receipt_type] || TYPE_META.money_sent;
            return (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.className}`}>
                    <Icon name={meta.icon} size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{r.receipt_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {meta.label} · {fmt(r.amount)} ₽ · {new Date(r.created_at).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/5 transition-colors">
                  <Icon name="Eye" size={13} /> Открыть
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminReceiptHistory;
