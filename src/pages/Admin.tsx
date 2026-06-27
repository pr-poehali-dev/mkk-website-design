import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { apiGetAll, apiUpdateRequest, type UserSession } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';

const ADMIN_PASS = 'admin';

const Admin = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [requests, setRequests] = useState<UserSession[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState<UserSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ status: '', amount: '', days: '', operator_comment: '', payment_bank: '' });

  const BANKS = [
    { name: 'Сбербанк', icon: '🟢' },
    { name: 'Тинькофф', icon: '🟡' },
    { name: 'ВТБ', icon: '🔵' },
    { name: 'Альфа-Банк', icon: '🔴' },
    { name: 'Газпромбанк', icon: '🔷' },
    { name: 'Россельхозбанк', icon: '🟩' },
    { name: 'Почта Банк', icon: '📮' },
    { name: 'Совкомбанк', icon: '🟠' },
    { name: 'Открытие', icon: '🌐' },
    { name: 'Другой банк', icon: '🏦' },
  ];

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const fetchAll = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await apiGetAll();
      setRequests(data);
    } catch (_) {
      // ignore
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { if (authed) fetchAll(); }, [authed, fetchAll]);

  const openModal = (r: UserSession) => {
    setSelected(r);
    setEditForm({
      status: r.status,
      amount: String(r.amount),
      days: String(r.days),
      operator_comment: r.operator_comment || '',
      payment_bank: r.payment_bank || '',
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiUpdateRequest({
        ref_number: selected.ref_number,
        status: editForm.status,
        amount: parseInt(editForm.amount),
        days: parseInt(editForm.days),
        operator_comment: editForm.operator_comment,
        payment_bank: editForm.payment_bank || null,
      });
      setRequests((prev) => prev.map((r) => r.ref_number === selected.ref_number
        ? { ...r, status: editForm.status, amount: parseInt(editForm.amount), days: parseInt(editForm.days), operator_comment: editForm.operator_comment }
        : r
      ));
      setSelected(null);
    } catch (_) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (!authed) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-primary px-4 text-primary-foreground">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="animate-fade-up relative w-full max-w-sm rounded-2xl bg-background p-8 text-foreground shadow-2xl">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Icon name="ShieldAlert" size={22} className="text-accent" />
            <h1 className="font-display text-xl font-bold">Панель администратора</h1>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (pass === ADMIN_PASS) { sessionStorage.setItem('zaimy_admin', '1'); setAuthed(true); }
            else setErr('Неверный пароль');
          }} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ap">Пароль администратора</Label>
              <Input id="ap" type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(''); }} placeholder="••••" />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Войти</Button>
          </form>
        </div>
      </div>
    );
  }

  const stats = (Object.keys(STATUS_META) as StatusKey[]).map((k) => ({
    key: k, ...STATUS_META[k], count: requests.filter((r) => r.status === k).length,
  }));

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon name="LayoutDashboard" size={20} className="text-accent" />
            <span className="font-display text-lg font-bold tracking-wide">АДМИН · ЗАЙМЫ ПЛЮС</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchAll} className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="RefreshCw" size={16} className={loadingList ? 'animate-spin' : ''} /> Обновить
            </button>
            <button onClick={() => { sessionStorage.removeItem('zaimy_admin'); setAuthed(false); }}
              className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="LogOut" size={16} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-primary">Управление заявками</h1>

        {/* Статистика */}
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.key} className="rounded-2xl border border-border bg-card p-4">
              <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                <Icon name={s.icon} size={20} />
              </div>
              <p className="font-display text-2xl font-bold text-primary">{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Список заявок */}
        <div className="mt-6 space-y-3">
          {loadingList && requests.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
            </div>
          )}
          {!loadingList && requests.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">Заявок пока нет</p>
          )}
          {requests.map((r) => {
            const status = (r.status as StatusKey) in STATUS_META ? (r.status as StatusKey) : 'review';
            const meta = STATUS_META[status];
            return (
              <div key={r.ref_number}
                className="animate-fade-up flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.color}`}>
                    <Icon name={meta.icon} size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">
                      {r.full_name} <span className="text-xs font-normal text-muted-foreground">· {r.ref_number}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.phone} · {fmt(r.amount)} ₽ / {r.days} дн. · {r.created_at?.slice(0, 10)}
                    </p>
                    {r.operator_comment && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-accent">
                        <Icon name="MessageSquare" size={12} /> {r.operator_comment}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`hidden text-sm font-medium sm:block ${meta.color}`}>{meta.label}</span>
                  <Button size="sm" variant="outline" onClick={() => openModal(r)}
                    className="flex items-center gap-1.5">
                    <Icon name="Pencil" size={14} /> Изменить
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <Icon name="ArrowLeft" size={16} /> На сайт
        </Link>
      </main>

      {/* Модалка редактирования */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">
              Заявка {selected?.ref_number}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              {/* Данные клиента — только просмотр */}
              <div className="rounded-xl bg-secondary p-4 text-sm space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Данные клиента</p>
                {[
                  { label: 'ФИО', value: selected.full_name },
                  { label: 'Телефон', value: selected.phone },
                  { label: 'Дата рождения', value: selected.birth_date },
                  { label: 'Паспорт', value: selected.passport ? `${selected.passport}${selected.passport_by ? ` · ${selected.passport_by}` : ''}` : undefined },
                  { label: 'Адрес проживания', value: selected.address_residence },
                  { label: 'Адрес регистрации', value: selected.address_registration },
                  { label: 'Место работы', value: selected.work_place },
                  { label: 'Рабочий телефон', value: selected.work_phone },
                  { label: 'Дата заявки', value: selected.created_at?.slice(0, 10) },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className="flex justify-between gap-4 border-b border-border pb-1.5 last:border-0 last:pb-0">
                    <span className="text-muted-foreground shrink-0">{f.label}</span>
                    <span className="font-medium text-primary text-right">{f.value}</span>
                  </div>
                ))}
                {selected.income_doc_url && (
                  <a href={selected.income_doc_url} target="_blank" rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1.5 text-accent hover:underline">
                    <Icon name="FileImage" size={14} /> Фото документа
                  </a>
                )}
              </div>

              {/* Статус */}
              <div className="space-y-1.5">
                <Label>Статус заявки</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_META) as StatusKey[]).map((k) => (
                      <SelectItem key={k} value={k}>{STATUS_META[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Сумма и срок */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-amount">Сумма займа (₽)</Label>
                  <Input id="edit-amount" type="number" min={1000} max={500000}
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-days">Срок (дней)</Label>
                  <Input id="edit-days" type="number" min={1} max={365}
                    value={editForm.days}
                    onChange={(e) => setEditForm({ ...editForm, days: e.target.value })} />
                </div>
              </div>

              {/* Расчёт займа */}
              {editForm.amount && editForm.days && (
                <div className="rounded-xl bg-accent/5 border border-accent/20 p-4 text-sm space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">Расчёт займа</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Сумма займа</span>
                    <span className="font-medium">{fmt(parseInt(editForm.amount) || 0)} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Срок</span>
                    <span className="font-medium">{editForm.days} дн.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ставка</span>
                    <span className="font-medium">0.8% / день</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Переплата</span>
                    <span className="font-medium">{fmt(Math.round((parseInt(editForm.amount) || 0) * 0.008 * (parseInt(editForm.days) || 0)))} ₽</span>
                  </div>
                  <div className="flex justify-between border-t border-accent/20 pt-2">
                    <span className="font-semibold text-primary">К возврату</span>
                    <span className="font-bold text-primary text-base">
                      {fmt((parseInt(editForm.amount) || 0) + Math.round((parseInt(editForm.amount) || 0) * 0.008 * (parseInt(editForm.days) || 0)))} ₽
                    </span>
                  </div>
                </div>
              )}

              {/* Способ получения */}
              <div className="space-y-2">
                <Label>Способ получения займа</Label>
                {editForm.payment_bank ? (
                  <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/5 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Icon name="Smartphone" size={16} className="text-accent" />
                      {BANKS.find(b => b.name === editForm.payment_bank)?.icon} {editForm.payment_bank} · СБП
                    </div>
                    <button onClick={() => setEditForm({ ...editForm, payment_bank: '' })}
                      className="text-xs text-muted-foreground hover:text-red-500">Сбросить</button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Клиент ещё не выбрал банк</p>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  {BANKS.map((bank) => (
                    <button key={bank.name}
                      onClick={() => setEditForm({ ...editForm, payment_bank: bank.name })}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${editForm.payment_bank === bank.name ? 'border-accent bg-accent/10 text-primary' : 'border-border bg-card text-primary hover:bg-secondary'}`}>
                      <span>{bank.icon}</span>
                      <span>{bank.name}</span>
                      {editForm.payment_bank === bank.name && <Icon name="Check" size={12} className="ml-auto text-accent" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Комментарий оператора */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-comment">Комментарий оператора</Label>
                <Textarea id="edit-comment" rows={3}
                  placeholder="Будет виден клиенту в личном кабинете..."
                  value={editForm.operator_comment}
                  onChange={(e) => setEditForm({ ...editForm, operator_comment: e.target.value })} />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                  {saving
                    ? <span className="flex items-center gap-2"><Icon name="Loader2" size={16} className="animate-spin" /> Сохранение...</span>
                    : <span className="flex items-center gap-2"><Icon name="Save" size={16} /> Сохранить</span>
                  }
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)} className="flex-1">
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;