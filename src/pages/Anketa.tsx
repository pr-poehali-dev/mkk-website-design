import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import CameraCapture from '@/components/anketa/CameraCapture';
import { apiRegister, apiUploadFile } from '@/lib/api';
import { formatPhone } from '@/lib/phone';

const SuccessScreen = ({ nav }: { nav: (path: string) => void }) => {
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
          <Link to="/login">Личный кабинет</Link>
        </Button>
        <button onClick={() => nav('/')} className="mt-3 block w-full text-center text-sm text-muted-foreground hover:text-primary">
          На главную
        </button>
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
  const [passportChecking, setPassportChecking] = useState(false);
  const [passportChecked, setPassportChecked] = useState(false);
  const [passportSecondsLeft, setPassportSecondsLeft] = useState(0);
  // Step 3
  const [amount, setAmount] = useState(15000);
  const [days, setDays] = useState(14);
  // Step 4
  const [f4, setF4] = useState({ address_residence: '', address_registration: '', work_place: '', work_phone: '' });
  const [incomeFile, setIncomeFile] = useState<File | null>(null);
  const [incomePreview, setIncomePreview] = useState<string | null>(null);
  const [incomeUploading, setIncomeUploading] = useState(false);
  const [incomeChecking, setIncomeChecking] = useState(false);
  const [incomeChecked, setIncomeChecked] = useState(false);
  const [incomeSecondsLeft, setIncomeSecondsLeft] = useState(0);

  const CHECK_SECONDS = 40;

  const runFileCheck = (
    setChecking: (v: boolean) => void,
    setChecked: (v: boolean) => void,
    setSecondsLeft: (v: number | ((s: number) => number)) => void,
  ) => {
    setChecked(false);
    setChecking(true);
    setSecondsLeft(CHECK_SECONDS);
    const timer = setInterval(() => {
      setSecondsLeft((s: number) => {
        if (s <= 1) {
          clearInterval(timer);
          setChecking(false);
          setChecked(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const upd1 = (k: keyof typeof f1) => (e: React.ChangeEvent<HTMLInputElement>) => setF1({ ...f1, [k]: e.target.value });

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setF1({ ...f1, phone: formatPhone(e.target.value) });

  const handleWorkPhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setF4({ ...f4, work_phone: formatPhone(e.target.value) });
  const upd2 = (k: keyof typeof f2) => (e: React.ChangeEvent<HTMLInputElement>) => setF2({ ...f2, [k]: e.target.value });
  const upd4 = (k: keyof typeof f4) => (e: React.ChangeEvent<HTMLInputElement>) => setF4({ ...f4, [k]: e.target.value });

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const MAX_FILE_MB = 5;
  const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

  const handlePassportPhoto = (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setApiError(`Фото паспорта слишком большое. Максимум ${MAX_FILE_MB} МБ.`);
      return;
    }
    setApiError('');
    setPassportFile(file);
    setPassportPhoto(URL.createObjectURL(file));
    runFileCheck(setPassportChecking, setPassportChecked, setPassportSecondsLeft);
  };

  const handleIncomeFile = (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setApiError(`Файл справки слишком большой. Максимум ${MAX_FILE_MB} МБ.`);
      return;
    }
    setApiError('');
    setIncomeFile(file);
    setIncomePreview(URL.createObjectURL(file));
    runFileCheck(setIncomeChecking, setIncomeChecked, setIncomeSecondsLeft);
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
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('уже зарегистрирован')) {
        setApiError('Этот номер телефона уже зарегистрирован. Войдите в личный кабинет или используйте другой номер.');
      } else if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed')) {
        setApiError('Ошибка соединения с сервером. Проверьте интернет и попробуйте ещё раз.');
      } else if (msg.includes('загрузки файла')) {
        setApiError('Не удалось загрузить файл. Попробуйте уменьшить размер или выбрать другой файл.');
      } else {
        setApiError(msg || 'Не удалось отправить заявку. Попробуйте ещё раз.');
      }
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
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <p className="flex items-center gap-2">
                <Icon name="AlertCircle" size={16} className="shrink-0" /> {apiError}
              </p>
              {apiError.includes('уже зарегистрирован') && (
                <Link to="/login" className="mt-2 inline-flex items-center gap-1.5 font-medium text-red-700 hover:underline">
                  Войти в личный кабинет <Icon name="ArrowRight" size={14} />
                </Link>
              )}
            </div>
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
                <CameraCapture
                  label="Фото паспорта (разворот с фото)"
                  hint="Наведите камеру на разворот с фотографией"
                  preview={passportPhoto}
                  onCapture={handlePassportPhoto}
                />

                {passportChecking && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5">
                    <Icon name="Loader2" size={16} className="shrink-0 animate-spin text-blue-600" />
                    <p className="text-sm text-blue-700">Идёт проверка фото... {passportSecondsLeft} сек.</p>
                  </div>
                )}
                {passportChecked && !passportChecking && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5">
                    <Icon name="CheckCircle2" size={16} className="shrink-0 text-green-600" />
                    <p className="text-sm font-medium text-green-700">Фото успешно загружено</p>
                  </div>
                )}
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
                <CameraCapture
                  label="Фото справки о доходах"
                  hint="Необязательно · сфотографируйте документ"
                  preview={incomePreview}
                  onCapture={handleIncomeFile}
                />

                {incomeChecking && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5">
                    <Icon name="Loader2" size={16} className="shrink-0 animate-spin text-blue-600" />
                    <p className="text-sm text-blue-700">Идёт проверка файла... {incomeSecondsLeft} сек.</p>
                  </div>
                )}
                {incomeChecked && !incomeChecking && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5">
                    <Icon name="CheckCircle2" size={16} className="shrink-0 text-green-600" />
                    <p className="text-sm font-medium text-green-700">Файл успешно загружен</p>
                  </div>
                )}
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