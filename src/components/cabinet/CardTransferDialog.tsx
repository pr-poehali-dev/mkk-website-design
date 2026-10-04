import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import BankPicker from '@/components/BankPicker';
import {
  apiCreateCardTransaction, apiGetMyCardTransactions, CARD_TX_STATUS_META,
  type CardApplication, type CardTransaction, type UserSession,
} from '@/lib/api';

const fmt = (n: number) => n.toLocaleString('ru-RU');

const fmtCard = (raw: string) => raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtPhone = (raw: string) => {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  let r = '+7';
  if (d.length > 1) r += ' (' + d.slice(1, 4);
  if (d.length >= 4) r += ') ' + d.slice(4, 7);
  if (d.length >= 7) r += '-' + d.slice(7, 9);
  if (d.length >= 9) r += '-' + d.slice(9, 11);
  return r;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'topup' | 'withdraw';
  card: CardApplication;
  user: UserSession;
  onDone: () => void;
}

const CardTransferDialog = ({ open, onOpenChange, mode, card, user, onDone }: Props) => {
  const [method, setMethod] = useState<'sbp' | 'card'>('sbp');
  const [amount, setAmount] = useState('');
  const [target, setTarget] = useState('+7');
  const [bank, setBank] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [tx, setTx] = useState<CardTransaction | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const isWithdraw = mode === 'withdraw';
  const left = Math.max((card.approved_limit ?? 0) - (card.spent_amount || 0), 0);

  useEffect(() => {
    if (open) { setMethod('sbp'); setAmount(''); setTarget('+7'); setBank(null); setError(''); setTx(null); }
  }, [open, mode]);

  useEffect(() => {
    clearInterval(timer.current);
    if (!open || !tx || tx.status !== 'processing') return;
    timer.current = setInterval(async () => {
      try {
        const list = await apiGetMyCardTransactions(user.phone);
        const fresh = list.find((t) => t.id === tx.id);
        if (fresh && fresh.status !== tx.status) { setTx(fresh); onDone(); }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(timer.current);
  }, [open, tx]);

  const submit = async () => {
    setError('');
    const sum = Number(amount);
    if (!sum || sum < 100) { setError('Минимальная сумма — 100 ₽'); return; }
    if (isWithdraw) {
      if (sum > left) { setError(`Доступно только ${fmt(left)} ₽`); return; }
      if (method === 'sbp' && target.replace(/\D/g, '').length !== 11) { setError('Введите номер телефона полностью'); return; }
      if (method === 'card' && target.replace(/\D/g, '').length !== 16) { setError('Введите номер карты (16 цифр)'); return; }
      if (!bank) { setError('Выберите банк получателя'); return; }
    }
    setSending(true);
    try {
      const created = await apiCreateCardTransaction({
        application_id: card.id, phone: user.phone, tx_type: mode, method: isWithdraw ? method : 'card',
        amount: sum, target: isWithdraw ? target : undefined, bank: isWithdraw ? bank || undefined : undefined,
      });
      setTx(created);
      onDone();
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); } finally { setSending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">{isWithdraw ? 'Вывести средства' : 'Пополнить карту'}</DialogTitle>
        </DialogHeader>

        {tx ? (
          <div className="space-y-4 py-2 text-center">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${CARD_TX_STATUS_META[tx.status].badge}`}>
              <Icon name={CARD_TX_STATUS_META[tx.status].icon} size={30} className={tx.status === 'processing' ? 'animate-spin' : ''} />
            </div>
            <p className="font-display text-lg font-bold text-primary">{CARD_TX_STATUS_META[tx.status].label}</p>
            <p className="text-2xl font-bold text-primary">{fmt(tx.amount)} ₽</p>
            {tx.target && <p className="text-sm text-muted-foreground">{tx.method === 'sbp' ? 'По СБП' : 'На карту'}: {tx.target}{tx.bank ? ` · ${tx.bank}` : ''}</p>}
            {tx.status === 'processing' && <p className="text-sm text-muted-foreground">Операция в обработке. Статус обновится автоматически.</p>}
            {tx.status === 'error' && <p className="text-sm text-red-600">{tx.admin_comment || 'Не удалось выполнить перевод. Проверьте реквизиты и попробуйте снова.'}</p>}
            {tx.status === 'success' && <p className="text-sm text-emerald-600">Операция выполнена.</p>}
            <Button className="w-full" onClick={() => onOpenChange(false)}>Закрыть</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isWithdraw && (
              <>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
                  {([['sbp', 'По номеру телефона (СБП)', 'Smartphone'], ['card', 'На карту другого банка', 'CreditCard']] as const).map(([k, label, icon]) => (
                    <button key={k} type="button" onClick={() => { setMethod(k); setTarget(k === 'sbp' ? '+7' : ''); }}
                      className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${method === k ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>
                      <Icon name={icon} size={18} />{label}
                    </button>
                  ))}
                </div>
                <div>
                  <Label>{method === 'sbp' ? 'Номер телефона получателя' : 'Номер карты получателя'}</Label>
                  <Input inputMode="numeric" value={target} placeholder={method === 'sbp' ? '+7 (___) ___-__-__' : '0000 0000 0000 0000'}
                    onChange={(e) => setTarget(method === 'sbp' ? fmtPhone(e.target.value) : fmtCard(e.target.value))} />
                </div>
                <div>
                  <Label className="mb-2 block">Банк получателя</Label>
                  <BankPicker selected={bank} onSelect={setBank} maxHeightClass="max-h-48" />
                </div>
              </>
            )}
            <div>
              <Label>Сумма, ₽</Label>
              <Input type="number" min={100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              {isWithdraw && <p className="mt-1 text-xs text-muted-foreground">Доступно: {fmt(left)} ₽</p>}
            </div>
            {!isWithdraw && <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">Пополнение увеличивает доступный остаток по карте после подтверждения оператором.</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" onClick={submit} disabled={sending}>
              {sending ? 'Отправка…' : isWithdraw ? 'Вывести' : 'Пополнить'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CardTransferDialog;
