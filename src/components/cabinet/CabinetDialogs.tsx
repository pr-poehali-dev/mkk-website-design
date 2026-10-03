import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { apiUpdateRequest, apiGetRequest, apiChangePassword, apiUploadFile, apiUpdateClientDocs, apiUpdateClientEmail, apiSendVerificationCode, apiVerifyCode, apiGetHistory, apiClientListReceipts, saveSession, type UserSession, type LoanReceipt } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';
import { useMaintenance } from '@/lib/maintenanceContext';
import { buildContractHtml } from '@/components/admin/contractHtml';
import { getLoanRate, fmtRate } from '@/lib/loanRate';
import BankPicker from '@/components/BankPicker';
import CabinetDocPhotos from '@/components/cabinet/CabinetDocPhotos';
import BankLogo from '@/components/BankLogo';
import { normalizeBankName } from '@/lib/banks';
import {
  buildDebtClearanceCertificateHtml,
  buildPersonalDataConsentHtml,
  buildDataTransferConsentHtml,
} from '@/components/admin/documentTemplates';

const fmt = (n: number) => n.toLocaleString('ru-RU');

interface Props {
  user: UserSession;
  initials: string;
  contractCode: string;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  cardsOpen: boolean;
  setCardsOpen: (v: boolean) => void;
  profileOpen: boolean;
  setProfileOpen: (v: boolean) => void;
  docsOpen: boolean;
  setDocsOpen: (v: boolean) => void;
  selectedBank: string | null;
  setSelectedBank: (v: string | null) => void;
  bankSaved: boolean;
  setBankSaved: (v: boolean) => void;
  setUser: (u: UserSession) => void;
  onLogout: () => void;
}

const CabinetDialogs = ({
  user,
  initials,
  contractCode,
  menuOpen, setMenuOpen,
  cardsOpen, setCardsOpen,
  profileOpen, setProfileOpen,
  docsOpen, setDocsOpen,
  selectedBank, setSelectedBank,
  bankSaved, setBankSaved,
  setUser,
  onLogout,
}: Props) => {
  const { companyName, companyInn, companyOgrn } = useMaintenance();
  const returnDate = (() => {
    const d = new Date(user.created_at || Date.now());
    d.setDate(d.getDate() + user.days);
    return d.toLocaleDateString('ru-RU');
  })();

  const [allUserRequests, setAllUserRequests] = useState<UserSession[]>([user]);
  useEffect(() => {
    apiGetHistory(user.phone).then(setAllUserRequests).catch(() => setAllUserRequests([user]));
  }, [user.phone]);
  const loanRate = getLoanRate(user, allUserRequests);

  const overpay = Math.round(user.amount * loanRate * user.days);
  const total = user.amount + overpay;

  const downloadContract = () => {
    const sigCode = localStorage.getItem(`sig_code_${user.ref_number}`) || undefined;
    const html = buildContractHtml(user, user.amount, user.days, contractCode, returnDate, sigCode, companyName, companyInn, companyOgrn, loanRate);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Договор_${contractCode}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clientDocData = {
    full_name: user.full_name,
    passport: user.passport,
    passport_by: user.passport_by,
    address_registration: user.address_registration,
    address_residence: user.address_residence,
    ref_number: user.ref_number,
    amount: user.amount,
    created_at: user.created_at,
    status: user.status,
  };

  const downloadDoc = (build: (c: typeof clientDocData, companyName?: string, companyInn?: string, companyOgrn?: string) => string, fileName: string) => {
    const html = build(clientDocData, companyName, companyInn, companyOgrn);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<UserSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [receipts, setReceipts] = useState<LoanReceipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);

  useEffect(() => {
    if (docsOpen) {
      setReceiptsLoading(true);
      apiClientListReceipts(user.ref_number).then(setReceipts).catch(() => {}).finally(() => setReceiptsLoading(false));
    }
  }, [docsOpen, user.ref_number]);

  const RECEIPT_TYPE_META: Record<string, { label: string; icon: string; className: string }> = {
    money_sent: { label: 'Займ выдан', icon: 'BadgeCheck', className: 'bg-green-100 text-green-600' },
    repaid: { label: 'Займ погашен', icon: 'CircleDollarSign', className: 'bg-blue-100 text-blue-600' },
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setMenuOpen(false);
    setHistoryLoading(true);
    try {
      const items = await apiGetHistory(user.phone);
      setHistoryItems(items);
    } finally {
      setHistoryLoading(false);
    }
  };

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<'enter' | 'code'>('enter');
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  const openEmailDialog = () => {
    setNewEmail(user.email || '');
    setEmailCode('');
    setEmailStep('enter');
    setEmailError('');
    setEmailSuccess(false);
    setEmailOpen(true);
  };

  const handleSendEmailCode = async () => {
    setEmailError('');
    if (!newEmail || !newEmail.includes('@')) { setEmailError('Введите корректный email'); return; }
    setEmailSending(true);
    try {
      await apiSendVerificationCode(newEmail.trim().toLowerCase(), 'email_change');
      setEmailStep('code');
    } catch (e: unknown) {
      setEmailError(e instanceof Error ? e.message : 'Не удалось отправить код');
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    setEmailError('');
    if (!emailCode) { setEmailError('Введите код из письма'); return; }
    setEmailVerifying(true);
    try {
      const email = newEmail.trim().toLowerCase();
      await apiVerifyCode(email, 'email_change', emailCode);
      await apiUpdateClientEmail(user.ref_number, email);
      const fresh = await apiGetRequest(user.ref_number);
      saveSession(fresh);
      setUser(fresh);
      setEmailSuccess(true);
    } catch (e: unknown) {
      setEmailError(e instanceof Error ? e.message : 'Неверный код');
    } finally {
      setEmailVerifying(false);
    }
  };

  const [pwOpen, setPwOpen] = useState(false);
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwNew2, setPwNew2] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [docUploading, setDocUploading] = useState<string | null>(null);
  const [docSaved, setDocSaved] = useState<string | null>(null);

  const handleUploadDoc = async (file: File, field: 'passport_photo_url' | 'registration_photo_url' | 'income_doc_url' | 'selfie_photo_url' | 'card_photo_url' | 'snils_photo_url') => {
    setDocUploading(field);
    setDocSaved(null);
    try {
      const url = await apiUploadFile(file);
      await apiUpdateClientDocs({ ref_number: user.ref_number, [field]: url });
      const fresh = await apiGetRequest(user.ref_number);
      saveSession(fresh);
      setUser(fresh);
      setDocSaved(field);
    } finally {
      setDocUploading(null);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!pwOld || !pwNew || !pwNew2) { setPwError('Заполните все поля'); return; }
    if (pwNew !== pwNew2) { setPwError('Новые пароли не совпадают'); return; }
    if (pwNew.length < 4) { setPwError('Минимум 4 символа'); return; }
    setPwLoading(true);
    try {
      await apiChangePassword(user.phone, pwOld, pwNew);
      setPwSuccess(true);
      setPwOld(''); setPwNew(''); setPwNew2('');
    } catch (e: unknown) {
      setPwError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <>
      {/* Поп-ап меню */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-3xl border-0 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Меню</DialogTitle>
          </DialogHeader>

          <div className="relative overflow-hidden bg-primary px-6 pb-6 pt-8 text-primary-foreground">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/25 blur-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-accent-foreground shadow-lg">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold leading-tight">{user.full_name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/70">
                  <Icon name="Phone" size={13} /> {user.phone}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1 p-3">
            {[
              { icon: 'User', label: 'Мои данные', onClick: () => { setProfileOpen(true); setMenuOpen(false); } },
              { icon: 'CreditCard', label: 'Мои карты', hint: selectedBank, onClick: () => { setCardsOpen(true); setBankSaved(false); setMenuOpen(false); } },
              { icon: 'FolderOpen', label: 'Мои документы', onClick: () => { setDocsOpen(true); setMenuOpen(false); } },
              { icon: 'History', label: 'История займов', onClick: openHistory },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon name={item.icon} size={18} />
                </span>
                {item.label}
                {item.hint && <span className="ml-auto max-w-[110px] truncate text-xs text-muted-foreground">{item.hint}</span>}
                <Icon name="ChevronRight" size={16} className={`text-muted-foreground/60 ${item.hint ? '' : 'ml-auto'}`} />
              </button>
            ))}
            <Link
              to="/appeal"
              onClick={() => setMenuOpen(false)}
              className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Icon name="MessageCircleQuestion" size={18} />
              </span>
              Поддержка
              <Icon name="ChevronRight" size={16} className="ml-auto text-muted-foreground/60" />
            </Link>

            <div className="!my-2 border-t border-border" />

            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <Icon name="LogOut" size={18} />
              </span>
              Выйти из кабинета
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Поп-ап Мои карты */}
      <Dialog open={cardsOpen} onOpenChange={(o) => { setCardsOpen(o); if (!o) setBankSaved(false); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Мои карты</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Выберите банк для получения займа по СБП. Деньги придут на карту этого банка, привязанную к вашему номеру телефона.</p>
          {bankSaved ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
              <Icon name="CheckCircle2" size={28} className="mx-auto mb-2 text-green-600" />
              <p className="font-semibold text-green-700">Банк сохранён</p>
              <div className="mt-2 flex items-center justify-center gap-2"><BankLogo name={selectedBank} size={28} /><p className="text-sm text-green-600">{normalizeBankName(selectedBank)}</p></div>
            </div>
          ) : (
            <BankPicker selected={selectedBank} onSelect={setSelectedBank} />
          )}
          {!bankSaved && (
            <Button
              disabled={!selectedBank}
              className="mt-2 w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={async () => {
                if (!selectedBank) return;
                await apiUpdateRequest({ ref_number: user.ref_number, payment_bank: selectedBank });
                const fresh = await apiGetRequest(user.ref_number);
                saveSession(fresh);
                setUser(fresh);
                setBankSaved(true);
              }}>
              Сохранить выбор
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* Поп-ап Мои данные */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-3xl border-0 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Мои данные</DialogTitle>
          </DialogHeader>

          <div className="bg-primary px-6 pb-5 pt-7 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-accent-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-primary-foreground/60">Мои данные</p>
                <p className="truncate font-display text-lg font-bold leading-tight">{user.full_name}</p>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
            {[
              { icon: 'Phone', label: 'Телефон', value: user.phone },
              { icon: 'Cake', label: 'Дата рождения', value: user.birth_date ? user.birth_date.slice(0, 10).split('-').reverse().join('.') : '' },
              { icon: 'IdCard', label: 'Паспорт', value: user.passport },
              { icon: 'MapPin', label: 'Адрес', value: user.address_residence },
              { icon: 'Briefcase', label: 'Работа', value: user.work_place },
              { icon: 'FileText', label: 'Заявка', value: user.ref_number },
            ].filter((r) => r.value).map((r) => (
              <div key={r.label} className="flex items-start gap-3 border-b border-border/60 py-2.5 last:border-0">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon name={r.icon} size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.label}</p>
                  <p className="break-words text-sm font-semibold text-primary">{r.value}</p>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 py-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon name="Mail" size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="break-all text-sm font-semibold text-primary">{user.email || '—'}</p>
              </div>
              <button
                onClick={() => { setProfileOpen(false); openEmailDialog(); }}
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10"
                aria-label="Изменить email"
              >
                <Icon name="Pencil" size={14} />
              </button>
            </div>
          </div>

          <div className="border-t border-border p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setProfileOpen(false); setPwSuccess(false); setPwError(''); setPwOpen(true); }}
            >
              <Icon name="KeyRound" size={16} className="mr-2" />
              Сменить пароль
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Поп-ап Смена email */}
      <Dialog open={emailOpen} onOpenChange={(v) => { setEmailOpen(v); if (!v) { setEmailSuccess(false); setEmailError(''); } }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Смена email</DialogTitle>
          </DialogHeader>
          {emailSuccess ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Icon name="CheckCircle" size={32} />
              </div>
              <p className="text-center text-sm font-medium text-primary">Email успешно изменён</p>
              <Button className="mt-2 w-full" onClick={() => setEmailOpen(false)}>Закрыть</Button>
            </div>
          ) : emailStep === 'enter' ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Новый email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                  placeholder="example@mail.ru"
                />
              </div>
              {emailError && <p className="text-sm text-red-500">{emailError}</p>}
              <Button className="w-full" onClick={handleSendEmailCode} disabled={emailSending}>
                {emailSending ? 'Отправляем код...' : 'Отправить код подтверждения'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Мы отправили код подтверждения на <span className="font-semibold text-primary">{newEmail}</span>
              </p>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Код из письма</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={emailCode}
                  onChange={e => setEmailCode(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                  placeholder="6-значный код"
                />
              </div>
              {emailError && <p className="text-sm text-red-500">{emailError}</p>}
              <Button className="w-full" onClick={handleVerifyEmailCode} disabled={emailVerifying}>
                {emailVerifying ? 'Проверяем...' : 'Подтвердить'}
              </Button>
              <button
                onClick={() => { setEmailStep('enter'); setEmailError(''); }}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary"
              >
                Изменить email
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Поп-ап Смена пароля */}
      <Dialog open={pwOpen} onOpenChange={(v) => { setPwOpen(v); if (!v) { setPwSuccess(false); setPwError(''); } }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Смена пароля</DialogTitle>
          </DialogHeader>
          {pwSuccess ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Icon name="CheckCircle" size={32} />
              </div>
              <p className="text-center text-sm font-medium text-primary">Пароль успешно изменён</p>
              <Button className="mt-2 w-full" onClick={() => setPwOpen(false)}>Закрыть</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Текущий пароль</label>
                <input
                  type="password"
                  value={pwOld}
                  onChange={e => setPwOld(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Введите текущий пароль"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Новый пароль</label>
                <input
                  type="password"
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Минимум 4 символа"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Повторите новый пароль</label>
                <input
                  type="password"
                  value={pwNew2}
                  onChange={e => setPwNew2(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Повторите пароль"
                />
              </div>
              {pwError && <p className="text-xs text-red-500">{pwError}</p>}
              <Button className="w-full" onClick={handleChangePassword} disabled={pwLoading}>
                {pwLoading ? 'Сохраняем...' : 'Сохранить пароль'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Поп-ап Мои документы */}
      <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] flex flex-col rounded-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-display text-xl text-primary">Мои документы</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">

            {/* Договор займа */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Договор займа</p>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name="FileText" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{contractCode}</p>
                    <p className="text-xs text-muted-foreground">от {user.created_at?.slice(0, 10)}</p>
                  </div>
                </div>
                <dl className="space-y-1.5 text-sm border-t border-border pt-3">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Сумма займа</dt>
                    <dd className="font-semibold">{fmt(user.amount)} ₽</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Срок</dt>
                    <dd className="font-semibold">{user.days} дн.</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Ставка</dt>
                    <dd className="font-semibold">{fmtRate(loanRate)} / день</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Проценты</dt>
                    <dd className="font-semibold text-orange-600">{fmt(overpay)} ₽</dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5">
                    <dt className="font-semibold text-primary">К возврату</dt>
                    <dd className="font-bold text-accent">{fmt(total)} ₽</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Дата возврата</dt>
                    <dd className="font-semibold">{returnDate}</dd>
                  </div>
                </dl>
                <Button size="sm" variant="outline" className="w-full mt-1 gap-2" onClick={downloadContract}>
                  <Icon name="Download" size={14} />
                  Скачать договор
                </Button>
              </div>
            </div>

            {/* Чеки по займу */}
            {(receiptsLoading || receipts.length > 0) && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Чеки по займу</p>
                {receiptsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Icon name="Loader2" size={18} className="animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {receipts.map((r) => {
                      const meta = RECEIPT_TYPE_META[r.receipt_type] || RECEIPT_TYPE_META.money_sent;
                      return (
                        <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.className}`}>
                            <Icon name={meta.icon} size={17} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-primary">{meta.label}</p>
                            <p className="text-xs text-muted-foreground">{r.receipt_number} · {fmt(r.amount)} ₽</p>
                          </div>
                          <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/5 transition-colors">
                            <Icon name="Download" size={13} /> Скачать
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <CabinetDocPhotos user={user} docUploading={docUploading} docSaved={docSaved} onUpload={handleUploadDoc} />

            {/* Документы и согласия */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Документы и согласия</p>
              <div className="space-y-2">
                {[
                  {
                    key: 'debt_clearance',
                    icon: 'FileCheck',
                    title: 'Справка об отсутствии задолженности',
                    hint: 'С вашими данными и суммой займа',
                    build: buildDebtClearanceCertificateHtml,
                    fileName: `Справка_об_отсутствии_задолженности_${user.ref_number}.html`,
                  },
                  {
                    key: 'pd_consent',
                    icon: 'ShieldCheck',
                    title: 'Согласие на обработку персональных данных',
                    hint: 'Полный текст 152-ФЗ с вашими данными',
                    build: buildPersonalDataConsentHtml,
                    fileName: `Согласие_на_обработку_ПД_${user.ref_number}.html`,
                  },
                  {
                    key: 'pd_transfer',
                    icon: 'Share2',
                    title: 'Согласие на передачу персональных данных',
                    hint: 'Передача третьим лицам: БКИ, банки, коллекторы',
                    build: buildDataTransferConsentHtml,
                    fileName: `Согласие_на_передачу_ПД_${user.ref_number}.html`,
                  },
                ].map((doc) => (
                  <div key={doc.key} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon name={doc.icon} size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.hint}</p>
                    </div>
                    <button
                      onClick={() => downloadDoc(doc.build, doc.fileName)}
                      className="shrink-0 flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/5 transition-colors">
                      <Icon name="Download" size={13} /> Скачать
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог: История займов */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">История займов</DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex items-center justify-center py-10">
              <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
            </div>
          ) : historyItems.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">История займов пуста</p>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item, i) => {
                const st = (item.status as StatusKey) in STATUS_META ? (item.status as StatusKey) : 'review';
                const meta = STATUS_META[st];
                const itemRate = getLoanRate(item, historyItems);
                const overpayItem = Math.round(item.amount * itemRate * item.days);
                const totalItem = item.amount + overpayItem;
                return (
                  <div key={item.ref_number} className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}>
                          <Icon name={meta.icon} size={15} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{item.ref_number}</p>
                          <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
                        </div>
                      </div>
                      {i === 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-accent bg-accent/10 rounded-full px-2 py-0.5">Текущий</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Сумма</span>
                      <span className="font-semibold text-primary">{fmt(item.amount)} ₽</span>
                      <span className="text-muted-foreground">Срок</span>
                      <span className="font-semibold text-primary">{item.days} дн.</span>
                      <span className="text-muted-foreground">К возврату</span>
                      <span className="font-semibold text-primary">{fmt(totalItem)} ₽</span>
                      <span className="text-muted-foreground">Дата заявки</span>
                      <span className="font-semibold text-primary">{item.created_at?.slice(0, 10)}</span>
                    </div>
                    {item.operator_comment && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-accent">
                        <Icon name="MessageSquare" size={11} /> {item.operator_comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CabinetDialogs;