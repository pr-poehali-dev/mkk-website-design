import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { formatPhone } from '@/lib/phone';

export type PersonalForm = {
  lastname: string; firstname: string; middlename: string; phone: string; password: string; birth_date: string; email: string;
};
export type PassportForm = { series: string; issued: string; issued_date: string };

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
        <div className="space-y-1.5">
          <Label htmlFor="lastname">Фамилия *</Label>
          <Input id="lastname" placeholder="Иванов" value={f1.lastname} onChange={upd1('lastname')} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="firstname">Имя *</Label>
          <Input id="firstname" placeholder="Иван" value={f1.firstname} onChange={upd1('firstname')} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="middlename">Отчество</Label>
        <Input id="middlename" placeholder="Иванович" value={f1.middlename} onChange={upd1('middlename')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="birth_date">Дата рождения *</Label>
          <Input id="birth_date" type="date" value={f1.birth_date} onChange={upd1('birth_date')} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Телефон *</Label>
          <Input id="phone" type="tel" placeholder="+7 (___) ___-__-__" value={f1.phone} onChange={handlePhone} onFocus={() => { if (!f1.phone) setF1({ ...f1, phone: '+7 ' }); }} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Электронная почта *</Label>
        <Input id="email" type="email" placeholder="example@mail.ru" value={f1.email} onChange={upd1('email')} required />
        <p className="text-xs text-muted-foreground">На этот адрес придёт код подтверждения заявки и подписи договора</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Придумайте пароль *</Label>
        <Input id="password" type="password" placeholder="для входа в личный кабинет" value={f1.password} onChange={upd1('password')} required />
      </div>
      <Button size="lg" className="mt-2 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
        onClick={() => { if (f1.lastname && f1.firstname && f1.birth_date && f1.phone && f1.email && f1.password) nextWithCheck(); else setApiError('Заполните все обязательные поля'); }}>
        Далее <Icon name="ArrowRight" size={18} className="ml-1" />
      </Button>
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
        <div className="space-y-1.5">
          <Label htmlFor="series">Серия и номер *</Label>
          <Input id="series" placeholder="0000 000000" value={f2.series} onChange={upd2('series')} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="issued_date">Дата выдачи</Label>
          <Input id="issued_date" type="date" value={f2.issued_date} onChange={upd2('issued_date')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="issued">Кем выдан *</Label>
        <Input id="issued" placeholder="ОВД района..." value={f2.issued} onChange={upd2('issued')} required />
      </div>

      <Button size="lg" className="mt-2 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
        onClick={() => { if (f2.series && f2.issued) next(); else setApiError('Заполните серию/номер и кем выдан'); }}>
        Далее <Icon name="ArrowRight" size={18} className="ml-1" />
      </Button>
    </div>
  );
};

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Сумма займа</Label>
          <span className="font-display text-xl font-bold text-accent">{fmt(amount)} ₽</span>
        </div>
        <input type="range" min={3000} max={100000} step={1000} value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-accent" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3 000 ₽</span><span>100 000 ₽</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Срок займа</Label>
          <span className="font-display text-xl font-bold text-accent">{days} дней</span>
        </div>
        <input type="range" min={7} max={90} step={1} value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full accent-accent" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>7 дней</span><span>90 дней</span>
        </div>
      </div>

      <div className="rounded-xl bg-secondary p-4 text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-muted-foreground">Сумма займа</span><span className="font-semibold">{fmt(amount)} ₽</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Переплата (0.8%/день)</span><span className="font-semibold">{fmt(Math.round(amount * 0.008 * days))} ₽</span></div>
        <div className="flex justify-between border-t border-border pt-1.5"><span className="font-semibold text-primary">К возврату</span><span className="font-bold text-primary">{fmt(amount + Math.round(amount * 0.008 * days))} ₽</span></div>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-border p-4">
        <legend className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon name="CreditCard" size={15} className="text-accent" /> Текущая долговая нагрузка
        </legend>
        <div className="space-y-1.5">
          <Label htmlFor="existing_loans_count">Количество открытых займов/кредитов *</Label>
          <Input id="existing_loans_count" type="number" min={0} max={50} inputMode="numeric"
            value={existingLoansCount}
            placeholder="0"
            required
            onChange={(e) => setExistingLoansCount(e.target.value.replace(/[^0-9]/g, ''))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="existing_debt_amount">Общая сумма долга по ним (₽) *</Label>
          <Input id="existing_debt_amount" type="number" min={0} step={1000} inputMode="numeric"
            value={existingDebtAmount}
            placeholder="0"
            required
            onChange={(e) => setExistingDebtAmount(e.target.value.replace(/[^0-9]/g, ''))} />
        </div>
        <p className="text-xs text-muted-foreground">Укажите честно — это влияет на решение по заявке.</p>
      </fieldset>

      <Button size="lg" className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
        onClick={() => { if (existingLoansCount !== '' && existingDebtAmount !== '') next(); else setApiError('Заполните информацию о текущей долговой нагрузке'); }}>
        Далее <Icon name="ArrowRight" size={18} className="ml-1" />
      </Button>
    </div>
  );
};
