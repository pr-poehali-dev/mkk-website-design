import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { apiRegister } from '@/lib/api';

const Anketa = () => {
  const nav = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [f, setF] = useState({ lastname: '', firstname: '', phone: '', password: '', series: '', issued: '' });

  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    setApiError('');
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');
    try {
      await apiRegister({
        full_name: `${f.lastname} ${f.firstname}`.trim(),
        phone: f.phone,
        password: f.password,
        amount: 15000,
        days: 14,
        passport: f.series || undefined,
        passport_by: f.issued || undefined,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-primary px-4 text-primary-foreground">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="animate-fade-up relative max-w-md rounded-2xl bg-background p-10 text-center text-foreground shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Icon name="CheckCircle2" size={40} />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary">Анкета отправлена!</h1>
          <p className="mt-3 text-muted-foreground">
            Мы проверяем ваши данные. Решение придёт в течение 5 минут на указанный телефон.
          </p>
          <Button asChild size="lg" className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/login">Войти в личный кабинет <Icon name="ArrowRight" size={18} className="ml-1" /></Link>
          </Button>
          <button onClick={() => nav('/')} className="mt-3 block w-full text-sm text-muted-foreground hover:text-primary">
            На главную
          </button>
        </div>
      </div>
    );
  }

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
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
            <Icon name="ArrowLeft" size={16} /> Назад
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-10 md:py-14">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Шаг 2 из 3</p>
          <h1 className="font-display text-3xl font-bold text-primary sm:text-4xl">Анкета заёмщика</h1>
          <p className="mt-2 text-muted-foreground">Заполните данные — это займёт 2 минуты</p>
        </div>

        <form onSubmit={handleSubmit} className="animate-fade-up space-y-8 rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
          {/* Личные данные */}
          <fieldset className="space-y-4">
            <legend className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-primary">
              <Icon name="User" size={18} className="text-accent" /> Личные данные
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lastname">Фамилия</Label>
                <Input id="lastname" placeholder="Иванов" value={f.lastname} onChange={upd('lastname')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="firstname">Имя</Label>
                <Input id="firstname" placeholder="Иван" value={f.firstname} onChange={upd('firstname')} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Телефон</Label>
                <Input id="phone" type="tel" placeholder="+7 (___) ___-__-__" value={f.phone} onChange={upd('phone')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Придумайте пароль</Label>
                <Input id="password" type="password" placeholder="для входа в кабинет" value={f.password} onChange={upd('password')} required />
              </div>
            </div>
          </fieldset>

          {/* Паспорт */}
          <fieldset className="space-y-4">
            <legend className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-primary">
              <Icon name="BookUser" size={18} className="text-accent" /> Паспортные данные
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="series">Серия и номер</Label>
                <Input id="series" placeholder="0000 000000" value={f.series} onChange={upd('series')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="issued">Кем выдан</Label>
                <Input id="issued" placeholder="ОВД района..." value={f.issued} onChange={upd('issued')} required />
              </div>
            </div>

            {/* Загрузка фото */}
            <div className="space-y-1.5">
              <Label>Фото паспорта (разворот с фото)</Label>
              <label
                htmlFor="passport-photo"
                className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/50 p-8 text-center transition-colors hover:border-accent hover:bg-accent/5"
              >
                {photo ? (
                  <>
                    <img src={photo} alt="Паспорт" className="max-h-44 rounded-lg object-contain shadow-md" />
                    <span className="flex items-center gap-1.5 text-sm font-medium text-accent">
                      <Icon name="RefreshCw" size={15} /> Заменить фото
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                      <Icon name="Camera" size={26} />
                    </div>
                    <div>
                      <p className="font-medium text-primary">Нажмите, чтобы загрузить фото</p>
                      <p className="text-sm text-muted-foreground">JPG или PNG, до 10 МБ</p>
                    </div>
                  </>
                )}
              </label>
              <input id="passport-photo" type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
          </fieldset>

          {apiError && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <Icon name="AlertCircle" size={16} /> {apiError}
            </p>
          )}

          <div className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground py-4">
            <Icon name="ShieldCheck" size={16} className="mr-1.5 inline text-accent" />
            Ваши данные передаются по защищённому соединению и не передаются третьим лицам.
          </div>

          <Button type="submit" size="lg" disabled={loading}
            className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
            {loading ? (
              <span className="flex items-center gap-2"><Icon name="Loader2" size={18} className="animate-spin" /> Отправляем...</span>
            ) : (
              <span className="flex items-center gap-2">Отправить анкету <Icon name="Send" size={18} /></span>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Anketa;