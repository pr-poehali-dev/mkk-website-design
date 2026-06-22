import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { login } from '@/lib/loanStore';

const Login = () => {
  const nav = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(phone, password);
    if (user) nav('/cabinet');
    else setError('Неверный телефон или пароль');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-primary px-4 text-primary-foreground">
      <div className="hero-grid absolute inset-0 opacity-40" />
      <div className="animate-fade-up relative w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon name="Landmark" size={20} />
          </div>
          <span className="font-display text-xl font-bold tracking-wide">ЗАЙМЫ ПЛЮС</span>
        </Link>

        <div className="rounded-2xl bg-background p-8 text-foreground shadow-2xl">
          <h1 className="font-display text-2xl font-bold text-primary">Вход в кабинет</h1>
          <p className="mt-1 text-sm text-muted-foreground">Войдите по номеру телефона и паролю</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Телефон</Label>
              <Input id="phone" type="tel" placeholder="+7 (___) ___-__-__" value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" placeholder="••••" value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }} required />
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-sm text-red-600">
                <Icon name="AlertCircle" size={15} /> {error}
              </p>
            )}
            <Button type="submit" size="lg" className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90">
              Войти <Icon name="LogIn" size={18} className="ml-1" />
            </Button>
          </form>

          <div className="mt-5 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
            <Icon name="Info" size={14} className="mr-1 inline text-accent" />
            Демо-доступ: <b>+79001234567</b> / пароль <b>1234</b>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Нет заявки? <Link to="/anketa" className="font-medium text-accent hover:underline">Оформить займ</Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-primary-foreground/50">
          <Link to="/admin" className="hover:text-primary-foreground/80">Вход для администратора →</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
