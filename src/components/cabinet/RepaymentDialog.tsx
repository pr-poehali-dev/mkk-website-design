import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import BankPicker from '@/components/BankPicker';

const fmt = (n: number) => n.toLocaleString('ru-RU');
const fmtCard = (raw: string) => raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExp = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  totalDue: number;
  breakdown?: { label: string; value: number; danger?: boolean }[];
  supportUrl: string;
  supportText: string;
  note?: string;
}

type Step = 'form' | 'checking' | 'error';

const RepaymentDialog = ({ open, onOpenChange, totalDue, breakdown, supportUrl, supportText, note }: Props) => {
  const min = Math.min(100, totalDue);
  const [amount, setAmount] = useState(totalDue);
  const [method, setMethod] = useState<'card' | 'sbp'>('card');
  const [card, setCard] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [bank, setBank] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [formError, setFormError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setAmount(totalDue); setMethod('card'); setCard(''); setExp(''); setCvv('');
      setBank(null); setStep('form'); setFormError('');
    }
    return () => clearTimeout(timer.current);
  }, [open, totalDue]);

  const startCheck = () => {
    setStep('checking');
    timer.current = setTimeout(() => setStep('error'), 3000);
  };

  const payCard = () => {
    setFormError('');
    if (card.replace(/\D/g, '').length !== 16) { setFormError('Введите номер карты (16 цифр)'); return; }
    if (exp.length !== 5) { setFormError('Введите срок действия карты'); return; }
    if (cvv.length !== 3) { setFormError('Введите CVV-код'); return; }
    startCheck();
  };

  const pickBank = (name: string) => {
    setBank(name);
    startCheck();
  };

  const step2 = step !== 'form';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-sm overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Icon name="BadgeDollarSign" size={20} className="text-accent" />
            Погашение займа
          </DialogTitle>
        </DialogHeader>

        {step === 'checking' && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Icon name="Loader2" size={40} className="animate-spin text-accent" />
            <p className="font-semibold text-primary">{method === 'card' ? 'Проверяем карту…' : `Проверяем ${bank || 'банк'}…`}</p>
            <p className="text-sm text-muted-foreground">Пожалуйста, подождите</p>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Icon name="XCircle" size={32} />
            </div>
            <p className="font-display text-lg font-bold text-primary">Ошибка привязки карты</p>
            <p className="text-sm text-muted-foreground">Обратитесь в поддержку — специалист поможет оплатить займ.</p>
            <a href={supportUrl} target="_blank" rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
              <Icon name="MessageCircle" size={17} className="shrink-0" />{supportText}
            </a>
            <Button variant="outline" className="w-full" onClick={() => setStep('form')}>Попробовать снова</Button>
          </div>
        )}

        {!step2 && (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
              <p className="text-xs text-muted-foreground">Точная сумма к погашению на сегодня</p>
              <p className="font-display text-3xl font-bold text-primary">{fmt(totalDue)} ₽</p>
              {breakdown && breakdown.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-accent/20 pt-3 text-sm">
                  {breakdown.map((b) => (
                    <div key={b.label} className="flex justify-between">
                      <span className={b.danger ? 'text-red-600' : 'text-muted-foreground'}>{b.label}</span>
                      <span className={`font-medium ${b.danger ? 'text-red-700' : 'text-primary'}`}>{fmt(b.value)} ₽</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-secondary/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Сумма платежа</p>
                  <p className="font-display text-2xl font-bold text-primary">{fmt(amount)} ₽</p>
                </div>
                {amount !== totalDue && (
                  <button type="button" onClick={() => setAmount(totalDue)} className="rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-accent shadow-sm hover:bg-secondary">
                    Погасить всё
                  </button>
                )}
              </div>
              <Slider className="mt-4" min={min} max={totalDue} step={100} value={[Math.min(amount, totalDue)]}
                onValueChange={(v) => setAmount(v[0] >= totalDue - 50 ? totalDue : v[0])} disabled={totalDue <= min} />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{fmt(min)} ₽</span><span>Всё: {fmt(totalDue)} ₽</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
              {([['card', 'Картой', 'CreditCard'], ['sbp', 'Через СБП', 'Smartphone']] as const).map(([k, label, icon]) => (
                <button key={k} type="button" onClick={() => { setMethod(k); setFormError(''); }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${method === k ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>
                  <Icon name={icon} size={16} />{label}
                </button>
              ))}
            </div>

            {method === 'card' ? (
              <div className="space-y-3">
                <div>
                  <Label>Номер карты</Label>
                  <Input inputMode="numeric" placeholder="0000 0000 0000 0000" value={card} onChange={(e) => setCard(fmtCard(e.target.value))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Срок действия</Label><Input inputMode="numeric" placeholder="ММ/ГГ" value={exp} onChange={(e) => setExp(fmtExp(e.target.value))} /></div>
                  <div><Label>CVV</Label><Input inputMode="numeric" type="password" placeholder="•••" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} /></div>
                </div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <Button className="h-11 w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90" onClick={payCard}>
                  Оплатить {fmt(amount)} ₽
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Выберите банк</Label>
                <BankPicker selected={bank} onSelect={pickBank} maxHeightClass="max-h-56" />
              </div>
            )}

            {note && <p className="text-xs text-muted-foreground">{note}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RepaymentDialog;
