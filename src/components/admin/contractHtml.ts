import { type UserSession } from '@/lib/api';

const fmt = (n: number) => n.toLocaleString('ru-RU');

export function buildContractHtml(
  selected: UserSession,
  amt: number,
  dys: number,
  contractCode: string,
  returnDate: string,
  signatureCode?: string,
): string {
  const overpay = Math.round(amt * 0.008 * dys);
  const insurance = selected.insurance_enabled ? Math.round(356 + amt * 0.005) : 0;
  const total = amt + overpay + insurance;

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
<p><b>Заёмщик:</b> ${selected.full_name}, тел. ${selected.phone}${selected.email ? `, email: ${selected.email}` : ''}</p>
<h2>Условия займа</h2>
<div class="row"><span class="label">Сумма займа</span><span class="val">${fmt(amt)} ₽</span></div>
<div class="row"><span class="label">Срок</span><span class="val">${dys} дней</span></div>
<div class="row"><span class="label">Процентная ставка</span><span class="val">0.8% в день</span></div>
<div class="row"><span class="label">Начисленные проценты</span><span class="val">${fmt(overpay)} ₽</span></div>
${selected.insurance_enabled ? `<div class="row"><span class="label">Страховка займа</span><span class="val">${fmt(insurance)} ₽</span></div>` : ''}
<div class="row"><span class="label">Дата возврата</span><span class="val">${returnDate}</span></div>
<div class="row"><span class="label total">Итого к возврату</span><span class="val total">${fmt(total)} ₽</span></div>
<h2>Реквизиты заявки</h2>
<p>Номер заявки: <b>${selected.ref_number}</b></p>
<p>Паспорт: <b>${selected.passport || '—'}</b></p>
<h2>Общие условия договора потребительского займа</h2>
<p>ООО «МКК «Займы плюс»</p>
<p><b>Сторона (Стороны)</b> – Заемщик и Кредитор, упоминаемые по отдельности или вместе; Иные термины и выражения, используемые в настоящем документе, имеют значение, которое придается им в соответствующих законах и иных нормативных актах Российской Федерации.</p>
<p><b>ОБЩИЕ ПОЛОЖЕНИЯ</b></p>
<p>1. Общие условия устанавливаются Кредитором в одностороннем порядке в целях многократного применения.</p>
<p>2. Общие условия договора определяют права и обязанности Сторон в процессе заключения, исполнения, изменения и прекращения Договора займа. Общие условия договора наряду с Индивидуальными условиями договора являются неотъемлемой частью Договора займа.</p>
<p>3. Порядок заключения Договора займа описан в Правилах. Договор займа считается заключенным Сторонами с момента предоставления Заемщику суммы Займа.</p>
<p>4. Кредитор вправе в одностороннем порядке вносить изменения в Общие условия договора при условии, что соответствующие изменения не повлекут за собой возникновение новых или увеличение размера существующих денежных обязательств Заемщика по Договору займа. В случае внесения изменений в Общие условия договора они становятся обязательными для Сторон со дня размещения новой редакции Общих условий договора на Сайте по адресу займы-плюс.РФ.</p>
<p><b>ПРОЦЕНТЫ ЗА ПОЛЬЗОВАНИЕ ЗАЙМОМ</b></p>
<p>5. Заемщик обязан вернуть сумму Займа, а также уплатить начисленные на нее проценты в соответствии с условиями Договора займа. Процентная ставка по Договору займа, а также порядок начисления процентов определяется Индивидуальными условиями договора потребительского займа. Займодавец вправе в любой срок в одностороннем порядке приостановить начисление процентов по займу, при этом данное право является прерогативой Займодавца и не зависит от воли Заемщика.</p>
<p>6. При расчете процентов за пользование Займом количество дней в году принимается равным количеству календарных дней 365.</p>
<p>7. Днем предоставления Займа Заемщику считается день окончательности перевода денежных средств на счет получателя средств (Заемщика).</p>
<p><b>ПОРЯДОК ИСПОЛНЕНИЯ ОБЯЗАТЕЛЬСТВ ПО ДОГОВОРУ ЗАЙМА</b></p>
<p>8. Моментом исполнения обязательств Заемщика перед Кредитором считается дата зачисления денежных средств на расчетный счет Кредитора.</p>
<p>9. В случае выявления Кредитором излишне уплаченных денежных средств по Договору займа, на Зарегистрированный адрес электронной почты Заемщика направляется уведомление о наличии переплаты. С момента получения указанного уведомления Заемщику необходимо направить на официальную почту Кредитора банковские реквизиты для возврата излишне уплаченных денежных средств. Излишне уплаченные денежные средства перечисляются по реквизитам, указанным Заемщиком, в течение 10 (десяти) рабочих дней с момента предоставления сведений о банковских реквизитах Заемщика на официальную почту Кредитора. Начисление процентов за пользование излишне перечисленными денежными средствами не осуществляется.</p>
<p>10. Заемщик выражает свое безусловное согласие (акцепт) на списание Кредитором либо по поручению Кредитора партнером суммы всей или части Задолженности с Карты Заемщика.</p>
${selected.insurance_enabled ? `<p><b>СТРАХОВАНИЕ ЗАЙМА</b></p><p>11. Заемщик подключил услугу добровольного страхования займа. Стоимость страховки составляет <b>${fmt(insurance)} ₽</b> и включена в общую сумму к возврату. Страховка обеспечивает защиту Заемщика в случае наступления страхового события, предусмотренного условиями страхования.</p>` : ''}
${signatureCode ? `<div style="margin-top:32px;border:1px solid #ccc;border-radius:8px;padding:12px;background:#f9fafb;text-align:center"><p style="color:#666;font-size:11px;margin:0 0 4px">Код электронной подписи</p><p style="font-family:monospace;font-size:18px;font-weight:bold;letter-spacing:4px;color:#1a56db;margin:0">${signatureCode}</p><p style="color:#666;font-size:10px;margin:4px 0 0">Подтверждает согласие заёмщика с условиями договора</p></div>` : ''}
<div class="sign">
  <div class="sign-box"><div class="sign-line">Займодавец / ООО МКК «Займы Плюс»</div></div>
  <div class="sign-box"><div class="sign-line">Заёмщик / ${selected.full_name}</div></div>
</div>
</body>
</html>`;
}