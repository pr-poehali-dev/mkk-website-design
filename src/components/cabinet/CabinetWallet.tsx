import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import {
  apiGetMyCardApplications, apiCreateCardApplication, CARD_MAX_LIMIT, CARD_STATUS_META,
  type CardApplication, type UserSession,
} from '@/lib/api';

const fmt = (n: number) => n.toLocaleString('ru-RU');

interface Props { open: boolean; onOpenChange: (v: boolean) => void; user: UserSession }

const CabinetWallet = ({ open, onOpenChange, user }: Props) => {
  const [apps, setApps] = useState<CardApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(false);
  const [limit, setLimit] = useState(50000);
  const [f, setF] = useState({
    full_name: user.full_name, birth_date: user.birth_date || '', passport: user.passport || '',
    address: user.address_registration || user.address_residence || '', work_place: user.work_place || '',
    income: '', email: user.email || '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { setApps(await apiGetMyCardApplications(user.phone)); } catch { /* ignore */ } finally { setLoading(false); }
  };
  useEffect(() => { if (open) { load(); setForm(false); setError(''); } }, [open]);

  const canOpen = user.status === 'repaid' || user.status === 'rejected';
  const current = apps[0];
  const card = apps.find((a) => a.status === 'issued');
  const pending = apps.find((a) => a.status === 'new' || a.status === 'review');
  const shown = card || pending || current;

  const submit = async () => {
    setError('');
    if (!f.full_name.trim() || !f.passport.trim() || !f.address.trim()) { setError('Заполните ФИО, паспорт и адрес'); return; }
    setSending(true);
    try {
      await apiCreateCardApplication({
        ref_number: user.ref_number, phone: user.phone, requested_limit: limit,
        full_name: f.full_name.trim(), birth_date: f.birth_date, passport: f.passport.trim(),
        address: f.address.trim(), work_place: f.work_place, income: f.income ? Number(f.income) : undefined,
        email: f.email || null,
      });
      setForm(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); } finally { setSending(false); }
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle className="font-display text-xl text-primary">Кошелёк</DialogTitle></DialogHeader>

        {loading && <div className="flex justify-center py-8"><Icon name="Loader2" className="animate-spin text-primary" /></div>}

        {!loading && !form && (
          <div className="space-y-4">
            {shown ? (
              <>
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground shadow-lg">
                  <div className="flex items-center justify-between text-xs opacity-80">
                    <span>Виртуальная карта</span><Icon name="Wallet" size={18} />
                  </div>
                  <p className="mt-6 text-xs opacity-80">{shown.status === 'issued' ? 'Доступный лимит' : shown.approved_limit ? 'Одобренный лимит' : 'Запрошенный лимит'}</p>
                  <p className="font-display text-3xl font-bold">{fmt(shown.approved_limit ?? shown.requested_limit)} ₽</p>
                  <p className="mt-3 text-sm opacity-90">{shown.full_name}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Статус заявки</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${CARD_STATUS_META[shown.status].badge}`}>{CARD_STATUS_META[shown.status].label}</span>
                </div>
                {shown.term_months && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Срок</span><span>{shown.term_months} мес.</span></div>}
                {shown.rate_percent != null && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ставка</span><span>{shown.rate_percent}% годовых</span></div>}
                {shown.admin_comment && <p className="rounded-xl bg-secondary p-3 text-sm">{shown.admin_comment}</p>}
                {shown.schedule && shown.schedule.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-primary">График платежей</p>
                    <div className="max-h-48 overflow-y-auto rounded-xl border text-xs">
                      <table className="w-full">
                        <thead className="bg-secondary"><tr><th className="p-2 text-left">№</th><th className="p-2 text-left">Дата</th><th className="p-2 text-right">Платёж</th><th className="p-2 text-right">Остаток</th></tr></thead>
                        <tbody>{shown.schedule.map((s) => (
                          <tr key={s.n} className="border-t"><td className="p-2">{s.n}</td><td className="p-2">{new Date(s.date).toLocaleDateString('ru-RU')}</td><td className="p-2 text-right">{fmt(s.payment)} ₽</td><td className="p-2 text-right">{fmt(s.balance)} ₽</td></tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                )}
                {shown.status === 'rejected' && canOpen && <Button className="w-full" onClick={() => setForm(true)}>Подать заявку повторно</Button>}
              </>
            ) : (
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent"><Icon name="CreditCard" size={28} /></div>
                <p className="font-semibold text-primary">У вас пока нет карты</p>
                <p className="text-sm text-muted-foreground">Откройте виртуальную карту онлайн с лимитом до {fmt(CARD_MAX_LIMIT)} ₽.</p>
                {canOpen
                  ? <Button className="w-full" onClick={() => setForm(true)}>Открыть карту</Button>
                  : <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">Оформить карту можно после погашения займа или при отклонённой заявке.</p>}
              </div>
            )}
          </div>
        )}

        {!loading && form && (
          <div className="space-y-3">
            <div>
              <Label>Желаемый лимит: <b>{fmt(limit)} ₽</b></Label>
              <input type="range" min={5000} max={CARD_MAX_LIMIT} step={5000} value={limit}
                onChange={(e) => setLimit(Number(e.target.value))} className="mt-2 w-full accent-[hsl(var(--accent))]" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>5 000 ₽</span><span>{fmt(CARD_MAX_LIMIT)} ₽</span></div>
            </div>
            <div><Label>ФИО</Label><Input value={f.full_name} onChange={set('full_name')} /></div>
            <div><Label>Дата рождения</Label><Input value={f.birth_date} onChange={set('birth_date')} placeholder="ДД.ММ.ГГГГ" /></div>
            <div><Label>Паспорт (серия и номер)</Label><Input value={f.passport} onChange={set('passport')} /></div>
            <div><Label>Адрес регистрации</Label><Input value={f.address} onChange={set('address')} /></div>
            <div><Label>Место работы</Label><Input value={f.work_place} onChange={set('work_place')} /></div>
            <div><Label>Ежемесячный доход, ₽</Label><Input type="number" value={f.income} onChange={set('income')} /></div>
            <div><Label>Email для уведомлений</Label><Input type="email" value={f.email} onChange={set('email')} /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setForm(false)}>Назад</Button>
              <Button className="flex-1" onClick={submit} disabled={sending}>{sending ? 'Отправка…' : 'Отправить на рассмотрение'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CabinetWallet;
