import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { apiUpdateRequest, apiGetRequest, saveSession, type UserSession } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';
import { useState, useEffect } from 'react';

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

const steps = [
  { key: 'review', label: 'Заявка принята', icon: 'FileCheck' },
  { key: 'approved', label: 'Одобрено', icon: 'CheckCircle2' },
  { key: 'issued', label: 'Договор подписан', icon: 'PenLine' },
  { key: 'money_sent', label: 'Деньги выданы', icon: 'BadgeCheck' },
];

interface Props {
  user: UserSession;
  contractSigned: boolean;
  signing: boolean;
  selectedBank: string | null;
  contractCode: string;
  onOpenCards: () => void;
  setContractSigned: (v: boolean) => void;
  setSigning: (v: boolean) => void;
  setUser: (u: UserSession) => void;
}

const CabinetStatusCard = ({
  user,
  contractSigned,
  signing,
  selectedBank,
  contractCode,
  onOpenCards,
  setContractSigned,
  setSigning,
  setUser,
}: Props) => {
  const status = (user.status as StatusKey) in STATUS_META ? (user.status as StatusKey) : 'review';
  const meta = STATUS_META[status];
  const activeStep = meta.step;

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [consentContract, setConsentContract] = useState(false);
  const [showVerifying, setShowVerifying] = useState(false);

  const handleSignClick = () => {
    setConsentData(false);
    setConsentContract(false);
    setShowConsentModal(true);
  };

  const handleConfirmSign = async () => {
    setShowConsentModal(false);
    setShowVerifying(true);
    setSigning(true);
    setTimeout(async () => {
      setShowVerifying(false);
      setContractSigned(true);
      try {
        await apiUpdateRequest({ ref_number: user.ref_number, status: 'issued' });
        const fresh = await apiGetRequest(user.ref_number);
        saveSession(fresh);
        setUser(fresh);
      } catch (_e) {
        setContractSigned(false);
      } finally {
        setSigning(false);
      }
    }, 2500);
  };

  const [showMoneySent, setShowMoneySent] = useState(true);
  useEffect(() => {
    if (status !== 'money_sent') return;
    setShowMoneySent(true);
    const t = setTimeout(() => setShowMoneySent(false), 2 * 60 * 1000);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <>
      {/* Статус-карта */}
      <div className="animate-fade-up mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div className="flex items-center gap-4 border-b border-border p-6">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${meta.bg} ${meta.color} transition-all`}>
            <Icon name={meta.icon} size={32} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Статус заявки {user.ref_number}</p>
            <p className={`font-display text-2xl font-bold ${meta.color}`}>{meta.label}</p>
          </div>
        </div>

        {status !== 'rejected' && status !== 'transfer_error' ? (
          <div className="p-4 space-y-0">
            {steps.map((s, i) => {
              const done = activeStep >= i + 1;
              const active = activeStep === i + 1;
              const isLast = i === steps.length - 1;
              return (
                <div key={s.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${done ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {done && !active ? <Icon name="Check" size={18} /> : <Icon name={s.icon} size={18} />}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 my-1 min-h-[20px] rounded-full transition-all ${activeStep > i + 1 ? 'bg-accent' : 'bg-border'}`} />
                    )}
                  </div>
                  <div className={`pb-4 pt-1.5 ${isLast ? '' : ''}`}>
                    <p className={`text-sm font-semibold leading-tight ${done ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</p>
                    {active && <p className="mt-0.5 text-xs text-accent font-medium">Текущий статус</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : status === 'transfer_error' ? (
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">При переводе средств произошла ошибка. Пожалуйста, свяжитесь с нами удобным способом — мы решим вопрос в кратчайшие сроки.</p>
            <div className="flex flex-col gap-2">
              <a href="tel:+74999610736"
                className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors">
                <Icon name="Phone" size={18} className="shrink-0" />
                <span>Позвонить: +7(499)961-07-36</span>
              </a>
              <a href="https://t.me/zaimyplus_support" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                <Icon name="MessageCircle" size={18} className="shrink-0" />
                <span>Написать в чат поддержки</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6 text-sm text-muted-foreground">
            К сожалению, по заявке принято отрицательное решение. Вы можете подать новую заявку через 7 дней.
          </div>
        )}
      </div>

      {/* Блок займа */}
      <div className="mt-6">
        {status === 'approved' ? (
          <div className="rounded-2xl border-2 border-accent/50 bg-accent/5 p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-primary">
              <Icon name="FileSignature" size={18} className="text-accent" /> Условия займа
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Сумма</dt><dd className="font-semibold">{fmt(user.amount)} ₽</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Срок</dt><dd className="font-semibold">{user.days} дн.</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Ставка</dt><dd className="font-semibold">0.8% / день</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Переплата</dt><dd className="font-semibold">{fmt(Math.round(user.amount * 0.008 * user.days))} ₽</dd></div>
              <div className="flex justify-between border-t border-accent/20 pt-2">
                <dt className="font-semibold text-primary">К возврату</dt>
                <dd className="font-bold text-accent text-base">{fmt(user.amount + Math.round(user.amount * 0.008 * user.days))} ₽</dd>
              </div>
            </dl>
            {/* Способ получения */}
            <div className={`mt-4 flex items-center justify-between rounded-xl border px-4 py-3 ${!selectedBank ? 'border-orange-300 bg-orange-50' : 'border-border bg-card'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${!selectedBank ? 'bg-orange-100 text-orange-500' : 'bg-primary/10 text-primary'}`}>
                  <Icon name={selectedBank ? 'Smartphone' : 'AlertCircle'} size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Способ получения <span className="text-red-500">*</span></p>
                  {selectedBank
                    ? <p className="text-sm font-semibold text-primary">{BANKS.find(b => b.name === selectedBank)?.icon} {selectedBank} · СБП</p>
                    : <p className="text-sm font-semibold text-orange-600">Обязательно выберите банк</p>
                  }
                </div>
              </div>
              <button onClick={onOpenCards} className={`text-sm font-medium hover:underline ${!selectedBank ? 'text-orange-600' : 'text-accent'}`}>
                {selectedBank ? 'Изменить' : 'Выбрать'}
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
              Номер договора: <span className="font-mono font-semibold text-primary">{contractCode}</span>
            </div>
            {contractSigned ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-4">
                  <Icon name="CheckCircle2" size={20} className="text-green-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-700 text-sm">Договор подписан</p>
                    <p className="text-xs text-green-600">№ {contractCode}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                      <Icon name="Clock" size={22} className="text-accent" />
                    </div>
                  </div>
                  <p className="font-display font-bold text-primary text-base">Ожидайте зачисления</p>
                  <p className="text-sm text-muted-foreground mt-1">Деньги поступят на вашу карту <span className="font-semibold text-primary">в течение 15 минут</span></p>
                  {selectedBank && (
                    <p className="mt-2 text-xs text-muted-foreground">Перевод через СБП · {selectedBank}</p>
                  )}
                </div>
              </div>
            ) : (
              <>
              {!selectedBank && (
                <p className="mt-3 text-center text-xs text-orange-600">Выберите способ получения, чтобы подписать договор</p>
              )}
              <Button size="sm" className="mt-2 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={signing || !selectedBank}
                onClick={handleSignClick}>
                {signing
                  ? <span className="flex items-center gap-2"><Icon name="Loader2" size={15} className="animate-spin" /> Оформляем...</span>
                  : <span className="flex items-center gap-2"><Icon name="PenLine" size={15} /> Подписать договор</span>
                }
              </Button>
              </>
            )}
          </div>
        ) : (
          <>
          {status === 'issued' && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 p-4">
                <Icon name="PenLine" size={22} className="text-indigo-600 shrink-0" />
                <div>
                  <p className="font-semibold text-indigo-700">Договор подписан</p>
                  <p className="text-xs text-indigo-500">№ {contractCode}</p>
                </div>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                    <Icon name="Clock" size={22} className="text-accent" />
                  </div>
                </div>
                <p className="font-display font-bold text-primary text-base">Ожидайте зачисления средств</p>
                <p className="text-sm text-muted-foreground mt-1">Деньги поступят на вашу карту <span className="font-semibold text-primary">в течение 15 минут</span></p>
                {user.payment_bank && (
                  <p className="mt-2 text-xs text-muted-foreground">Перевод через СБП · {user.payment_bank}</p>
                )}
              </div>
            </div>
          )}
          {status === 'money_sent' && showMoneySent && (
            <div className="mt-6 space-y-3">
              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                    <Icon name="BadgeCheck" size={28} className="text-emerald-600" />
                  </div>
                </div>
                <p className="font-display font-bold text-emerald-700 text-lg">Деньги выданы!</p>
                <p className="text-sm text-emerald-600 mt-1">Средства зачислены на вашу карту</p>
                {user.payment_bank && (
                  <p className="mt-1 text-xs text-muted-foreground">{user.payment_bank} · СБП</p>
                )}
                <div className="mt-3 rounded-lg bg-white border border-emerald-200 px-4 py-2 inline-block">
                  <p className="text-2xl font-bold text-emerald-600">{fmt(user.amount)} ₽</p>
                </div>
              </div>
            </div>
          )}
          {status !== 'issued' && (
            <div className={`rounded-2xl border p-6 ${status === 'money_sent' ? 'mt-4 border-accent/40 bg-accent/5' : 'border-border bg-card'}`}>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-primary">
                <Icon name={status === 'money_sent' ? 'BadgeDollarSign' : 'Wallet'} size={18} className="text-accent" />
                {status === 'money_sent' ? 'Активный займ' : 'Параметры займа'}
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Сумма займа</dt><dd className="font-semibold">{fmt(user.amount)} ₽</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Срок</dt><dd className="font-semibold">{user.days} дн.</dd></div>
                {status === 'money_sent' && (
                  <>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Переплата (0.8%/день)</dt><dd className="font-semibold">{fmt(Math.round(user.amount * 0.008 * user.days))} ₽</dd></div>
                    <div className="flex justify-between border-t border-accent/20 pt-2">
                      <dt className="font-semibold text-primary">К возврату</dt>
                      <dd className="font-bold text-accent text-base">{fmt(user.amount + Math.round(user.amount * 0.008 * user.days))} ₽</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between"><dt className="text-muted-foreground">Дата заявки</dt><dd className="font-semibold">{user.created_at?.slice(0, 10)}</dd></div>
              </dl>
            </div>
          )}
          </>
        )}
      </div>

      {status === 'money_sent' && (
        <Button size="lg" className="mt-6 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90">
          Погасить займ <Icon name="ArrowRight" size={18} className="ml-1" />
        </Button>
      )}

      {/* Поп-ап согласия */}
      <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg">
              <Icon name="ShieldCheck" size={20} className="text-accent" />
              Подтверждение договора
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Для подписания договора займа необходимо ваше согласие:</p>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 hover:bg-secondary/50 transition-colors">
              <input
                type="checkbox"
                checked={consentData}
                onChange={(e) => setConsentData(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
              />
              <span className="text-sm text-primary">Я даю согласие на обработку персональных данных в соответствии с требованиями 152-ФЗ</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 hover:bg-secondary/50 transition-colors">
              <input
                type="checkbox"
                checked={consentContract}
                onChange={(e) => setConsentContract(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
              />
              <span className="text-sm text-primary">Я ознакомился с условиями договора займа № <span className="font-mono font-semibold">{contractCode}</span> и согласен с ними</span>
            </label>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!consentData || !consentContract}
              onClick={handleConfirmSign}>
              <Icon name="PenLine" size={16} className="mr-2" />
              Подписать договор
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Экран проверки */}
      <Dialog open={showVerifying}>
        <DialogContent className="max-w-xs text-center">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <Icon name="Loader2" size={32} className="animate-spin text-accent" />
            </div>
            <div>
              <p className="font-display font-bold text-primary text-lg">Идёт проверка документов</p>
              <p className="mt-1 text-sm text-muted-foreground">Пожалуйста, подождите...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CabinetStatusCard;