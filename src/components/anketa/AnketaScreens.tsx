import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';

export const MaintenanceScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
    <div className="animate-fade-up w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-xl sm:p-10">
      <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100">
        <Icon name="Construction" size={36} className="text-yellow-600" />
      </div>
      <h1 className="font-display text-2xl font-bold leading-snug text-primary">
        Приём заявок временно приостановлен
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        На сайте проводятся технические работы. Пожалуйста, попробуйте оформить заявку немного позже.
      </p>
      <Button asChild size="lg" variant="secondary" className="mt-7 w-full rounded-xl font-semibold">
        <Link to="/">На главную</Link>
      </Button>
    </div>
  </div>
);

export const SuccessScreen = ({ nav }: { nav: (path: string) => void }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <div className="animate-fade-up w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-xl sm:p-10">
        <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
          <Icon name="Loader2" size={36} className="animate-spin text-blue-600" />
        </div>

        <h1 className="font-display text-2xl font-bold leading-snug text-primary">
          Ваша заявка на проверке
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Мы проверяем ваши документы. Это может занять некоторое время.
        </p>
        <p className="mt-3 text-sm text-muted-foreground/70">
          Страница обновляется автоматически. Вы также получите SMS-уведомление.
        </p>

        <Button asChild size="lg" variant="secondary" className="mt-7 w-full rounded-xl font-semibold">
          <Link to="/cabinet">Личный кабинет</Link>
        </Button>
        <button onClick={() => nav('/')} className="mt-3 block w-full text-center text-sm text-muted-foreground hover:text-primary">
          На главную
        </button>
      </div>
    </div>
  );
};

export const CheckingScreen = ({ seconds }: { seconds: number }) => (
  <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
    <div className="animate-fade-up w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-xl sm:p-10">
      <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
        <Icon name="Loader2" size={36} className="animate-spin text-blue-600" />
      </div>
      <h1 className="font-display text-2xl font-bold leading-snug text-primary">Идёт проверка данных</h1>
      <p className="mt-3 text-base text-muted-foreground">Пожалуйста, подождите, мы проверяем введённую информацию.</p>
      <p className="mt-4 font-display text-3xl font-bold text-accent">{seconds} сек.</p>
    </div>
  </div>
);

interface EmailConfirmScreenProps {
  email: string;
  apiError: string;
  emailCode: string;
  setEmailCode: (v: string) => void;
  loading: boolean;
  codeVerifying: boolean;
  incomeUploading: boolean;
  codeSending: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: (e: React.FormEvent) => void;
}

export const EmailConfirmScreen = ({
  email, apiError, emailCode, setEmailCode, loading, codeVerifying, incomeUploading, codeSending,
  onBack, onSubmit, onResend,
}: EmailConfirmScreenProps) => (
  <div className="min-h-screen bg-secondary/40">
    <header className="border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <Logo variant="compact" />
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <Icon name="ArrowLeft" size={16} /> Назад
        </button>
      </div>
    </header>
    <main className="container max-w-md px-4 py-14">
      <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Icon name="Mail" size={28} className="text-blue-600" />
        </div>
        <h1 className="font-display mb-2 text-center text-2xl font-bold text-primary">Подтвердите email</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Мы отправили код подтверждения на <span className="font-semibold text-primary">{email}</span>
        </p>

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <p className="flex items-center gap-2"><Icon name="AlertCircle" size={16} className="shrink-0" /> {apiError}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="emailCode">Код из письма</Label>
            <Input id="emailCode" inputMode="numeric" maxLength={6} placeholder="6-значный код"
              value={emailCode} onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
              className="text-center font-mono text-lg tracking-widest" required />
          </div>
          <Button type="submit" size="lg" disabled={loading || codeVerifying || !emailCode}
            className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
            {loading || codeVerifying ? (
              <span className="flex items-center gap-2">
                <Icon name="Loader2" size={18} className="animate-spin" />
                {codeVerifying ? 'Проверяем код...' : incomeUploading ? 'Загружаем справку...' : 'Отправляем заявку...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">Подтвердить и отправить заявку <Icon name="Send" size={18} /></span>
            )}
          </Button>
          <button
            type="button"
            onClick={onResend}
            disabled={codeSending}
            className="block w-full text-center text-sm text-muted-foreground hover:text-primary">
            {codeSending ? 'Отправляем...' : 'Отправить код повторно'}
          </button>
        </form>
      </div>
    </main>
  </div>
);
