import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { apiLogin, saveSession } from '@/lib/api';
import { useMaintenance } from '@/lib/maintenanceContext';

const Login = () => {
  const maintenance = useMaintenance();
  const nav = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await apiLogin(phone, password);
      saveSession(user);
      nav('/cabinet');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
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
            <Button type="submit" size="lg" disabled={loading}
              className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2"><Icon name="Loader2" size={18} className="animate-spin" /> Входим...</span>
              ) : (
                <span className="flex items-center gap-2">Войти <Icon name="LogIn" size={18} /></span>
              )}
            </Button>
          </form>

          {!maintenance && (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Нет заявки? <Link to="/anketa" className="font-medium text-accent hover:underline">Оформить займ</Link>
            </p>
          )}
        </div>


      </div>
    </div>
  );
};

export default Login;