import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useRequests, setStatus, STATUS_META, type StatusKey } from '@/lib/loanStore';

const ADMIN_PASS = 'admin';

const Admin = () => {
  const requests = useRequests();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  if (!authed) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-primary px-4 text-primary-foreground">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="animate-fade-up relative w-full max-w-sm rounded-2xl bg-background p-8 text-foreground shadow-2xl">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Icon name="ShieldAlert" size={22} className="text-accent" />
            <h1 className="font-display text-xl font-bold">Панель администратора</h1>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (pass === ADMIN_PASS) { sessionStorage.setItem('zaimy_admin', '1'); setAuthed(true); } else setErr('Неверный пароль'); }}
            className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ap">Пароль администратора</Label>
              <Input id="ap" type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(''); }} placeholder="admin" />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Войти</Button>
            <p className="text-center text-xs text-muted-foreground">Демо-пароль: <b>admin</b></p>
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
          <button onClick={() => { sessionStorage.removeItem('zaimy_admin'); setAuthed(false); }}
            className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
            <Icon name="LogOut" size={16} /> Выйти
          </button>
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
          {requests.map((r) => {
            const meta = STATUS_META[r.status];
            return (
              <div key={r.id} className="animate-fade-up flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.color}`}>
                    <Icon name={meta.icon} size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{r.name} <span className="text-xs font-normal text-muted-foreground">· {r.id}</span></p>
                    <p className="text-sm text-muted-foreground">{r.phone} · {fmt(r.amount)} ₽ / {r.days} дн.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                  <Select value={r.status} onValueChange={(v) => setStatus(r.id, v as StatusKey)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
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
          {requests.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">Заявок пока нет</p>
          )}
        </div>

        <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <Icon name="ArrowLeft" size={16} /> На сайт
        </Link>
      </main>
    </div>
  );
};

export default Admin;
