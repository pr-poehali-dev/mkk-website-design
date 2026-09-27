import { type UserSession } from '@/lib/api';

/** Ставка для первого займа клиента — 0.8% в день. */
export const FIRST_LOAN_RATE = 0.008;

/** Акционная ставка для повторного займа клиента — 0.06% в день. */
export const REPEAT_LOAN_RATE = 0.0006;

/**
 * Заявка считается повторной, если у клиента (по телефону) уже есть другая
 * заявка, поданная раньше текущей.
 */
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
export function getLoanRate(target: Pick<UserSession, 'ref_number' | 'phone' | 'created_at'>, allRequests: UserSession[]): number {
  return isRepeatRequest(target, allRequests) ? REPEAT_LOAN_RATE : FIRST_LOAN_RATE;
}

export function fmtRate(rate: number): string {
  return `${(rate * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
}
