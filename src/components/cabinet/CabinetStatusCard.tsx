import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { apiUpdateRequest, apiGetRequest, saveSession, type UserSession } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';

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
  { key: 'issued', label: 'Деньги выданы', icon: 'BadgeCheck' },
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
          <div className="grid grid-cols-3 gap-2 p-6">
            {steps.map((s, i) => {
              const done = activeStep >= i + 1;
              return (
                <div key={s.key} className="flex flex-col items-center text-center">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${done ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    <Icon name={s.icon} size={20} />
                  </div>
                  <span className={`mt-2 text-xs font-medium ${done ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
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
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">
                <Icon name="CheckCircle2" size={16} /> Договор подписан
              </div>
            ) : (
              <>
              {!selectedBank && (
                <p className="mt-3 text-center text-xs text-orange-600">Выберите способ получения, чтобы подписать договор</p>
              )}
              <Button size="sm" className="mt-2 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={signing || !selectedBank}
                onClick={async () => {
                  setSigning(true);
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
                }}>
                {signing
                  ? <span className="flex items-center gap-2"><Icon name="Loader2" size={15} className="animate-spin" /> Оформляем...</span>
                  : <span className="flex items-center gap-2"><Icon name="PenLine" size={15} /> Подписать договор</span>
                }
              </Button>
              </>
            )}
          </div>
        ) : (
          <div className={`rounded-2xl border p-6 ${status === 'issued' ? 'border-accent/40 bg-accent/5' : 'border-border bg-card'}`}>
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-primary">
              <Icon name={status === 'issued' ? 'BadgeDollarSign' : 'Wallet'} size={18} className="text-accent" />
              {status === 'issued' ? 'Активный займ' : 'Параметры займа'}
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Сумма займа</dt><dd className="font-semibold">{fmt(user.amount)} ₽</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Срок</dt><dd className="font-semibold">{user.days} дн.</dd></div>
              {status === 'issued' && (
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
      </div>

      {status === 'issued' && (
        <Button size="lg" className="mt-6 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90">
          Погасить займ <Icon name="ArrowRight" size={18} className="ml-1" />
        </Button>
      )}
    </>
  );
};

export default CabinetStatusCard;