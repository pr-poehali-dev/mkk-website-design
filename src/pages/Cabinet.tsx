import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { currentUser, logout, useRequests, STATUS_META, type LoanRequest } from '@/lib/loanStore';

const Cabinet = () => {
  const nav = useNavigate();
  useRequests();
  const [user, setUser] = useState<LoanRequest | null>(null);

  useEffect(() => {
    const u = currentUser();
    if (!u) nav('/login');
    else setUser(u);
  });

  if (!user) return null;

  const meta = STATUS_META[user.status];
  const fmt = (n: number) => n.toLocaleString('ru-RU');
  const steps = [
    { key: 'review', label: 'Заявка принята', icon: 'FileCheck' },
    { key: 'approved', label: 'Одобрено', icon: 'CheckCircle2' },
    { key: 'issued', label: 'Деньги выданы', icon: 'BadgeCheck' },
  ];
  const activeStep = meta.step;

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon name="Landmark" size={20} />
            </div>
            <span className="font-display text-lg font-bold tracking-wide text-primary">ЗАЙМЫ ПЛЮС</span>
          </Link>
          <button onClick={() => { logout(); nav('/login'); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
            <Icon name="LogOut" size={16} /> Выйти
          </button>
        </div>
      </header>

      <main className="container max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-primary">Личный кабинет</h1>
        <p className="mt-1 text-muted-foreground">Здравствуйте, {user.name.split(' ')[0]}!</p>

        {/* Статус-карта */}
        <div className="animate-fade-up mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center gap-4 border-b border-border p-6">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${meta.bg} ${meta.color} transition-all`}>
              <Icon name={meta.icon} size={32} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Статус заявки {user.id}</p>
              <p className={`font-display text-2xl font-bold ${meta.color}`}>{meta.label}</p>
            </div>
          </div>

          {/* Прогресс */}
          {user.status !== 'rejected' ? (
            <div className="grid grid-cols-3 gap-2 p-6">
              {steps.map((s, i) => {
                const done = activeStep >= i + 1;
                return (
                  <div key={s.key} className="flex flex-col items-center text-center">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${done ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      <Icon name={s.icon} size={20} />
                    </div>
                    <span className={`mt-2 text-xs font-medium ${done ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              К сожалению, по заявке принято отрицательное решение. Вы можете подать новую заявку через 7 дней.
            </div>
          )}
        </div>

        {/* Данные клиента */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-primary">
              <Icon name="Wallet" size={18} className="text-accent" /> Параметры займа
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Сумма</dt><dd className="font-semibold">{fmt(user.amount)} ₽</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Срок</dt><dd className="font-semibold">{user.days} дн.</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Дата заявки</dt><dd className="font-semibold">{user.createdAt}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-primary">
              <Icon name="User" size={18} className="text-accent" /> Мои данные
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">ФИО</dt><dd className="font-semibold">{user.name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Телефон</dt><dd className="font-semibold">{user.phone}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Паспорт</dt><dd className="font-semibold">{user.passport}</dd></div>
            </dl>
          </div>
        </div>

        {user.status === 'issued' && (
          <Button size="lg" className="mt-6 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90">
            Погасить займ <Icon name="ArrowRight" size={18} className="ml-1" />
          </Button>
        )}
      </main>
    </div>
  );
};

export default Cabinet;
