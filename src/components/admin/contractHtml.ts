import { type UserSession } from '@/lib/api';

const fmt = (n: number) => n.toLocaleString('ru-RU');

export function buildContractHtml(
  selected: UserSession,
  amt: number,
  dys: number,
  contractCode: string,
  returnDate: string,
): string {
  const overpay = Math.round(amt * 0.008 * dys);
  const total = amt + overpay;

  const style = [
    'body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#111;font-size:13px;line-height:1.6}',
    'h1{font-size:18px;text-align:center;margin-bottom:4px}',
    'h2{font-size:14px;margin-top:24px;border-bottom:1px solid #ccc;padding-bottom:4px}',
    'p{margin:4px 0}',
    '.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee}',
    '.label{color:#666}',
    '.val{font-weight:bold}',
    '.total{font-size:15px;color:#1a56db}',
    '.sign{margin-top:40px;display:flex;justify-content:space-between}',
    '.sign-box{text-align:center;width:45%}',
    '.sign-line{border-top:1px solid #111;margin-top:30px;padding-top:4px;font-size:11px;color:#666}',
  ].join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Договор займа ${contractCode}</title>
<style>${style}</style>
</head>
<body>
<h1>ДОГОВОР ЗАЙМА</h1>
<p style="text-align:center;color:#666">${contractCode} &nbsp;·&nbsp; от ${selected.created_at?.slice(0, 10)}</p>
<h2>Стороны</h2>
<p><b>Займодавец:</b> ООО МКК «Займы Плюс»</p>
<p><b>Заёмщик:</b> ${selected.full_name}, тел. ${selected.phone}</p>
<h2>Условия займа</h2>
<div class="row"><span class="label">Сумма займа</span><span class="val">${fmt(amt)} ₽</span></div>
<div class="row"><span class="label">Срок</span><span class="val">${dys} дней</span></div>
<div class="row"><span class="label">Процентная ставка</span><span class="val">0.8% в день</span></div>
<div class="row"><span class="label">Начисленные проценты</span><span class="val">${fmt(overpay)} ₽</span></div>
<div class="row"><span class="label">Дата возврата</span><span class="val">${returnDate}</span></div>
<div class="row"><span class="label total">Итого к возврату</span><span class="val total">${fmt(total)} ₽</span></div>
<h2>Реквизиты заявки</h2>
<p>Номер заявки: <b>${selected.ref_number}</b></p>
<p>Паспорт: <b>${selected.passport || '—'}</b></p>
<div class="sign">
  <div class="sign-box"><div class="sign-line">Займодавец / ООО МКК «Займы Плюс»</div></div>
  <div class="sign-box"><div class="sign-line">Заёмщик / ${selected.full_name}</div></div>
</div>
</body>
</html>`;
}
