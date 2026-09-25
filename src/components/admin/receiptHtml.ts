import { type UserSession } from '@/lib/api';
import { DEFAULT_COMPANY_NAME, DEFAULT_COMPANY_INN, DEFAULT_COMPANY_OGRN } from './contractHtml';

const fmt = (n: number) => n.toLocaleString('ru-RU');

export type ReceiptType = 'money_sent' | 'repaid';

export const RECEIPT_TITLES: Record<ReceiptType, string> = {
  money_sent: 'Чек о выдаче займа',
  repaid: 'Чек о погашении займа',
};

export function buildReceiptHtml(
  selected: UserSession,
  receiptType: ReceiptType,
  receiptNumber: string,
  amount: number,
  companyName: string = DEFAULT_COMPANY_NAME,
  companyInn: string = DEFAULT_COMPANY_INN,
  companyOgrn: string = DEFAULT_COMPANY_OGRN,
  companyPhone?: string,
): string {
  const isSent = receiptType === 'money_sent';
  const title = RECEIPT_TITLES[receiptType];
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU');
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const style = [
    'body{font-family:Arial,sans-serif;max-width:520px;margin:32px auto;color:#111;font-size:13px;line-height:1.6}',
    'h1{font-size:17px;text-align:center;margin:0 0 4px}',
    '.sub{text-align:center;color:#666;font-size:12px;margin:0 0 20px}',
    '.badge{display:block;margin:0 auto 18px;width:56px;height:56px;border-radius:50%;text-align:center;line-height:56px;font-size:26px;color:#fff}',
    '.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}',
    '.label{color:#666}',
    '.val{font-weight:bold;text-align:right}',
    '.total{font-size:16px}',
    '.total .val{color:#1a56db}',
    '.footer{margin-top:24px;text-align:center;color:#888;font-size:11px;border-top:1px solid #eee;padding-top:14px}',
    '.company{margin-top:18px;padding-top:14px;border-top:1px dashed #ccc;font-size:11px;color:#666;text-align:center}',
  ].join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${title} ${receiptNumber}</title>
<style>${style}</style>
</head>
<body>
<div class="badge" style="background:${isSent ? '#16a34a' : '#1a56db'}">${isSent ? '✓' : '₽'}</div>
<h1>${title}</h1>
<p class="sub">№ ${receiptNumber} &nbsp;·&nbsp; ${dateStr} ${timeStr}</p>

<div class="row"><span class="label">Заёмщик</span><span class="val">${selected.full_name}</span></div>
<div class="row"><span class="label">Телефон</span><span class="val">${selected.phone}</span></div>
${selected.email ? `<div class="row"><span class="label">Email</span><span class="val">${selected.email}</span></div>` : ''}
<div class="row"><span class="label">Номер заявки</span><span class="val">${selected.ref_number}</span></div>
<div class="row"><span class="label">${isSent ? 'Сумма выданного займа' : 'Сумма погашения'}</span><span class="val">${fmt(amount)} ₽</span></div>
<div class="row total"><span class="label">${isSent ? 'К возврату' : 'Статус'}</span><span class="val">${isSent ? `${fmt(Math.round(amount * 0.008 * selected.days) + amount)} ₽` : 'Займ погашен полностью'}</span></div>

<div class="company">
  <b>${companyName}</b><br>
  ИНН ${companyInn} · ОГРН ${companyOgrn}
  ${companyPhone ? `<br>Тел.: ${companyPhone}` : ''}
</div>

<p class="footer">Документ сформирован автоматически и не требует подписи.<br>Сохраните его как подтверждение операции по договору займа.</p>
</body>
</html>`;
}
