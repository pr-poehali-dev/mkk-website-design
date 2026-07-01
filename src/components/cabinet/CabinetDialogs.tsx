import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { apiUpdateRequest, apiGetRequest, apiChangePassword, apiUploadFile, apiUpdateClientDocs, apiGetHistory, saveSession, type UserSession } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';
import { buildContractHtml } from '@/components/admin/contractHtml';

const BANKS = [
  { name: 'Сбербанк', icon: '🟢' },
  { name: 'Тинькофф', icon: '🟡' },
  { name: 'ВТБ', icon: '🔵' },
  { name: 'Альфа-Банк', icon: '🔴' },
  { name: 'Газпромбанк', icon: '🔷' },
  { name: 'Россельхозбанк', icon: '🟩' },
  { name: 'Почта Банк', icon: '📮' },
  { name: 'Совкомбанк', icon: '🟠' },
  { name: 'Открытие', icon: '🌐' },
  { name: 'Другой банк', icon: '🏦' },
];

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
  const returnDate = (() => {
    const d = new Date(user.created_at || Date.now());
    d.setDate(d.getDate() + user.days);
    return d.toLocaleDateString('ru-RU');
  })();

  const overpay = Math.round(user.amount * 0.008 * user.days);
  const total = user.amount + overpay;

  const downloadContract = () => {
    const sigCode = localStorage.getItem(`sig_code_${user.ref_number}`) || undefined;
    const html = buildContractHtml(user, user.amount, user.days, contractCode, returnDate, sigCode);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Договор_${contractCode}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<UserSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const [pwOpen, setPwOpen] = useState(false);
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwNew2, setPwNew2] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [docUploading, setDocUploading] = useState<string | null>(null);
  const [docSaved, setDocSaved] = useState<string | null>(null);

  const handleUploadDoc = async (file: File, field: 'passport_photo_url' | 'registration_photo_url' | 'income_doc_url') => {
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Меню</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3 rounded-xl bg-secondary p-4">
            <div className="flex h-12 w-12 items-center justify-center bg-primary text-lg font-bold text-primary-foreground rounded-sm">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-primary">{user.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => { setProfileOpen(true); setMenuOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Icon name="User" size={18} className="text-accent" /> Мои данные
            </button>
            <button
              onClick={() => { setCardsOpen(true); setBankSaved(false); setMenuOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Icon name="CreditCard" size={18} className="text-accent" /> Мои карты
              {selectedBank && <span className="ml-auto text-xs text-muted-foreground">{selectedBank}</span>}
            </button>
            <button
              onClick={() => { setDocsOpen(true); setMenuOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Icon name="FolderOpen" size={18} className="text-accent" /> Мои документы
            </button>
            <button
              onClick={openHistory}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Icon name="History" size={18} className="text-accent" /> История займов
            </button>
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
              <Icon name="LogOut" size={18} /> Выйти из кабинета
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Поп-ап Мои карты */}
      <Dialog open={cardsOpen} onOpenChange={(o) => { setCardsOpen(o); if (!o) setBankSaved(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Мои карты</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Выберите банк для получения займа по СБП. Деньги придут на карту этого банка, привязанную к вашему номеру телефона.</p>
          {bankSaved ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
              <Icon name="CheckCircle2" size={28} className="mx-auto mb-2 text-green-600" />
              <p className="font-semibold text-green-700">Банк сохранён</p>
              <p className="mt-1 text-sm text-green-600">{selectedBank}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {BANKS.map((bank) => (
                <button
                  key={bank.name}
                  onClick={() => setSelectedBank(bank.name)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${selectedBank === bank.name ? 'border-accent bg-accent/10 text-primary' : 'border-border bg-card text-primary hover:bg-secondary'}`}>
                  <span className="text-base">{bank.icon}</span>
                  <span className="leading-tight">{bank.name}</span>
                  {selectedBank === bank.name && <Icon name="Check" size={14} className="ml-auto text-accent" />}
                </button>
              ))}
            </div>
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Мои данные</DialogTitle>
          </DialogHeader>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">ФИО</dt>
              <dd className="font-semibold text-right">{user.full_name}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Телефон</dt>
              <dd className="font-semibold">{user.phone}</dd>
            </div>
            {user.birth_date && (
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">Дата рождения</dt>
                <dd className="font-semibold">{user.birth_date}</dd>
              </div>
            )}
            {user.passport && (
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">Паспорт</dt>
                <dd className="font-semibold">{user.passport}</dd>
              </div>
            )}
            {user.address_residence && (
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">Адрес</dt>
                <dd className="font-semibold text-right max-w-[180px]">{user.address_residence}</dd>
              </div>
            )}
            {user.work_place && (
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">Работа</dt>
                <dd className="font-semibold text-right max-w-[180px]">{user.work_place}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Заявка</dt>
              <dd className="font-semibold">{user.ref_number}</dd>
            </div>
          </dl>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => { setProfileOpen(false); setPwSuccess(false); setPwError(''); setPwOpen(true); }}
          >
            <Icon name="KeyRound" size={16} className="mr-2" />
            Сменить пароль
          </Button>
        </DialogContent>
      </Dialog>

      {/* Поп-ап Смена пароля */}
      <Dialog open={pwOpen} onOpenChange={(v) => { setPwOpen(v); if (!v) { setPwSuccess(false); setPwError(''); } }}>
        <DialogContent className="max-w-sm">
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
        <DialogContent className="max-w-sm max-h-[90vh] flex flex-col">
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
                    <dd className="font-semibold">0.8% / день</dd>
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

            {/* Фото документов — загрузка клиентом */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Фото документов</p>
              <div className="space-y-2">
                {(
                  [
                    { field: 'passport_photo_url' as const, statusField: 'passport_photo_status' as const, label: 'Фото паспорта', hint: 'Разворот с фотографией' },
                    { field: 'registration_photo_url' as const, statusField: 'registration_photo_status' as const, label: 'Фото регистрации', hint: 'Страница с пропиской' },
                    { field: 'income_doc_url' as const, statusField: 'income_doc_status' as const, label: 'Справка о доходах', hint: 'С места работы' },
                  ]
                ).map(({ field, statusField, label, hint }) => {
                  const url = user[field];
                  const docStatus = user[statusField];
                  const isLoading = docUploading === field;
                  const isSaved = docSaved === field;
                  const isApproved = docStatus === 'approved';
                  const isRejected = docStatus === 'rejected';
                  const isPending = url && docStatus === 'pending';
                  return (
                    <div key={field} className={`rounded-xl border bg-card overflow-hidden ${isRejected ? 'border-red-300' : isApproved ? 'border-green-300' : isPending ? 'border-orange-300' : 'border-border'}`}>
                      <div className="flex items-center gap-3 p-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isApproved ? 'bg-green-100 text-green-600' : isRejected ? 'bg-red-100 text-red-500' : isPending ? 'bg-orange-100 text-orange-500' : 'bg-primary/10 text-primary'}`}>
                          <Icon name={isApproved ? 'BadgeCheck' : isRejected ? 'XCircle' : isPending ? 'Clock' : 'FileImage'} size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary">{label}</p>
                          {isApproved && <p className="text-xs font-semibold text-green-600">Принято ✓</p>}
                          {isRejected && <p className="text-xs font-semibold text-red-500">Отклонено — загрузите снова</p>}
                          {isPending && <p className="text-xs text-orange-600">На проверке...</p>}
                          {!url && <p className="text-xs text-muted-foreground">{hint}</p>}
                        </div>
                        {url && !isRejected && (
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 text-xs text-accent hover:underline">
                            Открыть
                          </a>
                        )}
                      </div>
                      <label className={`flex cursor-pointer items-center justify-center gap-2 border-t border-border px-3 py-2 text-xs transition-colors ${isLoading ? 'pointer-events-none bg-secondary text-muted-foreground' : isApproved ? 'pointer-events-none bg-green-50 text-green-600' : 'hover:bg-accent/5 text-accent'}`}>
                        {isLoading
                          ? <><Icon name="Loader2" size={13} className="animate-spin" /> Загрузка...</>
                          : isSaved
                            ? <><Icon name="Check" size={13} className="text-green-600" /> <span className="text-green-600">Отправлено на проверку</span></>
                            : isApproved
                              ? <><Icon name="ShieldCheck" size={13} /> Документ принят</>
                              : <><Icon name="Upload" size={13} /> {url && !isRejected ? 'Заменить файл' : 'Загрузить'}</>}
                        <input type="file" accept="image/*,application/pdf" className="hidden"
                          disabled={isLoading || isApproved}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadDoc(f, field); e.target.value = ''; }} />
                      </label>
                    </div>
                  );
                })}
                {user.doc_urls && user.doc_urls.length > 0 && (
                  <div className="pt-1">
                    <p className="mb-1.5 text-xs text-muted-foreground">Документы от оператора:</p>
                    {user.doc_urls.map((url, i) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-accent hover:underline mb-1">
                        <Icon name="FileImage" size={13} /> Документ {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Согласие на обработку персональных данных */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Согласие на обработку ПД</p>
              <div className="rounded-xl border border-border bg-secondary p-4 text-xs text-muted-foreground leading-relaxed space-y-2 max-h-64 overflow-y-auto">
                <p className="font-semibold text-primary text-sm">Согласие на обработку персональных данных</p>
                <p>Я, нижеподписавшийся, даю своё согласие ООО МКК «Займы Плюс» (далее — Оператор) на обработку моих персональных данных в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».</p>
                <p>Перечень персональных данных: фамилия, имя, отчество; дата рождения; серия и номер паспорта; адрес регистрации и проживания; номер телефона; место работы.</p>
                <p>Цель обработки: рассмотрение заявки на предоставление микрозайма, заключение и исполнение договора займа, проверка кредитоспособности, передача данных в бюро кредитных историй.</p>
                <p>Способы обработки: сбор, запись, систематизация, накопление, хранение, уточнение, использование, передача (в том числе третьим лицам в рамках закона), обезличивание, блокирование, удаление.</p>
                <p>Срок обработки: в течение 5 лет с момента погашения займа либо до отзыва согласия.</p>
                <p>Настоящее согласие может быть отозвано путём направления письменного заявления по адресу Оператора. Отзыв согласия не прекращает обработку данных, необходимую для исполнения договора и требований законодательства.</p>
                <p className="pt-1 font-medium text-primary">Заявка: {user.ref_number} · Дата: {user.created_at?.slice(0, 10)}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог: История займов */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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
                const overpayItem = Math.round(item.amount * 0.008 * item.days);
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