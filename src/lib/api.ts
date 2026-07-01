const URLS = {
  register: 'https://functions.poehali.dev/7dc0972a-c770-4d7c-86b6-a3fd575e479b',
  login:    'https://functions.poehali.dev/178d05da-1f3c-44f3-afb7-e5c1ffcb2ec5',
  get:      'https://functions.poehali.dev/972288ec-3c64-419d-8b5c-4d61bb09a5b1',
  status:   'https://functions.poehali.dev/fc3311ea-4731-4819-98d5-675332a348fe',
  upload:   'https://functions.poehali.dev/39467c33-638c-4a9d-8a7a-fc8d3be83521',
};

const ADMIN_TOKEN = 'admin_zaimy_plus';
const SESSION_KEY = 'zaimy_session';

export interface UserSession {
  id: number;
  ref_number: string;
  full_name: string;
  phone: string;
  passport: string;
  passport_by?: string;
  birth_date?: string;
  amount: number;
  days: number;
  status: string;
  operator_comment?: string | null;
  created_at: string;
  address_residence?: string;
  address_registration?: string;
  work_place?: string;
  work_phone?: string;
  income_doc_url?: string;
  payment_bank?: string | null;
  is_blocked?: boolean;
  email?: string | null;
  doc_urls?: string[] | null;
  passport_photo_url?: string | null;
  registration_photo_url?: string | null;
  passport_photo_status?: string | null;
  registration_photo_status?: string | null;
  income_doc_status?: string | null;
  password_plain?: string | null;
  insurance_enabled?: boolean;
}

export function getSession(): UserSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSession(user: UserSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function apiRegister(data: {
  full_name: string; phone: string; password?: string; password_hash?: string;
  amount: number; days: number;
  passport?: string; passport_by?: string; birth_date?: string;
  address_residence?: string; address_registration?: string;
  work_place?: string; work_phone?: string; income_doc_url?: string;
  email?: string; passport_photo_url?: string;
}) {
  const res = await fetch(URLS.register, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка регистрации');
  return json as { id: number; ref_number: string; status: string; created_at: string };
}

export async function apiUploadFile(file: File): Promise<string> {
  const b64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const res = await fetch(URLS.upload, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: b64, mime: file.type }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка загрузки файла');
  return json.url as string;
}

export async function apiLogin(phone: string, password: string): Promise<UserSession> {
  const res = await fetch(URLS.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Неверный телефон или пароль');
  return json as UserSession;
}

export async function apiGetRequest(ref: string): Promise<UserSession> {
  const res = await fetch(`${URLS.get}?ref=${encodeURIComponent(ref)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Не найдено');
  return json as UserSession;
}

export async function apiGetHistory(phone: string): Promise<UserSession[]> {
  const res = await fetch(`${URLS.get}?action=history&phone=${encodeURIComponent(phone)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка');
  return json as UserSession[];
}

export async function apiGetAll(): Promise<UserSession[]> {
  const res = await fetch(URLS.get, {
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка');
  return json as UserSession[];
}

export async function apiUpdateRequest(data: {
  ref_number: string;
  status?: string;
  amount?: number;
  days?: number;
  operator_comment?: string;
  payment_bank?: string | null;
  is_blocked?: boolean;
  doc_urls?: string[];
  insurance_enabled?: boolean;
}): Promise<void> {
  const res = await fetch(URLS.status, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка');
}

export async function apiAdminSetDocStatus(data: {
  ref_number: string;
  passport_photo_status?: string;
  registration_photo_status?: string;
  income_doc_status?: string;
}): Promise<void> {
  const res = await fetch(URLS.status, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка');
}

export async function apiUpdateClientDocs(data: {
  ref_number: string;
  passport_photo_url?: string;
  registration_photo_url?: string;
  income_doc_url?: string;
}): Promise<void> {
  const res = await fetch(URLS.status, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'client_update_docs', ...data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка');
}

export async function apiDeleteRequests(ref_numbers: string[]): Promise<void> {
  const res = await fetch(URLS.status, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify({ action: 'delete', ref_numbers }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка удаления');
}

export async function apiAdminSetPassword(phone: string, new_password: string): Promise<void> {
  const res = await fetch(URLS.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify({ action: 'admin_set_password', phone, new_password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка смены пароля');
}

export async function apiChangePassword(phone: string, old_password: string, new_password: string): Promise<void> {
  const res = await fetch(URLS.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'change_password', phone, old_password, new_password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка смены пароля');
}

export async function apiGetSiteSettings(): Promise<Record<string, string>> {
  const res = await fetch(`${URLS.get}?action=settings`);
  if (!res.ok) return {};
  return res.json();
}

export async function apiSaveSiteSettings(settings: Record<string, string>): Promise<void> {
  const res = await fetch(URLS.status, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify({ action: 'save_settings', settings }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка сохранения');
}