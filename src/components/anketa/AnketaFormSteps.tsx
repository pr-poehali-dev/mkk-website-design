import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import AnketaField from '@/components/anketa/AnketaField';
import { formatPhone } from '@/lib/phone';

export type PersonalForm = {
  lastname: string; firstname: string; middlename: string; phone: string; password: string; birth_date: string; email: string;
};
export type PassportForm = { series: string; issued: string; issued_date: string };

const NextButton = ({ onClick }: { onClick: () => void }) => (
  <Button size="lg" className="mt-2 h-12 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
    onClick={onClick}>
    Далее <Icon name="ArrowRight" size={18} className="ml-1" />
  </Button>
);

const formatPassport = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  return d.length > 4 ? `${d.slice(0, 4)} ${d.slice(4)}` : d;
};

const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

interface PersonalStepProps {
  f1: PersonalForm;
  setF1: (v: PersonalForm) => void;
  setApiError: (v: string) => void;
  nextWithCheck: () => void;
}

export const PersonalStep = ({ f1, setF1, setApiError, nextWithCheck }: PersonalStepProps) => {
  const upd1 = (k: keyof typeof f1) => (e: React.ChangeEvent<HTMLInputElement>) => setF1({ ...f1, [k]: e.target.value });

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setF1({ ...f1, phone: formatPhone(e.target.value) });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <AnketaField id="lastname" label="Фамилия *" icon="User" placeholder="Иванов" autoComplete="family-name"
          value={f1.lastname} onChange={upd1('lastname')} required />
        <AnketaField id="firstname" label="Имя *" icon="User" placeholder="Иван" autoComplete="given-name"
          value={f1.firstname} onChange={upd1('firstname')} required />
      </div>
      <AnketaField id="middlename" label="Отчество" icon="User" placeholder="Иванович" autoComplete="additional-name"
        value={f1.middlename} onChange={upd1('middlename')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <AnketaField id="birth_date" label="Дата рождения *" icon="CalendarDays" type="date" autoComplete="bday"
          value={f1.birth_date} onChange={upd1('birth_date')} required />
        <AnketaField id="phone" label="Телефон *" icon="Phone" type="tel" inputMode="tel" placeholder="+7 (___) ___-__-__" autoComplete="tel"
          value={f1.phone} onChange={handlePhone}
          onFocus={() => { if (!f1.phone) setF1({ ...f1, phone: '+7 ' }); }} required />
      </div>
      <AnketaField id="email" label="Электронная почта *" icon="Mail" type="email" inputMode="email" placeholder="example@mail.ru" autoComplete="email"
        value={f1.email} onChange={upd1('email')}
        error={f1.email && !isEmailValid(f1.email) ? 'Проверьте адрес почты' : undefined}
        hint="На этот адрес придёт код подтверждения заявки и подписи договора" required />
      <AnketaField id="password" label="Придумайте пароль *" icon="Lock" type="password" placeholder="для входа в личный кабинет" autoComplete="new-password"
        value={f1.password} onChange={upd1('password')} required />
      <NextButton onClick={() => { if (f1.lastname && f1.firstname && f1.birth_date && f1.phone && f1.email && f1.password) nextWithCheck(); else setApiError('Заполните все обязательные поля'); }} />
    </div>
  );
};

interface PassportStepProps {
  f2: PassportForm;
  setF2: (v: PassportForm) => void;
  setApiError: (v: string) => void;
  next: () => void;
}

export const PassportStep = ({ f2, setF2, setApiError, next }: PassportStepProps) => {
  const upd2 = (k: keyof typeof f2) => (e: React.ChangeEvent<HTMLInputElement>) => setF2({ ...f2, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <AnketaField id="series" label="Серия и номер *" icon="BookUser" inputMode="numeric" placeholder="0000 000000"
          value={f2.series} onChange={(e) => setF2({ ...f2, series: formatPassport(e.target.value) })} required />
        <AnketaField id="issued_date" label="Дата выдачи" icon="CalendarDays" type="date"
          value={f2.issued_date} onChange={upd2('issued_date')} />
      </div>
      <AnketaField id="issued" label="Кем выдан *" icon="Building2" placeholder="ОВД района..."
        value={f2.issued} onChange={upd2('issued')} required />

      <NextButton onClick={() => { if (f2.series && f2.issued) next(); else setApiError('Заполните серию/номер и кем выдан'); }} />
    </div>
  );
};

const AMOUNT_PRESETS = [5000, 10000, 15000, 30000, 50000, 100000];
const DAYS_PRESETS = [7, 14, 30, 60, 90];

const PresetButtons = ({ values, current, onPick, format }: {
  values: number[]; current: number; onPick: (v: number) => void; format: (v: number) => string;
}) => (
  <div className="flex flex-wrap gap-2">
    {values.map((v) => (
      <button key={v} type="button" onClick={() => onPick(v)}
        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
          current === v
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-primary hover:bg-secondary'
        }`}>
        {format(v)}
      </button>
    ))}
  </div>
);

interface LoanStepProps {
  amount: number;
  setAmount: (v: number) => void;
  days: number;
  setDays: (v: number) => void;
  existingLoansCount: string;
  setExistingLoansCount: (v: string) => void;
  existingDebtAmount: string;
  setExistingDebtAmount: (v: string) => void;
  setApiError: (v: string) => void;
  next: () => void;
}

export const LoanStep = ({
  amount, setAmount, days, setDays,
  existingLoansCount, setExistingLoansCount, existingDebtAmount, setExistingDebtAmount,
  setApiError, next,
}: LoanStepProps) => {
  const fmt = (n: number) => n.toLocaleString('ru-RU');

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-primary">Сумма займа</Label>
          <span className="font-display text-2xl font-bold text-primary">{fmt(amount)} ₽</span>
        </div>
        <input type="range" min={3000} max={100000} step={1000} value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-accent" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3 000 ₽</span><span>100 000 ₽</span>
        </div>
        <PresetButtons values={AMOUNT_PRESETS} current={amount} onPick={setAmount} format={(v) => `${fmt(v)} ₽`} />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-primary">Срок займа</Label>
          <span className="font-display text-2xl font-bold text-primary">{days} дней</span>
        </div>
        <input type="range" min={7} max={90} step={1} value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full accent-accent" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>7 дней</span><span>90 дней</span>
        </div>
        <PresetButtons values={DAYS_PRESETS} current={days} onPick={setDays} format={(v) => `${v} дн.`} />
      </div>

      <div className="rounded-xl border border-border bg-secondary p-4 text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-muted-foreground">Сумма займа</span><span className="font-semibold">{fmt(amount)} ₽</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Переплата (0.8%/день)</span><span className="font-semibold">{fmt(Math.round(amount * 0.008 * days))} ₽</span></div>
        <div className="flex justify-between border-t border-border pt-1.5"><span className="font-semibold text-primary">К возврату</span><span className="font-bold text-primary">{fmt(amount + Math.round(amount * 0.008 * days))} ₽</span></div>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-border bg-background p-4">
        <legend className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon name="CreditCard" size={15} className="text-primary" /> Текущая долговая нагрузка
        </legend>
        <AnketaField id="existing_loans_count" label="Количество открытых займов/кредитов *" icon="Hash" type="number" min={0} max={50} inputMode="numeric"
          value={existingLoansCount} placeholder="0" required
          onChange={(e) => setExistingLoansCount(e.target.value.replace(/[^0-9]/g, ''))} />
        <AnketaField id="existing_debt_amount" label="Общая сумма долга по ним (₽) *" icon="Wallet" type="number" min={0} step={1000} inputMode="numeric"
          value={existingDebtAmount} placeholder="0" required
          onChange={(e) => setExistingDebtAmount(e.target.value.replace(/[^0-9]/g, ''))} />
        <p className="text-xs text-muted-foreground">Укажите честно — это влияет на решение по заявке.</p>
      </fieldset>

      <Button size="lg" className="h-12 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        onClick={() => { if (existingLoansCount !== '' && existingDebtAmount !== '') next(); else setApiError('Заполните информацию о текущей долговой нагрузке'); }}>
        Далее <Icon name="ArrowRight" size={18} className="ml-1" />
      </Button>
    </div>
  );
};
