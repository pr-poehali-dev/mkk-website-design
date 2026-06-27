import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { apiRegister, apiUploadFile } from '@/lib/api';
import { formatPhone } from '@/lib/phone';

const TOTAL_SECONDS = 5 * 60; // 5 минут

const SuccessScreen = ({ nav }: { nav: (path: string) => void }) => {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / TOTAL_SECONDS;
  const dashOffset = circumference * (1 - progress);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-primary px-4 text-primary-foreground">
      <div className="hero-grid absolute inset-0 opacity-40" />
      <div className="animate-fade-up relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl">
        {/* Тёмный блок с таймером */}
        <div className="flex flex-col items-center bg-[#0d1117] px-8 pb-10 pt-10 text-center"
          style={{ background: 'linear-gradient(160deg, #0d1a2e 0%, #0a0f1a 100%)' }}>
          {/* Круговой таймер */}
          <div className="relative mb-8 flex h-36 w-36 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
              {/* Фоновый круг */}
              <circle cx="72" cy="72" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
              {/* Прогресс */}
              <circle
                cx="72" cy="72" r={radius}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="font-display relative text-3xl font-bold tabular-nums text-white">
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold leading-snug text-white">
            Проверяем данные,<br />не закрывайте страницу
          </h1>
          <p className="mt-3 text-sm text-white/50"></p>
        </div>

        {/* Светлый блок с кнопками */}
        <div className="bg-background px-8 pb-8 pt-6">
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Анкета принята! Решение придёт на указанный телефон.
          </p>
          <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/login">Войти в личный кабинет <Icon name="ArrowRight" size={18} className="ml-1" /></Link>
          </Button>
          <button onClick={() => nav('/')} className="mt-3 block w-full text-center text-sm text-muted-foreground hover:text-primary">
            На главную
          </button>
        </div>
      </div>
    </div>
  );
};

const STEPS = [
  { n: 1, title: 'Личные данные', icon: 'User' },
  { n: 2, title: 'Паспорт', icon: 'BookUser' },
  { n: 3, title: 'Параметры займа', icon: 'Wallet' },
  { n: 4, title: 'Адрес и работа', icon: 'Briefcase' },
];

const Anketa = () => {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Step 1
  const [f1, setF1] = useState({ lastname: '', firstname: '', middlename: '', phone: '', password: '', birth_date: '', email: '' });
  // Step 2
  const [f2, setF2] = useState({ series: '', issued: '', issued_date: '' });
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  // Step 3
  const [amount, setAmount] = useState(15000);
  const [days, setDays] = useState(14);
  // Step 4
  const [f4, setF4] = useState({ address_residence: '', address_registration: '', work_place: '', work_phone: '' });
  const [incomeFile, setIncomeFile] = useState<File | null>(null);
  const [incomePreview, setIncomePreview] = useState<string | null>(null);
  const [incomeUploading, setIncomeUploading] = useState(false);

  const upd1 = (k: keyof typeof f1) => (e: React.ChangeEvent<HTMLInputElement>) => setF1({ ...f1, [k]: e.target.value });

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setF1({ ...f1, phone: formatPhone(e.target.value) });

  const handleWorkPhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setF4({ ...f4, work_phone: formatPhone(e.target.value) });
  const upd2 = (k: keyof typeof f2) => (e: React.ChangeEvent<HTMLInputElement>) => setF2({ ...f2, [k]: e.target.value });
  const upd4 = (k: keyof typeof f4) => (e: React.ChangeEvent<HTMLInputElement>) => setF4({ ...f4, [k]: e.target.value });

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const handlePassportPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportFile(file);
      setPassportPhoto(URL.createObjectURL(file));
    }
  };

  const handleIncomeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIncomeFile(file);
      setIncomePreview(URL.createObjectURL(file));
    }
  };

  const next = () => { setApiError(''); setStep((s) => s + 1); };
  const prev = () => { setApiError(''); setStep((s) => s - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');
    try {
      let income_doc_url: string | undefined;
      let passport_photo_url: string | undefined;
      if (passportFile) {
        passport_photo_url = await apiUploadFile(passportFile);
      }
      if (incomeFile) {
        setIncomeUploading(true);
        income_doc_url = await apiUploadFile(incomeFile);
        setIncomeUploading(false);
      }

      await apiRegister({
        full_name: `${f1.lastname} ${f1.firstname}${f1.middlename ? ' ' + f1.middlename : ''}`.trim(),
        phone: f1.phone,
        password: f1.password,
        birth_date: f1.birth_date || undefined,
        amount,
        days,
        passport: f2.series || undefined,
        passport_by: f2.issued || undefined,
        address_residence: f4.address_residence || undefined,
        address_registration: f4.address_registration || undefined,
        work_place: f4.work_place || undefined,
        work_phone: f4.work_phone || undefined,
        income_doc_url,
        email: f1.email || undefined,
        passport_photo_url,
      });
      setStep(5);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setLoading(false);
      setIncomeUploading(false);
    }
  };

  if (step === 5) {
    return <SuccessScreen nav={nav} />;
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
          {step > 1 ? (
            <button onClick={prev} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
              <Icon name="ArrowLeft" size={16} /> Назад
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
              <Icon name="ArrowLeft" size={16} /> Назад
            </Link>
          )}
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-10 md:py-14">
        {/* Прогресс */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-2">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-1 flex-col items-center gap-1.5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  step > s.n ? 'bg-accent text-accent-foreground' :
                  step === s.n ? 'bg-primary text-primary-foreground' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {step > s.n
                    ? <Icon name="Check" size={18} />
                    : <Icon name={s.icon} size={18} />
                  }
                </div>
                <span className={`hidden text-center text-xs sm:block ${step === s.n ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">Шаг {step} из {STEPS.length} — {STEPS[step - 1].title}</p>
        </div>

        <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
          <h1 className="font-display mb-6 text-2xl font-bold text-primary">{STEPS[step - 1].title}</h1>

          {apiError && (
            <p className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <Icon name="AlertCircle" size={16} /> {apiError}
            </p>
          )}

          {/* ШАГ 1: Личные данные */}
          {step === 1 && (
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
                <Label htmlFor="email">Электронная почта</Label>
                <Input id="email" type="email" placeholder="example@mail.ru" value={f1.email} onChange={upd1('email')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Придумайте пароль *</Label>
                <Input id="password" type="password" placeholder="для входа в личный кабинет" value={f1.password} onChange={upd1('password')} required />
              </div>
              <Button size="lg" className="mt-2 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
                onClick={() => { if (f1.lastname && f1.firstname && f1.birth_date && f1.phone && f1.password) next(); else setApiError('Заполните все обязательные поля'); }}>
                Далее <Icon name="ArrowRight" size={18} className="ml-1" />
              </Button>
            </div>
          )}

          {/* ШАГ 2: Паспорт */}
          {step === 2 && (
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

              <div className="space-y-1.5">
                <Label>Фото паспорта (разворот с фото)</Label>
                <label htmlFor="passport-photo"
                  className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/50 p-8 text-center transition-colors hover:border-accent hover:bg-accent/5">
                  {passportPhoto ? (
                    <>
                      <img src={passportPhoto} alt="Паспорт" className="max-h-44 rounded-lg object-contain shadow-md" />
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
                <input id="passport-photo" type="file" accept="image/*" className="hidden" onChange={handlePassportPhoto} />
              </div>

              <Button size="lg" className="mt-2 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
                onClick={() => { if (f2.series && f2.issued) next(); else setApiError('Заполните серию/номер и кем выдан'); }}>
                Далее <Icon name="ArrowRight" size={18} className="ml-1" />
              </Button>
            </div>
          )}

          {/* ШАГ 3: Параметры займа */}
          {step === 3 && (
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

              <Button size="lg" className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90" onClick={next}>
                Далее <Icon name="ArrowRight" size={18} className="ml-1" />
              </Button>
            </div>
          )}

          {/* ШАГ 4: Адрес и работа */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <fieldset className="space-y-4">
                <legend className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon name="MapPin" size={15} className="text-accent" /> Адрес
                </legend>
                <div className="space-y-1.5">
                  <Label htmlFor="address_residence">Место проживания *</Label>
                  <Input id="address_residence" placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
                    value={f4.address_residence} onChange={upd4('address_residence')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address_registration">Адрес регистрации (прописки)</Label>
                  <Input id="address_registration" placeholder="Совпадает с местом проживания или укажите другой"
                    value={f4.address_registration} onChange={upd4('address_registration')} />
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon name="Briefcase" size={15} className="text-accent" /> Место работы
                </legend>
                <div className="space-y-1.5">
                  <Label htmlFor="work_place">Организация и должность *</Label>
                  <Input id="work_place" placeholder="ООО «Компания», менеджер"
                    value={f4.work_place} onChange={upd4('work_place')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="work_phone">Телефон работы</Label>
                  <Input id="work_phone" type="tel" placeholder="+7 (___) ___-__-__"
                    value={f4.work_phone} onChange={handleWorkPhone}
                    onFocus={() => { if (!f4.work_phone) setF4({ ...f4, work_phone: '+7 ' }); }} />
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon name="FileText" size={15} className="text-accent" /> Справка о доходах
                </legend>
                <label htmlFor="income-file"
                  className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/50 p-6 text-center transition-colors hover:border-accent hover:bg-accent/5">
                  {incomePreview ? (
                    <>
                      <img src={incomePreview} alt="Справка" className="max-h-36 rounded-lg object-contain shadow-md" />
                      <span className="flex items-center gap-1.5 text-sm font-medium text-accent">
                        <Icon name="RefreshCw" size={15} /> Заменить файл
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                        <Icon name="Upload" size={22} />
                      </div>
                      <div>
                        <p className="font-medium text-primary">Загрузить фото справки</p>
                        <p className="text-sm text-muted-foreground">JPG, PNG или PDF · до 10 МБ · необязательно</p>
                      </div>
                    </>
                  )}
                </label>
                <input id="income-file" type="file" accept="image/*,application/pdf" className="hidden" onChange={handleIncomeFile} />
              </fieldset>

              <div className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
                <Icon name="ShieldCheck" size={16} className="mr-1.5 inline text-accent" />
                Ваши данные передаются по защищённому соединению и не передаются третьим лицам.
              </div>

              <Button type="submit" size="lg" disabled={loading}
                className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
                {loading || incomeUploading ? (
                  <span className="flex items-center gap-2">
                    <Icon name="Loader2" size={18} className="animate-spin" />
                    {incomeUploading ? 'Загружаем справку...' : 'Отправляем заявку...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Отправить заявку <Icon name="Send" size={18} /></span>
                )}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Anketa;