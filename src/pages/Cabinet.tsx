import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { getSession, clearSession, apiGetRequest, saveSession, apiUpdateRequest, type UserSession } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';

const Cabinet = () => {
  const nav = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [contractSigned, setContractSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { nav('/login'); return; }
    setUser(session);
    setLoading(false);
    apiGetRequest(session.ref_number).then((fresh) => {
      saveSession(fresh);
      setUser(fresh);
    }).catch(() => {});
  }, [nav]);

  const handleLogout = () => { clearSession(); nav('/login'); };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const status = (user.status as StatusKey) in STATUS_META ? (user.status as StatusKey) : 'review';
  const meta = STATUS_META[status];
  const fmt = (n: number) => n.toLocaleString('ru-RU');
  const contractCode = `ДГ-${user.ref_number}-${user.created_at?.slice(0, 10).replace(/-/g, '')}`;
  const steps = [
    { key: 'review', label: 'Заявка принята', icon: 'FileCheck' },
    { key: 'approved', label: 'Одобрено', icon: 'CheckCircle2' },
    { key: 'issued', label: 'Деньги выданы', icon: 'BadgeCheck' },
  ];
  const activeStep = meta.step;
  const initials = user.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

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

          {/* Меню + аватар */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials}
              </div>
              <span className="hidden sm:block">{user.full_name.split(' ')[0]}</span>
              <Icon name="ChevronDown" size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-primary">Личный кабинет</h1>
        <p className="mt-1 text-muted-foreground">Здравствуйте, {user.full_name.split(' ')[0]}!</p>

        {/* Статус-карта */}
        <div className="animate-fade-up mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center gap-4 border-b border-border p-6">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${meta.bg} ${meta.color} transition-all`}>
              <Icon name={meta.icon} size={32} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Статус заявки {user.ref_number}</p>
              <p className={`font-display text-2xl font-bold ${meta.color}`}>{meta.label}</p>
            </div>
          </div>

          {status !== 'rejected' ? (
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

        {/* Займ */}
        <div className="mt-6">
          {status === 'approved' ? (
            <div className="rounded-2xl border-2 border-accent/50 bg-accent/5 p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-primary">
                <Icon name="FileSignature" size={18} className="text-accent" /> Условия займа
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Сумма</dt><dd className="font-semibold">{fmt(user.amount)} ₽</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Срок</dt><dd className="font-semibold">{user.days} дн.</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Ставка</dt><dd className="font-semibold">0.8% / день</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Переплата</dt><dd className="font-semibold">{fmt(Math.round(user.amount * 0.008 * user.days))} ₽</dd></div>
                <div className="flex justify-between border-t border-accent/20 pt-2">
                  <dt className="font-semibold text-primary">К возврату</dt>
                  <dd className="font-bold text-accent text-base">{fmt(user.amount + Math.round(user.amount * 0.008 * user.days))} ₽</dd>
                </div>
              </dl>
              <div className="mt-4 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                Номер договора: <span className="font-mono font-semibold text-primary">{contractCode}</span>
              </div>
              {contractSigned ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">
                  <Icon name="CheckCircle2" size={16} /> Договор подписан
                </div>
              ) : (
                <Button size="sm" className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={signing}
                  onClick={async () => {
                    if (!user) return;
                    setSigning(true);
                    setContractSigned(true);
                    try {
                      await apiUpdateRequest({ ref_number: user.ref_number, status: 'issued' });
                      const fresh = await apiGetRequest(user.ref_number);
                      saveSession(fresh);
                      setUser(fresh);
                    } catch (_) {
                      setContractSigned(false);
                    } finally {
                      setSigning(false);
                    }
                  }}>
                  {signing
                    ? <span className="flex items-center gap-2"><Icon name="Loader2" size={15} className="animate-spin" /> Оформляем...</span>
                    : <span className="flex items-center gap-2"><Icon name="PenLine" size={15} /> Подписать договор</span>
                  }
                </Button>
              )}
            </div>
          ) : (
            <div className={`rounded-2xl border p-6 ${status === 'issued' ? 'border-accent/40 bg-accent/5' : 'border-border bg-card'}`}>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-primary">
                <Icon name={status === 'issued' ? 'BadgeDollarSign' : 'Wallet'} size={18} className="text-accent" />
                {status === 'issued' ? 'Активный займ' : 'Параметры займа'}
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Сумма займа</dt><dd className="font-semibold">{fmt(user.amount)} ₽</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Срок</dt><dd className="font-semibold">{user.days} дн.</dd></div>
                {status === 'issued' && (
                  <>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Переплата (0.8%/день)</dt><dd className="font-semibold">{fmt(Math.round(user.amount * 0.008 * user.days))} ₽</dd></div>
                    <div className="flex justify-between border-t border-accent/20 pt-2">
                      <dt className="font-semibold text-primary">К возврату</dt>
                      <dd className="font-bold text-accent text-base">{fmt(user.amount + Math.round(user.amount * 0.008 * user.days))} ₽</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between"><dt className="text-muted-foreground">Дата заявки</dt><dd className="font-semibold">{user.created_at?.slice(0, 10)}</dd></div>
              </dl>
            </div>
          )}
        </div>

        {/* Комментарий оператора */}
        {user.operator_comment && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Icon name="MessageSquare" size={20} />
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold text-primary">Сообщение от оператора</p>
              <p className="text-sm text-muted-foreground">{user.operator_comment}</p>
            </div>
          </div>
        )}

        {status === 'issued' && (
          <Button size="lg" className="mt-6 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90">
            Погасить займ <Icon name="ArrowRight" size={18} className="ml-1" />
          </Button>
        )}
      </main>

      {/* Поп-ап меню */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Меню</DialogTitle>
          </DialogHeader>

          {/* Аватар + имя */}
          <div className="flex items-center gap-3 rounded-xl bg-secondary p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-primary">{user.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
          </div>

          {/* Пункты меню */}
          <div className="space-y-1">
            <button
              onClick={() => { setProfileOpen(true); setMenuOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Icon name="User" size={18} className="text-accent" /> Мои данные
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
              <Icon name="LogOut" size={18} /> Выйти из кабинета
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Поп-ап Мои данные */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Мои данные</DialogTitle>
          </DialogHeader>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">ФИО</dt>
              <dd className="font-semibold text-right">{user.full_name}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Телефон</dt>
              <dd className="font-semibold">{user.phone}</dd>
            </div>
            {user.birth_date && (
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">Дата рождения</dt>
                <dd className="font-semibold">{user.birth_date}</dd>
              </div>
            )}
            {user.passport && (
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">Паспорт</dt>
                <dd className="font-semibold">{user.passport}</dd>
              </div>
            )}
            {user.address_residence && (
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">Адрес</dt>
                <dd className="font-semibold text-right max-w-[180px]">{user.address_residence}</dd>
              </div>
            )}
            {user.work_place && (
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">Работа</dt>
                <dd className="font-semibold text-right max-w-[180px]">{user.work_place}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Заявка</dt>
              <dd className="font-semibold">{user.ref_number}</dd>
            </div>
          </dl>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cabinet;
