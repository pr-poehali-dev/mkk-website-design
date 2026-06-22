import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { apiGetAll, apiSetStatus, type UserSession } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';

const ADMIN_PASS = 'admin';

const Admin = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [requests, setRequests] = useState<UserSession[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [changingId, setChangingId] = useState<string | null>(null);

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const fetchAll = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await apiGetAll();
      setRequests(data);
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchAll();
  }, [authed, fetchAll]);

  const handleStatusChange = async (ref_number: string, status: string) => {
    setChangingId(ref_number);
    try {
      await apiSetStatus(ref_number, status);
      setRequests((prev) => prev.map((r) => r.ref_number === ref_number ? { ...r, status } : r));
    } catch {
      // ignore
    } finally {
      setChangingId(null);
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
              <Input id="ap" type="password" value={pass}
                onChange={(e) => { setPass(e.target.value); setErr(''); }} placeholder="••••" />
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
          <div className="flex items-center gap-3">
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
                className="animate-fade-up flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
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
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`hidden text-sm font-medium sm:block ${meta.color}`}>{meta.label}</span>
                  <Select
                    value={status}
                    disabled={changingId === r.ref_number}
                    onValueChange={(v) => handleStatusChange(r.ref_number, v)}
                  >
                    <SelectTrigger className="w-[180px]">
                      {changingId === r.ref_number
                        ? <span className="flex items-center gap-1.5"><Icon name="Loader2" size={14} className="animate-spin" /> Сохраняем...</span>
                        : <SelectValue />
                      }
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_META) as StatusKey[]).map((k) => (
                        <SelectItem key={k} value={k}>{STATUS_META[k].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>

        <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <Icon name="ArrowLeft" size={16} /> На сайт
        </Link>
      </main>
    </div>
  );
};

export default Admin;
