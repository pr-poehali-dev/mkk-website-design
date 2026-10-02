import { type UserSession } from '@/lib/api';

/** Ставка для первого займа клиента — 0.8% в день. */
export const FIRST_LOAN_RATE = 0.008;

/** Акционная ставка для повторного займа клиента — 0.06% в день. */
export const REPEAT_LOAN_RATE = 0.0006;

/**
 * Заявка считается повторной, если у клиента (по телефону) уже есть другая
 * заявка, поданная раньше текущей.
 */
export type TariffKey = 'start' | 'mini' | 'super';

export interface Tariff {
  key: TariffKey;
  name: string;
  rate: number;
  minDays: number;
  maxDays: number;
  weekly: boolean;
  description: string;
}

export const TARIFFS: Record<TariffKey, Tariff> = {
  start: { key: 'start', name: 'Старт', rate: 0.008, minDays: 5, maxDays: 30, weekly: false, description: 'до 30 дней, один платёж в конце срока' },
  mini: { key: 'mini', name: 'Мини', rate: 0.005, minDays: 7, maxDays: 90, weekly: true, description: 'до 90 дней, платёж раз в неделю' },
  super: { key: 'super', name: 'Супер займ', rate: 0.003, minDays: 7, maxDays: 365, weekly: true, description: 'до 1 года, платёж раз в неделю' },
};

export const TARIFF_KEYS = Object.keys(TARIFFS) as TariffKey[];

export function getTariff(key?: string | null): Tariff | null {
  return key && key in TARIFFS ? TARIFFS[key as TariffKey] : null;
}

export interface PaymentScheduleItem {
  num: number;
  date: Date;
  amount: number;
}

/** График платежей: для еженедельных тарифов — равные части раз в 7 дней, иначе один платёж в конце. */
export function buildSchedule(startDate: string | Date, total: number, days: number, tariff: Tariff | null): PaymentScheduleItem[] {
  const start = new Date(startDate);
  const count = tariff?.weekly ? Math.max(1, Math.ceil(days / 7)) : 1;
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + (i === count - 1 ? days : (i + 1) * 7));
    const amount = i === count - 1 ? total - base * (count - 1) : base;
    return { num: i + 1, date: d, amount };
  });
}

export function isRepeatRequest(target: Pick<UserSession, 'ref_number' | 'phone' | 'created_at'>, allRequests: UserSession[]): boolean {
  const targetTime = target.created_at ? new Date(target.created_at).getTime() : 0;
  return allRequests.some((r) =>
    r.phone === target.phone &&
    r.ref_number !== target.ref_number &&
    r.created_at &&
    new Date(r.created_at).getTime() < targetTime
  );
}

/** Возвращает дневную ставку по займу с учётом повторности заявки клиента. */
export function getLoanRate(target: Pick<UserSession, 'ref_number' | 'phone' | 'created_at'> & { tariff?: string | null }, allRequests: UserSession[]): number {
  const tariff = getTariff(target.tariff);
  if (tariff) return tariff.rate;
  return isRepeatRequest(target, allRequests) ? REPEAT_LOAN_RATE : FIRST_LOAN_RATE;
}

export function fmtRate(rate: number): string {
  return `${(rate * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
}
