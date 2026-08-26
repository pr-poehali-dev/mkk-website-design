const URLS = {
  register: 'https://functions.poehali.dev/7dc0972a-c770-4d7c-86b6-a3fd575e479b',
  login:    'https://functions.poehali.dev/178d05da-1f3c-44f3-afb7-e5c1ffcb2ec5',
  get:      'https://functions.poehali.dev/972288ec-3c64-419d-8b5c-4d61bb09a5b1',
  status:   'https://functions.poehali.dev/fc3311ea-4731-4819-98d5-675332a348fe',
  upload:   'https://functions.poehali.dev/39467c33-638c-4a9d-8a7a-fc8d3be83521',
  email:    'https://functions.poehali.dev/ff7e9777-9bbc-4579-b1d9-9d5083d953f9',
  verify:   'https://functions.poehali.dev/c46fea2c-8dfa-4977-aa58-29668db3bab8',
  support:  'https://functions.poehali.dev/35cc758e-3087-464a-9931-bac36bd2358b',
  reminder: 'https://functions.poehali.dev/ab5dcdf0-79b1-4f59-b478-6620609cee50',
  news:     'https://functions.poehali.dev/15f735f2-8919-476c-a802-0903e3c80c85',
  notifications: 'https://functions.poehali.dev/12de820d-b0b0-429a-8e74-07540c902a56',
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
  money_sent_at?: string | null;
  selfie_photo_url?: string | null;
  selfie_photo_status?: string | null;
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

export async function apiSendVerificationCode(email: string, purpose: 'register' | 'sign', ref_number?: string): Promise<void> {
  const res = await fetch(URLS.verify, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'send_code', email, purpose, ref_number }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Не удалось отправить код');
}

export async function apiVerifyCode(email: string, purpose: 'register' | 'sign', code: string): Promise<void> {
  const res = await fetch(URLS.verify, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify_code', email, purpose, code }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Неверный код');
}

export async function apiRegister(data: {
  full_name: string; phone: string; password?: string; password_hash?: string;
  amount: number; days: number;
  passport?: string; passport_by?: string; birth_date?: string;
  address_residence?: string; address_registration?: string;
  work_place?: string; work_phone?: string; income_doc_url?: string;
  email: string; passport_photo_url?: string; selfie_photo_url?: string;
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

export async function apiUploadFile(file: File, folder?: string): Promise<string> {
  const b64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const res = await fetch(URLS.upload, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: b64, mime: file.type, folder }),
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
  selfie_photo_status?: string;
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
  selfie_photo_url?: string;
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

export interface SystemEmailDesign {
  brand_name: string;
  primary_color: string;
  accent_color: string;
  logo_url?: string;
  signature?: string;
  layout?: 'classic' | 'card' | 'header';
}

export interface SystemEmailTemplate {
  subject: string;
  body: string;
}

export interface SystemCodeEmailTemplate {
  subject: string;
  intro: string;
}

export interface SystemEmailTemplates {
  design: SystemEmailDesign;
  register_email: SystemEmailTemplate;
  status_emails: Record<string, SystemEmailTemplate>;
  code_emails: Record<'register' | 'sign', SystemCodeEmailTemplate>;
  reminder_email: SystemEmailTemplate;
}

export const DEFAULT_SYSTEM_EMAIL_TEMPLATES: SystemEmailTemplates = {
  design: {
    brand_name: 'Частные займы плюс',
    primary_color: '#1a2b4c',
    accent_color: '#f2f4f8',
    logo_url: '',
    signature: 'С уважением,\nЗаймы-плюс.рф\nРежим работы с 09:00 до 18:00 по мск.',
    layout: 'classic',
  },
  register_email: {
    subject: 'Ваш запрос принят',
    body: 'Ваш запрос успешно зарегистрирован и передан в службу поддержки. Мы ответим вам на этот email в ближайшее время.',
  },
  status_emails: {
    review: { subject: 'Заявка принята', body: 'Ваша заявка {ref} принята и находится на рассмотрении. Мы уведомим вас, как только решение будет готово.' },
    approved: { subject: 'Заявка одобрена', body: 'Отличные новости! Ваша заявка {ref} одобрена. Зайдите в личный кабинет, чтобы продолжить оформление.' },
    issued: { subject: 'Договор подписан', body: 'Договор по заявке {ref} подписан. Ожидайте поступления денежных средств.' },
    money_sent: { subject: 'Деньги отправлены', body: 'Денежные средства по заявке {ref} отправлены на ваш счёт.' },
    rejected: { subject: 'Заявка отклонена', body: 'К сожалению, по заявке {ref} принято решение об отказе.' },
    transfer_error: { subject: 'Ошибка перевода', body: 'При переводе средств по заявке {ref} произошла ошибка. Наш оператор свяжется с вами.' },
    repaid: { subject: 'Займ погашен', body: 'Займ по заявке {ref} успешно погашен. Спасибо, что выбираете нас!' },
  },
  code_emails: {
    register: { subject: 'Код подтверждения регистрации', intro: 'Ваш код подтверждения для оформления заявки на займ:' },
    sign: { subject: 'Код подписи договора', intro: 'Ваш код для подписания договора займа:' },
  },
  reminder_email: {
    subject: 'Напоминание о погашении займа',
    body: 'Напоминаем, что по заявке {ref} срок погашения займа — {return_date}. Сумма к возврату: {total} ₽. Пожалуйста, подготовьте средства заранее, чтобы избежать просрочки.',
  },
};

export async function apiGetSystemEmailTemplates(): Promise<SystemEmailTemplates> {
  const s = await apiGetSiteSettings();
  if (!s.system_email_templates) return DEFAULT_SYSTEM_EMAIL_TEMPLATES;
  try {
    const parsed = JSON.parse(s.system_email_templates);
    return {
      design: { ...DEFAULT_SYSTEM_EMAIL_TEMPLATES.design, ...parsed.design },
      register_email: { ...DEFAULT_SYSTEM_EMAIL_TEMPLATES.register_email, ...parsed.register_email },
      status_emails: { ...DEFAULT_SYSTEM_EMAIL_TEMPLATES.status_emails, ...parsed.status_emails },
      code_emails: { ...DEFAULT_SYSTEM_EMAIL_TEMPLATES.code_emails, ...parsed.code_emails },
      reminder_email: { ...DEFAULT_SYSTEM_EMAIL_TEMPLATES.reminder_email, ...parsed.reminder_email },
    };
  } catch {
    return DEFAULT_SYSTEM_EMAIL_TEMPLATES;
  }
}

export async function apiSaveSystemEmailTemplates(templates: SystemEmailTemplates): Promise<void> {
  await apiSaveSiteSettings({ system_email_templates: JSON.stringify(templates) });
}

// Проверяет активные займы и рассылает клиентам напоминания за 1-2 дня до срока погашения.
// Безопасно вызывать многократно — сервер сам ограничивает частоту выполнения до раза в сутки.
export async function apiCheckReminders(): Promise<void> {
  try {
    await fetch(URLS.reminder);
  } catch {
    // не критично — просто пропускаем эту проверку
  }
}

export async function apiSendEmail(data: { ref_number?: string; to?: string; subject: string; message: string }): Promise<void> {
  const res = await fetch(URLS.email, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка отправки письма');
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export async function apiGetEmailTemplates(): Promise<EmailTemplate[]> {
  const s = await apiGetSiteSettings();
  try {
    return s.email_templates ? JSON.parse(s.email_templates) : [];
  } catch {
    return [];
  }
}

export async function apiSaveEmailTemplates(templates: EmailTemplate[]): Promise<void> {
  await apiSaveSiteSettings({ email_templates: JSON.stringify(templates) });
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

export type SupportStatus = 'new' | 'in_progress' | 'closed';

export interface SupportMessage {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: SupportStatus;
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
  ref_number: string | null;
  file_urls: string[] | null;
  admin_file_urls: string[] | null;
}

export async function apiSubmitSupportRequest(data: {
  name: string; phone?: string; email: string; message: string; ref_number?: string; file_urls?: string[];
}): Promise<void> {
  const res = await fetch(URLS.support, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Не удалось отправить сообщение');
}

export async function apiGetSupportMessages(): Promise<SupportMessage[]> {
  const res = await fetch(URLS.support, {
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка');
  return json as SupportMessage[];
}

export async function apiReplySupportMessage(id: number, reply: string, admin_file_urls?: string[]): Promise<void> {
  const res = await fetch(URLS.support, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify({ action: 'reply', id, reply, admin_file_urls }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка отправки ответа');
}

export async function apiSetSupportStatus(id: number, status: SupportStatus): Promise<void> {
  const res = await fetch(URLS.support, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify({ action: 'set_status', id, status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка смены статуса');
}

export interface NewsItem {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published_at: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export async function apiGetNews(): Promise<NewsItem[]> {
  const res = await fetch(URLS.news);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка загрузки новостей');
  return json as NewsItem[];
}

export async function apiGetNewsItem(id: number | string): Promise<NewsItem> {
  const res = await fetch(`${URLS.news}?id=${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Новость не найдена');
  return json as NewsItem;
}

export async function apiGetAllNewsAdmin(): Promise<NewsItem[]> {
  const res = await fetch(URLS.news, { headers: { 'x-admin-token': ADMIN_TOKEN } });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка загрузки новостей');
  return json as NewsItem[];
}

export async function apiCreateNews(data: {
  title: string; excerpt?: string; content: string; image_url?: string;
  published_at?: string; is_published?: boolean;
}): Promise<NewsItem> {
  const res = await fetch(URLS.news, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка создания новости');
  return json as NewsItem;
}

export async function apiUpdateNews(data: {
  id: number; title?: string; excerpt?: string; content?: string; image_url?: string;
  published_at?: string; is_published?: boolean;
}): Promise<NewsItem> {
  const res = await fetch(URLS.news, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка обновления новости');
  return json as NewsItem;
}

export async function apiDeleteNews(id: number): Promise<void> {
  const res = await fetch(URLS.news, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify({ id }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка удаления новости');
}

export interface AppNotification {
  id: number;
  phone: string;
  ref_number: string | null;
  type: 'status' | 'comment' | 'support' | string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export async function apiGetNotifications(phone: string): Promise<AppNotification[]> {
  const res = await fetch(`${URLS.notifications}?phone=${encodeURIComponent(phone)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка загрузки уведомлений');
  return json as AppNotification[];
}

export async function apiMarkNotificationsRead(phone: string, ids?: number[]): Promise<void> {
  const res = await fetch(URLS.notifications, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'mark_read', phone, ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка');
}