import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import { apiRegister, apiUploadFile, apiSendVerificationCode, apiVerifyCode, apiLogin, saveSession } from '@/lib/api';
import { useMaintenance } from '@/lib/maintenanceContext';
import { MaintenanceScreen, SuccessScreen, CheckingScreen, EmailConfirmScreen } from '@/components/anketa/AnketaScreens';
import AnketaProgress, { STEPS } from '@/components/anketa/AnketaProgress';
import { PersonalStep, PassportStep, LoanStep } from '@/components/anketa/AnketaFormSteps';
import { PhotosStep, AddressStep } from '@/components/anketa/AnketaDocsSteps';
import AnketaTrust from '@/components/anketa/AnketaTrust';

const Anketa = () => {
  const { maintenance } = useMaintenance();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [transitionSeconds, setTransitionSeconds] = useState(0);

  // Step 1
  const [f1, setF1] = useState({ lastname: '', firstname: '', middlename: '', phone: '', password: '', birth_date: '', email: '' });
  // Step 2
  const [f2, setF2] = useState({ series: '', issued: '', issued_date: '' });
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportChecking, setPassportChecking] = useState(false);
  const [passportChecked, setPassportChecked] = useState(false);
  const [passportSecondsLeft, setPassportSecondsLeft] = useState(0);
  // Step 3: селфи с кодом на бумаге
  const [selfieCode] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfieChecking, setSelfieChecking] = useState(false);
  const [selfieChecked, setSelfieChecked] = useState(false);
  const [selfieSecondsLeft, setSelfieSecondsLeft] = useState(0);
  // Step 4
  const [amount, setAmount] = useState(15000);
  const [days, setDays] = useState(14);
  const [existingLoansCount, setExistingLoansCount] = useState('');
  const [existingDebtAmount, setExistingDebtAmount] = useState('');
  // Step 5
  const [f4, setF4] = useState({ address_residence: '', address_registration: '', work_place: '', work_phone: '' });
  const [incomeFile, setIncomeFile] = useState<File | null>(null);
  const [incomePreview, setIncomePreview] = useState<string | null>(null);
  const [incomeUploading, setIncomeUploading] = useState(false);
  const [incomeChecking, setIncomeChecking] = useState(false);
  const [incomeChecked, setIncomeChecked] = useState(false);
  const [incomeSecondsLeft, setIncomeSecondsLeft] = useState(0);
  // Step 6: подтверждение email
  const [emailCode, setEmailCode] = useState('');
  const [codeSending, setCodeSending] = useState(false);
  const [codeVerifying, setCodeVerifying] = useState(false);

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

  const handleSelfiePhoto = (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setApiError(`Фото слишком большое. Максимум ${MAX_FILE_MB} МБ.`);
      return;
    }
    setApiError('');
    setSelfieFile(file);
    setSelfiePhoto(URL.createObjectURL(file));
    runFileCheck(setSelfieChecking, setSelfieChecked, setSelfieSecondsLeft);
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

  const CHECK_TRANSITION_SECONDS = 10;

  const next = () => { setApiError(''); setStep((s) => s + 1); };

  const nextWithCheck = () => {
    setApiError('');
    setTransitioning(true);
    setTransitionSeconds(CHECK_TRANSITION_SECONDS);
    const timer = setInterval(() => {
      setTransitionSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setTransitioning(false);
          setStep((st) => st + 1);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };
  const prev = () => { setApiError(''); setStep((s) => s - 1); };

  const handleSendEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setCodeSending(true);
    try {
      await apiSendVerificationCode(f1.email, 'register');
      setStep(6);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Не удалось отправить код на почту');
    } finally {
      setCodeSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');
    try {
      if (!emailCode) { setApiError('Введите код из письма'); setLoading(false); return; }
      setCodeVerifying(true);
      await apiVerifyCode(f1.email, 'register', emailCode);
      setCodeVerifying(false);

      let income_doc_url: string | undefined;
      let passport_photo_url: string | undefined;
      let selfie_photo_url: string | undefined;
      if (passportFile) {
        passport_photo_url = await apiUploadFile(passportFile);
      }
      if (selfieFile) {
        selfie_photo_url = await apiUploadFile(selfieFile);
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
        email: f1.email,
        passport_photo_url,
        selfie_photo_url,
        existing_loans_count: Number(existingLoansCount),
        existing_debt_amount: Number(existingDebtAmount),
      });

      try {
        const session = await apiLogin(f1.phone, f1.password);
        saveSession(session);
      } catch {
        // не критично — пользователь сможет войти вручную
      }

      setStep(7);
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
      setCodeVerifying(false);
    }
  };

  if (maintenance) {
    return <MaintenanceScreen />;
  }

  if (transitioning) {
    return <CheckingScreen seconds={transitionSeconds} />;
  }

  if (step === 7) {
    return <SuccessScreen nav={nav} />;
  }

  if (step === 6) {
    return (
      <EmailConfirmScreen
        email={f1.email}
        apiError={apiError}
        emailCode={emailCode}
        setEmailCode={setEmailCode}
        loading={loading}
        codeVerifying={codeVerifying}
        incomeUploading={incomeUploading}
        codeSending={codeSending}
        onBack={() => setStep(5)}
        onSubmit={handleSubmit}
        onResend={handleSendEmailCode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <Logo variant="compact" />
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

      <main className="container max-w-5xl px-4 py-10 md:py-14">
        <AnketaProgress step={step} />

        <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
        <div className="animate-fade-up rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
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
            <PersonalStep f1={f1} setF1={setF1} setApiError={setApiError} nextWithCheck={nextWithCheck} />
          )}

          {/* ШАГ 2: Паспорт */}
          {step === 2 && (
            <PassportStep f2={f2} setF2={setF2} setApiError={setApiError} next={next} />
          )}

          {/* ШАГ 3: Параметры займа */}
          {step === 3 && (
            <LoanStep
              amount={amount}
              setAmount={setAmount}
              days={days}
              setDays={setDays}
              existingLoansCount={existingLoansCount}
              setExistingLoansCount={setExistingLoansCount}
              existingDebtAmount={existingDebtAmount}
              setExistingDebtAmount={setExistingDebtAmount}
              setApiError={setApiError}
              next={next}
            />
          )}

          {/* ШАГ 4: Фото документов */}
          {step === 4 && (
            <PhotosStep
              checkSeconds={CHECK_SECONDS}
              selfieCode={selfieCode}
              passportPhoto={passportPhoto}
              passportFile={passportFile}
              passportChecking={passportChecking}
              passportChecked={passportChecked}
              passportSecondsLeft={passportSecondsLeft}
              onPassportPhoto={handlePassportPhoto}
              selfiePhoto={selfiePhoto}
              selfieFile={selfieFile}
              selfieChecking={selfieChecking}
              selfieChecked={selfieChecked}
              selfieSecondsLeft={selfieSecondsLeft}
              onSelfiePhoto={handleSelfiePhoto}
              incomePreview={incomePreview}
              incomeFile={incomeFile}
              incomeChecking={incomeChecking}
              incomeChecked={incomeChecked}
              incomeSecondsLeft={incomeSecondsLeft}
              onIncomeFile={handleIncomeFile}
              setApiError={setApiError}
              next={next}
            />
          )}

          {/* ШАГ 5: Адрес и работа */}
          {step === 5 && (
            <AddressStep f4={f4} setF4={setF4} codeSending={codeSending} onSubmit={handleSendEmailCode} />
          )}
        </div>
        <AnketaTrust />
        </div>
      </main>
    </div>
  );
};

export default Anketa;
