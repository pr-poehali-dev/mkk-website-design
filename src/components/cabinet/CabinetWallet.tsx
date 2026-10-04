import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import CardTransferDialog from '@/components/cabinet/CardTransferDialog';
import {
  apiGetMyCardTransactions, CARD_TX_STATUS_META, type CardTransaction,
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
  const [showCvv, setShowCvv] = useState(false);
  const [txMode, setTxMode] = useState<'topup' | 'withdraw' | null>(null);
  const [txs, setTxs] = useState<CardTransaction[]>([]);
  const [copied, setCopied] = useState(false);

  const copyNumber = async (num: string) => {
    try { await navigator.clipboard.writeText(num.replace(/\s/g, '')); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try { const [a, t] = await Promise.all([apiGetMyCardApplications(user.phone), apiGetMyCardTransactions(user.phone)]); setApps(a); setTxs(t); } catch { /* ignore */ } finally { setLoading(false); }
  };
  useEffect(() => { if (open) { load(); setForm(false); setError(''); setShowCvv(false); } }, [open]);

  const canOpen = user.status === 'repaid' || user.status === 'rejected';
  const REAPPLY_DAYS = 45;
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
            {shown && shown.status === 'new' ? (
              <div className="space-y-4 py-4 text-center">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent" />
                  <Icon name="CreditCard" size={32} className="text-accent" />
                </div>
                <p className="font-display text-lg font-bold text-primary">Заявка поступила как новая</p>
                <p className="text-sm text-muted-foreground">Мы скоро возьмём её в работу и сообщим о решении.</p>
                <div className="rounded-xl bg-secondary/60 p-3 text-sm">
                  <span className="text-muted-foreground">Запрошенный лимит: </span>
                  <span className="font-semibold text-primary">{fmt(shown.requested_limit)} ₽</span>
                </div>
              </div>
            ) : shown && shown.status === 'rejected' ? (() => {
              const since = new Date(shown.rejected_at || shown.updated_at).getTime();
              const daysPassed = Math.max(0, Math.floor((Date.now() - since) / 86400000));
              const daysLeft = Math.max(REAPPLY_DAYS - daysPassed, 0);
              const pct = Math.min(100, Math.round((daysPassed / REAPPLY_DAYS) * 100));
              const word = daysLeft % 10 === 1 && daysLeft % 100 !== 11 ? 'день' : [2, 3, 4].includes(daysLeft % 10) && ![12, 13, 14].includes(daysLeft % 100) ? 'дня' : 'дней';
              return (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600"><Icon name="XCircle" size={30} /></div>
                    <p className="font-display text-lg font-bold text-red-700">Ваша заявка на кредитную карту отклонена</p>
                    {shown.admin_comment && <p className="mt-2 text-sm text-red-700/80">{shown.admin_comment}</p>}
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Icon name="CalendarClock" size={13} /> Повторная подача</p>
                    {daysLeft > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground">Повторная подача возможна через {REAPPLY_DAYS} дней. Через <span className="font-semibold text-primary">{daysLeft} {word}</span> подача откроется снова.</p>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>
                      </>
                    ) : (
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><Icon name="CheckCircle2" size={15} /> Повторная подача уже доступна</p>
                    )}
                  </div>
                  {daysLeft === 0 && canOpen && <Button className="w-full" onClick={() => setForm(true)}>Подать заявку повторно</Button>}
                </div>
              );
            })() : shown ? (
              <>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 p-5 text-primary-foreground shadow-lg">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/30 blur-2xl" />
                  <div className="relative flex items-center justify-between text-xs opacity-90">
                    <span>Виртуальная карта</span><Icon name="Wallet" size={18} />
                  </div>
                  <div className="relative mt-5 h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-400/80" />
                  <div className="relative mt-4 flex items-center justify-between gap-2">
                    <p className="font-mono text-lg tracking-widest sm:text-xl">
                      {shown.status === 'issued' && shown.card_number ? shown.card_number : '•••• •••• •••• ••••'}
                    </p>
                    {shown.status === 'issued' && shown.card_number && (
                      <button type="button" onClick={() => copyNumber(shown.card_number!)} aria-label="Скопировать номер карты"
                        className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-white/15 px-2 text-xs hover:bg-white/25">
                        <Icon name={copied ? 'Check' : 'Copy'} size={14} />{copied ? 'Скопировано' : 'Копировать'}
                      </button>
                    )}
                  </div>
                  <div className="relative mt-3 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase opacity-70">Владелец</p>
                      <p className="truncate font-mono text-sm uppercase">{shown.status === 'issued' && shown.card_holder ? shown.card_holder : shown.full_name}</p>
                    </div>
                    <div className="flex shrink-0 items-end gap-4 text-right">
                      <div>
                        <p className="text-[10px] uppercase opacity-70">Действует до</p>
                        <p className="font-mono text-sm">{shown.status === 'issued' && shown.card_expiry ? shown.card_expiry : '••/••'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase opacity-70">CVV</p>
                        <div className="flex items-center justify-end gap-1">
                          <p className="font-mono text-sm">{shown.status === 'issued' && shown.card_cvv ? (showCvv ? shown.card_cvv : '•••') : '•••'}</p>
                          {shown.status === 'issued' && shown.card_cvv && (
                            <button type="button" onClick={() => setShowCvv(!showCvv)} aria-label={showCvv ? 'Скрыть CVV' : 'Показать CVV'}
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15 hover:bg-white/25">
                              <Icon name={showCvv ? 'EyeOff' : 'Eye'} size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-4 border-t border-white/20 pt-3">
                    <p className="text-xs opacity-80">{shown.status === 'issued' ? 'Доступный лимит' : shown.approved_limit ? 'Одобренный лимит' : 'Запрошенный лимит'}</p>
                    <p className="font-display text-2xl font-bold">{fmt(shown.approved_limit ?? shown.requested_limit)} ₽</p>
                  </div>
                </div>
                {shown.status === 'issued' && (() => {
                  const total = shown.approved_limit ?? 0;
                  const spent = Math.min(shown.spent_amount || 0, total);
                  const left = Math.max(total - spent, 0);
                  const pct = total > 0 ? Math.round((spent / total) * 100) : 0;
                  const bar = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-accent';
                  return (
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-primary">Использование лимита</p>
                        <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-xs text-muted-foreground">Потрачено</p><p className="font-semibold text-primary">{fmt(spent)} ₽</p></div>
                        <div className="text-right"><p className="text-xs text-muted-foreground">Доступно</p><p className="font-semibold text-emerald-600">{fmt(left)} ₽</p></div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Общий лимит: {fmt(total)} ₽</p>
                    </div>
                  );
                })()}
                {shown.status === 'issued' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => setTxMode('topup')} className="h-11"><Icon name="Plus" size={16} className="mr-1.5" />Пополнить</Button>
                      <Button variant="outline" onClick={() => setTxMode('withdraw')} className="h-11"><Icon name="ArrowUpRight" size={16} className="mr-1.5" />Вывести</Button>
                    </div>
                    {txs.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-semibold text-primary">Операции</p>
                        <div className="max-h-[204px] space-y-2 overflow-y-auto pr-1">
                          {txs.map((t) => (
                            <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                              <div className="min-w-0">
                                <p className="font-medium text-primary">{t.tx_type === 'topup' ? 'Пополнение' : t.method === 'sbp' ? 'Вывод по СБП' : 'Вывод на карту'}</p>
                                <p className="truncate text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}{t.bank ? ` · ${t.bank}` : ''}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-semibold text-primary">{t.tx_type === 'topup' ? '+' : '−'}{fmt(t.amount)} ₽</p>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CARD_TX_STATUS_META[t.status].badge}`}>{CARD_TX_STATUS_META[t.status].label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
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
      {card && txMode && (
        <CardTransferDialog open={!!txMode} onOpenChange={(v) => { if (!v) setTxMode(null); }} mode={txMode} card={card} user={user} onDone={() => load(true)} />
      )}
    </Dialog>
  );
};

export default CabinetWallet;
