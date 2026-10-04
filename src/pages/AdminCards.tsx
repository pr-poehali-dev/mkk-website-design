import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';
import {
  apiAdminListCardApplications, apiAdminUpdateCardApplication, apiAdminListCardTransactions, apiAdminUpdateCardTransaction,
  CARD_TX_STATUS_META, type CardTransaction, type CardTxStatus, CARD_MAX_LIMIT, CARD_STATUS_META,
  type CardApplication, type CardStatus,
} from '@/lib/api';

const fmt = (n: number) => n.toLocaleString('ru-RU');
const fmtDate = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Draft { status: CardStatus; limit: string; term: string; rate: string; spent: string; comment: string }

const AdminCards = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [items, setItems] = useState<CardApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CardStatus | 'all'>('new');
  const [open, setOpen] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [txs, setTxs] = useState<CardTransaction[]>([]);
  const [txSaving, setTxSaving] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try { const [a, t] = await Promise.all([apiAdminListCardApplications(), apiAdminListCardTransactions()]); setItems(a); setTxs(t); } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); } finally { setLoading(false); }
  };
  useEffect(() => { if (authed) load(); }, [authed]);

  if (!authed) return <AdminLoginScreen onAuth={() => setAuthed(true)} />;

  const draftOf = (a: CardApplication): Draft => drafts[a.id] || {
    status: a.status, limit: String(a.approved_limit ?? a.requested_limit), term: a.term_months ? String(a.term_months) : '',
    rate: a.rate_percent != null ? String(a.rate_percent) : '', spent: String(a.spent_amount || 0), comment: a.admin_comment || '',
  };
  const patch = (a: CardApplication, p: Partial<Draft>) => setDrafts({ ...drafts, [a.id]: { ...draftOf(a), ...p } });

  const save = async (a: CardApplication, recalc: boolean) => {
    const d = draftOf(a);
    setError(''); setSavingId(a.id);
    try {
      const upd = await apiAdminUpdateCardApplication({
        id: a.id, status: d.status, approved_limit: d.limit ? Number(d.limit) : null,
        term_months: d.term ? Number(d.term) : null, rate_percent: d.rate !== '' ? Number(d.rate) : null,
        admin_comment: d.comment || null, spent_amount: d.spent ? Number(d.spent) : 0, recalc,
      });
      setItems((prev) => prev.map((x) => (x.id === a.id ? upd : x)));
      setDrafts((p) => { const n = { ...p }; delete n[a.id]; return n; });
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); } finally { setSavingId(null); }
  };

  const changeTx = async (t: CardTransaction, status: CardTxStatus) => {
    const comment = status === 'error' ? window.prompt('Причина ошибки (увидит клиент)', t.admin_comment || '') : t.admin_comment;
    if (status === 'error' && comment === null) return;
    setTxSaving(t.id); setError('');
    try {
      await apiAdminUpdateCardTransaction({ id: t.id, status, admin_comment: comment || null });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); } finally { setTxSaving(null); }
  };

  const filtered = items.filter((a) => tab === 'all' || a.status === tab);
  const count = (s: CardStatus) => items.filter((a) => a.status === s).length;

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b bg-card"><div className="container flex items-center gap-3 px-4 py-4">
        <Link to="/admin" className="text-primary"><Icon name="ArrowLeft" size={20} /></Link>
        <h1 className="font-display text-xl font-bold text-primary">Заявки по карте</h1>
      </div></header>
      <main className="container max-w-4xl px-4 py-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', 'new', 'review', 'approved', 'issued', 'rejected'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-card text-primary border'}`}>
              {t === 'all' ? `Все (${items.length})` : `${CARD_STATUS_META[t].label} (${count(t)})`}
            </button>
          ))}
        </div>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {loading ? <div className="flex justify-center py-10"><Icon name="Loader2" className="animate-spin" /></div>
          : filtered.length === 0 ? <p className="py-10 text-center text-muted-foreground">Заявок нет</p>
          : <div className="space-y-3">{filtered.map((a) => {
            const d = draftOf(a); const isOpen = open === a.id;
            return (
              <div key={a.id} className="rounded-2xl border bg-card p-4">
                <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen(isOpen ? null : a.id)}>
                  <div>
                    <p className="font-semibold text-primary">{a.full_name}</p>
                    <p className="text-xs text-muted-foreground">{a.phone} · {fmtDate(a.created_at)} · запрошено {fmt(a.requested_limit)} ₽</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${CARD_STATUS_META[a.status].badge}`}>{CARD_STATUS_META[a.status].label}</span>
                </button>
                {isOpen && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div className="grid gap-1 text-sm sm:grid-cols-2">
                      <p><span className="text-muted-foreground">Заявка по займу:</span> {a.ref_number || '—'}</p>
                      <p><span className="text-muted-foreground">Email:</span> {a.email || '—'}</p>
                      <p><span className="text-muted-foreground">Дата рождения:</span> {a.birth_date || '—'}</p>
                      <p><span className="text-muted-foreground">Паспорт:</span> {a.passport || '—'}</p>
                      <p className="sm:col-span-2"><span className="text-muted-foreground">Адрес:</span> {a.address || '—'}</p>
                      <p><span className="text-muted-foreground">Работа:</span> {a.work_place || '—'}</p>
                      <p><span className="text-muted-foreground">Доход:</span> {a.income ? `${fmt(a.income)} ₽` : '—'}</p>
                    </div>
                    <div className="rounded-xl border bg-secondary/40 p-3 text-sm">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Данные карты</p>
                      {a.card_number ? (
                        <div className="grid gap-1 sm:grid-cols-4">
                          <p><span className="text-muted-foreground">Номер:</span> <span className="font-mono">{a.card_number}</span></p>
                          <p><span className="text-muted-foreground">Срок:</span> <span className="font-mono">{a.card_expiry}</span></p>
                          <p><span className="text-muted-foreground">Имя на карте:</span> <span className="font-mono">{a.card_holder}</span></p>
                          <p><span className="text-muted-foreground">CVV:</span> <span className="font-mono">{a.card_cvv || '—'}</span></p>
                        </div>
                      ) : <p className="text-muted-foreground">Номер сгенерируется автоматически при статусе «Карта выпущена».</p>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><Label>Статус (клиенту уйдёт письмо)</Label>
                        <select value={d.status} onChange={(e) => patch(a, { status: e.target.value as CardStatus })}
                          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
                          {(Object.keys(CARD_STATUS_META) as CardStatus[]).map((s) => <option key={s} value={s}>{CARD_STATUS_META[s].label}</option>)}
                        </select></div>
                      <div><Label>Лимит, ₽ (макс. {fmt(CARD_MAX_LIMIT)})</Label><Input type="number" max={CARD_MAX_LIMIT} value={d.limit} onChange={(e) => patch(a, { limit: e.target.value })} /></div>
                      <div><Label>Срок, мес.</Label><Input type="number" value={d.term} onChange={(e) => patch(a, { term: e.target.value })} /></div>
                      <div><Label>Ставка, % годовых</Label><Input type="number" value={d.rate} onChange={(e) => patch(a, { rate: e.target.value })} /></div>
                      <div><Label>Потрачено по карте, ₽</Label><Input type="number" min={0} value={d.spent} onChange={(e) => patch(a, { spent: e.target.value })} /></div>
                    </div>
                    <div><Label>Комментарий клиенту</Label><Textarea value={d.comment} onChange={(e) => patch(a, { comment: e.target.value })} /></div>
                    {a.schedule && a.schedule.length > 0 && (
                      <div className="max-h-48 overflow-y-auto rounded-xl border text-xs">
                        <table className="w-full"><thead className="bg-secondary"><tr><th className="p-2 text-left">№</th><th className="p-2 text-left">Дата</th><th className="p-2 text-right">Платёж</th><th className="p-2 text-right">Основной долг</th><th className="p-2 text-right">Проценты</th><th className="p-2 text-right">Остаток</th></tr></thead>
                          <tbody>{a.schedule.map((s) => (<tr key={s.n} className="border-t"><td className="p-2">{s.n}</td><td className="p-2">{new Date(s.date).toLocaleDateString('ru-RU')}</td><td className="p-2 text-right">{fmt(s.payment)}</td><td className="p-2 text-right">{fmt(s.principal)}</td><td className="p-2 text-right">{fmt(s.interest)}</td><td className="p-2 text-right">{fmt(s.balance)}</td></tr>))}</tbody></table>
                      </div>
                    )}
                    {txs.filter((t) => t.application_id === a.id).length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-semibold text-primary">Операции по карте</p>
                        <div className="space-y-2">
                          {txs.filter((t) => t.application_id === a.id).map((t) => (
                            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                              <div>
                                <p className="font-medium text-primary">{t.tx_type === 'topup' ? 'Пополнение' : t.method === 'sbp' ? 'Вывод по СБП' : 'Вывод на карту'} · {fmt(t.amount)} ₽</p>
                                <p className="text-xs text-muted-foreground">{fmtDate(t.created_at)}{t.target ? ` · ${t.target}` : ''}{t.bank ? ` · ${t.bank}` : ''}</p>
                                {t.admin_comment && <p className="text-xs text-red-600">{t.admin_comment}</p>}
                              </div>
                              <select value={t.status} disabled={txSaving === t.id} onChange={(e) => changeTx(t, e.target.value as CardTxStatus)}
                                className="h-9 rounded-md border bg-background px-2 text-sm">
                                {(Object.keys(CARD_TX_STATUS_META) as CardTxStatus[]).map((k) => <option key={k} value={k}>{CARD_TX_STATUS_META[k].label}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => save(a, false)} disabled={savingId === a.id}>{savingId === a.id ? 'Сохранение…' : 'Сохранить'}</Button>
                      <Button variant="outline" onClick={() => save(a, true)} disabled={savingId === a.id || !d.limit || !d.term}>Сохранить и пересчитать график</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}</div>}
      </main>
    </div>
  );
};

export default AdminCards;
