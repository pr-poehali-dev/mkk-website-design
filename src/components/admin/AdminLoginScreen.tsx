import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

const ADMIN_PASS = 'admin';

interface Props {
  onAuth: () => void;
}

const AdminLoginScreen = ({ onAuth }: Props) => {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

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
          if (pass === ADMIN_PASS) { sessionStorage.setItem('zaimy_admin', '1'); onAuth(); }
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
};

export default AdminLoginScreen;
