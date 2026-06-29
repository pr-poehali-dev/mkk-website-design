import { useSyncExternalStore } from 'react';

export type StatusKey = 'review' | 'approved' | 'issued' | 'money_sent' | 'rejected' | 'transfer_error';

export interface LoanRequest {
  id: string;
  name: string;
  phone: string;
  password: string;
  amount: number;
  days: number;
  passport: string;
  status: StatusKey;
  createdAt: string;
}

export const STATUS_META: Record<StatusKey, { label: string; icon: string; color: string; bg: string; step: number }> = {
  review: { label: 'На рассмотрении', icon: 'Clock', color: 'text-amber-600', bg: 'bg-amber-100', step: 1 },
  approved: { label: 'Одобрено', icon: 'CheckCircle2', color: 'text-blue-600', bg: 'bg-blue-100', step: 2 },
  issued: { label: 'Договор подписан', icon: 'PenLine', color: 'text-indigo-600', bg: 'bg-indigo-100', step: 3 },
  money_sent: { label: 'Деньги выданы', icon: 'BadgeCheck', color: 'text-emerald-600', bg: 'bg-emerald-100', step: 4 },
  rejected: { label: 'Отказано', icon: 'XCircle', color: 'text-red-600', bg: 'bg-red-100', step: 0 },
  transfer_error: { label: 'Ошибка перевода', icon: 'AlertTriangle', color: 'text-orange-600', bg: 'bg-orange-100', step: 0 },
};

const KEY = 'zaimy_requests';
const AUTH_KEY = 'zaimy_auth';

const seed: LoanRequest[] = [
  { id: 'ZP-1042', name: 'Иван Петров', phone: '+79001234567', password: '1234', amount: 15000, days: 14, passport: '4500 123456', status: 'review', createdAt: '2026-06-20' },
  { id: 'ZP-1041', name: 'Мария Сидорова', phone: '+79007654321', password: '0000', amount: 30000, days: 21, passport: '4501 654321', status: 'approved', createdAt: '2026-06-19' },
  { id: 'ZP-1040', name: 'Алексей Смирнов', phone: '+79005556677', password: '1111', amount: 8000, days: 7, passport: '4502 778899', status: 'issued', createdAt: '2026-06-18' },
];

function read(): LoanRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

const listeners = new Set<() => void>();
let cache: LoanRequest[] = read();

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(data: LoanRequest[]) {
  localStorage.setItem(KEY, JSON.stringify(data));
  emit();
}

export function useRequests(): LoanRequest[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => cache,
  );
}

export function addRequest(r: Omit<LoanRequest, 'id' | 'status' | 'createdAt'>): LoanRequest {
  const data = read();
  const req: LoanRequest = {
    ...r,
    id: 'ZP-' + (1043 + data.length),
    status: 'review',
    createdAt: new Date().toISOString().slice(0, 10),
  };
  write([req, ...data]);
  return req;
}

export function setStatus(id: string, status: StatusKey) {
  write(read().map((r) => (r.id === id ? { ...r, status } : r)));
}

export function login(phone: string, password: string): LoanRequest | null {
  const clean = phone.replace(/\D/g, '');
  const user = read().find((r) => r.phone.replace(/\D/g, '').endsWith(clean.slice(-10)) && r.password === password);
  if (user) {
    localStorage.setItem(AUTH_KEY, user.phone);
    emit();
    return user;
  }
  return null;
}

export function currentUser(): LoanRequest | null {
  const phone = localStorage.getItem(AUTH_KEY);
  if (!phone) return null;
  return read().find((r) => r.phone === phone) ?? null;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  emit();
}