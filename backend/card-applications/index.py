"""Заявки на виртуальную карту (кошелёк): клиент подаёт заявку, админ меняет статус, лимит, срок, ставку, пересчитывает график; клиенту уходит письмо по статусу."""
import json
import os
import random
import smtplib
from datetime import date
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, formataddr
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'
SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465
BRAND = 'Частные займы плюс'
MAX_LIMIT = 270000
STATUSES = ('new', 'review', 'approved', 'issued', 'rejected')
COLS = ['id', 'ref_number', 'phone', 'full_name', 'email', 'birth_date', 'passport', 'address', 'work_place',
        'income', 'requested_limit', 'approved_limit', 'term_months', 'rate_percent', 'schedule', 'status',
        'admin_comment', 'created_at', 'updated_at', 'card_number', 'card_expiry', 'card_holder', 'card_cvv', 'spent_amount', 'rejected_at']

STATUS_MAIL = {
    'new': ('Заявка на карту принята', 'Ваша заявка на виртуальную карту принята и поставлена в очередь на рассмотрение.'),
    'review': ('Заявка на карту на рассмотрении', 'Ваша заявка на виртуальную карту взята в работу. Мы свяжемся с вами после принятия решения.'),
    'approved': ('Заявка на карту одобрена', 'Ваша заявка на виртуальную карту одобрена.'),
    'issued': ('Виртуальная карта открыта', 'Ваша виртуальная карта открыта и доступна в кошельке личного кабинета.'),
    'rejected': ('По заявке на карту принято отрицательное решение', 'К сожалению, по вашей заявке на виртуальную карту принято отрицательное решение.'),
}


def row_to_dict(row):
    d = dict(zip(COLS, row))
    for k in ('created_at', 'updated_at', 'rejected_at'):
        if d.get(k):
            d[k] = d[k].isoformat()
    if d.get('rate_percent') is not None:
        d['rate_percent'] = float(d['rate_percent'])
    return d


TRANSLIT = dict(zip('абвгдеёжзийклмнопрстуфхцчшщъыьэюя', ['A','B','V','G','D','E','E','ZH','Z','I','Y','K','L','M','N','O','P','R','S','T','U','F','KH','TS','CH','SH','SHCH','','Y','','E','YU','YA']))


def translit(name: str) -> str:
    parts = name.lower().split()
    parts = parts[:2] if len(parts) > 1 else parts
    parts = [parts[1], parts[0]] if len(parts) == 2 else parts
    return ' '.join(''.join(TRANSLIT.get(c, c.upper() if c.isascii() and c.isalpha() else '') for c in p) for p in parts)[:26]


def gen_card_number() -> str:
    digits = [2, 2, 0, 0] + [random.randint(0, 9) for _ in range(11)]
    total = 0
    for i, d in enumerate(reversed(digits)):
        if i % 2 == 0:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    digits.append((10 - total % 10) % 10)
    s = ''.join(map(str, digits))
    return ' '.join(s[i:i + 4] for i in range(0, 16, 4))


def gen_card_expiry() -> str:
    t = date.today()
    return f"{t.month:02d}/{(t.year + 3) % 100:02d}"


def build_schedule(amount: int, months: int, rate: float) -> list:
    """Аннуитетный график платежей."""
    if not amount or not months:
        return []
    r = (rate or 0) / 100 / 12
    pay = amount / months if r == 0 else amount * r / (1 - (1 + r) ** -months)
    balance = float(amount)
    today = date.today()
    out = []
    for i in range(1, months + 1):
        interest = balance * r
        principal = pay - interest if i < months else balance
        payment = principal + interest
        balance = max(balance - principal, 0)
        m = today.month - 1 + i
        d = date(today.year + m // 12, m % 12 + 1, min(today.day, 28))
        out.append({'n': i, 'date': d.isoformat(), 'payment': round(payment, 2), 'principal': round(principal, 2),
                    'interest': round(interest, 2), 'balance': round(balance, 2)})
    return out


def send_status_email(to_email, status, app):
    if not to_email or status not in STATUS_MAIL:
        return
    subject, text = STATUS_MAIL[status]
    lines = [text]
    if status in ('approved', 'issued'):
        if app.get('card_number'):
            lines.append(f"Карта: {app['card_number']}, срок действия {app['card_expiry']}")
        lines.append(f"Лимит: {int(app.get('approved_limit') or 0):,} ₽".replace(',', ' '))
        if app.get('term_months'):
            lines.append(f"Срок: {app['term_months']} мес.")
        if app.get('rate_percent') is not None:
            lines.append(f"Ставка: {app['rate_percent']}% годовых")
        if app.get('schedule'):
            rows = ''.join(
                f"<tr><td style='padding:4px 8px'>{s['n']}</td><td style='padding:4px 8px'>{s['date']}</td>"
                f"<td style='padding:4px 8px;text-align:right'>{s['payment']:,.2f} ₽</td></tr>".replace(',', ' ')
                for s in app['schedule'])
            lines.append("<table style='border-collapse:collapse;font-size:13px'><tr><th>№</th><th>Дата</th><th>Платёж</th></tr>" + rows + "</table>")
    if app.get('admin_comment'):
        lines.append(f"Комментарий: {app['admin_comment']}")
    body = '<br>'.join(lines)
    html = (f'<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">'
            f'<h2 style="color:#1a2b4c;">{BRAND}</h2><div style="color:#333;font-size:14px;line-height:1.6;">'
            f'Здравствуйте, {app["full_name"]}!<br><br>{body}</div>'
            f'<p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:12px;margin-top:20px;">С уважением, Займы-плюс.рф</p></div>')
    login = os.environ['SMTP_LOGIN']
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = formataddr((BRAND, login))
    msg['To'] = to_email
    msg['Date'] = formatdate(localtime=True)
    msg.attach(MIMEText(subject + '\n' + text, 'plain', 'utf-8'))
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as s:
            s.login(login, os.environ['SMTP_PASSWORD'])
            s.sendmail(login, [to_email], msg.as_string())
    except Exception as e:
        print(f'[card-applications] mail failed: {e}')


def notify(cur, app, status):
    if status not in STATUS_MAIL:
        return
    title, text = STATUS_MAIL[status]
    cur.execute(f"INSERT INTO {SCHEMA}.notifications (phone, ref_number, type, title, message) VALUES (%s,%s,%s,%s,%s)",
                (app['phone'], app['ref_number'], 'info', title, text))


TX_COLS = ['id', 'application_id', 'phone', 'tx_type', 'method', 'amount', 'target', 'bank', 'status',
           'admin_comment', 'created_at', 'updated_at']
TX_STATUSES = ('processing', 'error', 'success')
TX_SELECT = f"SELECT {', '.join(TX_COLS)} FROM {SCHEMA}.card_transactions"


def tx_to_dict(row):
    d = dict(zip(TX_COLS, row))
    for k in ('created_at', 'updated_at'):
        if d.get(k):
            d[k] = d[k].isoformat()
    return d


DEFAULT_DESIGN = {
    'brand_name': BRAND, 'primary_color': '#1a2b4c', 'accent_color': '#f2f4f8', 'logo_url': '',
    'signature': 'С уважением,\nЗаймы-плюс.рф\nРежим работы с 09:00 до 18:00 по мск.', 'layout': 'classic',
}
DEFAULT_TX_EMAILS = {
    'processing': {'subject': '{type}: идёт перевод', 'body': '{type} на сумму {amount} ₽ принят в обработку. Статус: {status}. Мы сообщим, когда операция завершится.'},
    'success': {'subject': '{type}: успешно', 'body': '{type} на сумму {amount} ₽ выполнен. Статус: {status}.'},
    'error': {'subject': '{type}: ошибка перевода', 'body': '{type} на сумму {amount} ₽ не выполнен. Статус: {status}. {reason}'},
}
TX_TYPE_LABEL = {'topup': 'Пополнение карты', 'withdraw': 'Вывод средств'}
TX_STATUS_LABEL = {'processing': 'Идёт перевод', 'error': 'Ошибка перевода', 'success': 'Успешно'}


def get_email_settings(cur) -> dict:
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key = 'system_email_templates'")
    row = cur.fetchone()
    try:
        return json.loads(row[0]) if row else {}
    except Exception:
        return {}


def wrap_html(design: dict, body: str) -> str:
    sig = (design.get('signature') or '').replace('\n', '<br>')
    sig_html = f'<p style="color:#888;font-size:12px;margin:20px 0 0;border-top:1px solid #eee;padding-top:12px;">{sig}</p>' if sig else ''
    logo = f'<img src="{design["logo_url"]}" alt="" style="max-height:44px;margin:0 0 12px;display:block;" />' if design.get('logo_url') else ''
    layout = design.get('layout', 'classic')
    inner = f'<div style="color:#333;font-size:14px;line-height:1.6;">{body}</div>{sig_html}'
    if layout == 'header':
        return (f'<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #eee;border-radius:14px;overflow:hidden;">'
                f'<div style="background:{design["primary_color"]};padding:22px;text-align:center;"><h2 style="color:#fff;margin:0;font-size:18px;">{design["brand_name"]}</h2></div>'
                f'<div style="padding:24px;background:#fff;">{inner}</div></div>')
    if layout == 'card':
        return (f'<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:30px 26px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;text-align:center;">'
                f'{logo}<h2 style="color:{design["primary_color"]};margin:0 0 14px;">{design["brand_name"]}</h2>{inner}</div>')
    return (f'<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">'
            f'{logo}<h2 style="color:{design["primary_color"]};">{design["brand_name"]}</h2>{inner}</div>')


def send_html(to_email: str, subject: str, html: str, brand: str) -> None:
    login = os.environ['SMTP_LOGIN']
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = formataddr((brand, login))
    msg['To'] = to_email
    msg['Date'] = formatdate(localtime=True)
    import re
    msg.attach(MIMEText(re.sub(r'<[^>]+>', '', html.replace('<br>', '\n')), 'plain', 'utf-8'))
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as s:
        s.login(login, os.environ['SMTP_PASSWORD'])
        s.sendmail(login, [to_email], msg.as_string())


def notify_tx(cur, tx: dict, email: str):
    settings = get_email_settings(cur)
    design = {**DEFAULT_DESIGN, **(settings.get('design') or {})}
    tpl = {**DEFAULT_TX_EMAILS.get(tx['status'], {}), **((settings.get('card_tx_emails') or {}).get(tx['status']) or {})}
    amount = f"{tx['amount']:,}".replace(',', ' ')
    reason = (tx.get('admin_comment') or '') if tx['status'] == 'error' else ''
    def fill(t: str) -> str:
        return (t.replace('{amount}', amount).replace('{type}', TX_TYPE_LABEL.get(tx['tx_type'], ''))
                .replace('{status}', TX_STATUS_LABEL.get(tx['status'], '')).replace('{reason}', reason).strip())
    subject, body = fill(tpl.get('subject', '')), fill(tpl.get('body', ''))
    plain = body.replace('<br>', ' ')
    import re
    plain = re.sub(r'<[^>]+>', '', plain)
    cur.execute(f"INSERT INTO {SCHEMA}.notifications (phone, type, title, message) VALUES (%s,%s,%s,%s)",
                (tx['phone'], 'info', subject, f"{amount} ₽ · {TX_STATUS_LABEL.get(tx['status'], '')}. {plain}"[:500]))
    if email:
        try:
            send_html(email, subject, wrap_html(design, body), design['brand_name'])
        except Exception as e:
            print(f'[card-applications] tx mail failed: {e}')


def resp(code, headers, data):
    return {'statusCode': code, 'headers': headers, 'body': json.dumps(data, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Клиент: GET ?phone= — свои заявки, POST — подать заявку. Админ (x-admin-token): GET — все, POST action=update."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    is_admin = req_headers.get('x-admin-token') == ADMIN_TOKEN
    params = event.get('queryStringParameters') or {}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    sel = f"SELECT {', '.join(COLS)} FROM {SCHEMA}.card_applications"
    try:
        if event.get('httpMethod') == 'GET' and params.get('tx'):
            if is_admin:
                cur.execute(TX_SELECT + " ORDER BY created_at DESC LIMIT 500")
            else:
                phone = params.get('phone')
                if not phone:
                    return resp(400, headers, {'error': 'phone обязателен'})
                cur.execute(TX_SELECT + " WHERE phone = %s ORDER BY created_at DESC LIMIT 30", (phone,))
            return resp(200, headers, [tx_to_dict(r) for r in cur.fetchall()])

        if event.get('httpMethod') == 'GET':
            if is_admin:
                cur.execute(sel + " ORDER BY created_at DESC LIMIT 500")
            else:
                phone = params.get('phone')
                if not phone:
                    return resp(400, headers, {'error': 'phone обязателен'})
                cur.execute(sel + " WHERE phone = %s ORDER BY created_at DESC LIMIT 20", (phone,))
            return resp(200, headers, [row_to_dict(r) for r in cur.fetchall()])

        body = json.loads(event.get('body') or '{}')

        if body.get('action') == 'tx_create':
            phone = (body.get('phone') or '').strip()
            cur.execute(sel + " WHERE id = %s AND phone = %s AND status = 'issued'", (body.get('application_id'), phone))
            row = cur.fetchone()
            if not row:
                return resp(404, headers, {'error': 'Карта не найдена'})
            app = row_to_dict(row)
            tx_type = body.get('tx_type')
            method = body.get('method')
            try:
                amount = int(body.get('amount') or 0)
            except (TypeError, ValueError):
                amount = 0
            if tx_type not in ('topup', 'withdraw') or method not in ('sbp', 'card') or amount < 100:
                return resp(400, headers, {'error': 'Минимальная сумма операции 100 ₽'})
            target = ''.join(ch for ch in (body.get('target') or '') if ch.isdigit() or ch == '+')
            if tx_type == 'withdraw':
                need = 11 if method == 'sbp' else 16
                if len(target.replace('+', '')) != need:
                    return resp(400, headers, {'error': 'Неверный номер телефона' if method == 'sbp' else 'Номер карты должен содержать 16 цифр'})
                cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {SCHEMA}.card_transactions WHERE application_id=%s AND tx_type='withdraw' AND status='processing'", (app['id'],))
                reserved = cur.fetchone()[0]
                available = (app['approved_limit'] or 0) - (app['spent_amount'] or 0) - reserved
                if amount > available:
                    return resp(400, headers, {'error': f'Недостаточно средств. Доступно {max(available, 0)} ₽'})
            cur.execute(
                f"""INSERT INTO {SCHEMA}.card_transactions (application_id, phone, tx_type, method, amount, target, bank)
                    VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING {', '.join(TX_COLS)}""",
                (app['id'], phone, tx_type, method, amount, target or None, body.get('bank')))
            tx = tx_to_dict(cur.fetchone())
            conn.commit()
            return resp(201, headers, tx)

        if body.get('action') == 'tx_update':
            if not is_admin:
                return resp(403, headers, {'error': 'Нет доступа'})
            status = body.get('status')
            if status not in TX_STATUSES:
                return resp(400, headers, {'error': 'Неверный статус'})
            cur.execute(f"SELECT {', '.join(TX_COLS)}, applied FROM {SCHEMA}.card_transactions WHERE id = %s", (body.get('id'),))
            row = cur.fetchone()
            if not row:
                return resp(404, headers, {'error': 'Операция не найдена'})
            tx = tx_to_dict(row[:-1])
            applied = row[-1]
            comment = body.get('admin_comment', tx['admin_comment'])
            if status == 'success' and not applied:
                delta = tx['amount'] if tx['tx_type'] == 'withdraw' else -tx['amount']
                cur.execute(f"UPDATE {SCHEMA}.card_applications SET spent_amount = GREATEST(LEAST(spent_amount + %s, COALESCE(approved_limit, spent_amount + %s)), 0), updated_at=NOW() WHERE id = %s", (delta, delta, tx['application_id']))
                applied = True
            elif status != 'success' and applied:
                delta = -tx['amount'] if tx['tx_type'] == 'withdraw' else tx['amount']
                cur.execute(f"UPDATE {SCHEMA}.card_applications SET spent_amount = GREATEST(LEAST(spent_amount + %s, COALESCE(approved_limit, spent_amount + %s)), 0), updated_at=NOW() WHERE id = %s", (delta, delta, tx['application_id']))
                applied = False
            cur.execute(f"UPDATE {SCHEMA}.card_transactions SET status=%s, admin_comment=%s, applied=%s, updated_at=NOW() WHERE id=%s", (status, comment, applied, tx['id']))
            conn.commit()
            cur.execute(TX_SELECT + " WHERE id = %s", (tx['id'],))
            new_tx = tx_to_dict(cur.fetchone())
            if status != tx['status']:
                cur.execute(f"SELECT email FROM {SCHEMA}.card_applications WHERE id = %s", (tx['application_id'],))
                er = cur.fetchone()
                notify_tx(cur, new_tx, er[0] if er else None)
                conn.commit()
            return resp(200, headers, new_tx)

        if body.get('action') == 'update':
            if not is_admin:
                return resp(403, headers, {'error': 'Нет доступа'})
            app_id = body.get('id')
            cur.execute(sel + " WHERE id = %s", (app_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, headers, {'error': 'Заявка не найдена'})
            old = row_to_dict(row)
            status = body.get('status', old['status'])
            if status not in STATUSES:
                return resp(400, headers, {'error': 'Неверный статус'})
            limit = body.get('approved_limit', old['approved_limit'])
            limit = int(limit) if limit not in (None, '') else None
            if limit is not None and (limit < 0 or limit > MAX_LIMIT):
                return resp(400, headers, {'error': f'Лимит не может превышать {MAX_LIMIT} ₽'})
            spent = body.get('spent_amount', old['spent_amount'])
            spent = int(spent) if spent not in (None, '') else 0
            if spent < 0 or (limit is not None and spent > limit):
                return resp(400, headers, {'error': 'Потрачено не может быть больше лимита или меньше нуля'})
            term = body.get('term_months', old['term_months'])
            term = int(term) if term not in (None, '') else None
            rate = body.get('rate_percent', old['rate_percent'])
            rate = float(rate) if rate not in (None, '') else None
            comment = body.get('admin_comment', old['admin_comment'])
            schedule = old['schedule']
            if body.get('recalc') or (limit and term and schedule is None):
                schedule = build_schedule(limit or 0, term or 0, rate or 0)
            if status == 'issued' and not old.get('card_number'):
                while True:
                    num = gen_card_number()
                    cur.execute(f"SELECT 1 FROM {SCHEMA}.card_applications WHERE card_number = %s", (num,))
                    if not cur.fetchone():
                        break
                cur.execute(f"UPDATE {SCHEMA}.card_applications SET card_number=%s, card_expiry=%s, card_holder=%s, card_cvv=%s WHERE id=%s",
                            (num, gen_card_expiry(), translit(old['full_name']), f"{random.randint(0, 999):03d}", app_id))
            elif status == 'issued' and not old.get('card_cvv'):
                cur.execute(f"UPDATE {SCHEMA}.card_applications SET card_cvv=%s WHERE id=%s", (f"{random.randint(0, 999):03d}", app_id))
            cur.execute(
                f"""UPDATE {SCHEMA}.card_applications SET status=%s, approved_limit=%s, term_months=%s,
                    rate_percent=%s, admin_comment=%s, spent_amount=%s, schedule=%s, updated_at=NOW(),
                    rejected_at = CASE WHEN %s = 'rejected' THEN COALESCE(rejected_at, NOW()) ELSE NULL END WHERE id=%s""",
                (status, limit, term, rate, comment, spent, json.dumps(schedule) if schedule is not None else None, status, app_id))
            conn.commit()
            cur.execute(sel + " WHERE id = %s", (app_id,))
            new = row_to_dict(cur.fetchone())
            if status != old['status'] or body.get('send_email'):
                notify(cur, new, status)
                conn.commit()
                send_status_email(new['email'], status, new)
            return resp(200, headers, new)

        # Создание заявки клиентом
        phone = (body.get('phone') or '').strip()
        full_name = (body.get('full_name') or '').strip()
        try:
            req_limit = int(body.get('requested_limit') or 0)
        except (TypeError, ValueError):
            req_limit = 0
        if not phone or not full_name or not body.get('passport') or not body.get('address'):
            return resp(400, headers, {'error': 'Заполните ФИО, паспорт и адрес'})
        if req_limit < 1000 or req_limit > MAX_LIMIT:
            return resp(400, headers, {'error': f'Лимит от 1 000 до {MAX_LIMIT} ₽'})
        cur.execute(f"SELECT status FROM {SCHEMA}.loan_requests WHERE ref_number = %s AND phone = %s", (body.get('ref_number') or '', phone))
        lr = cur.fetchone()
        if not lr or lr[0] not in ('repaid', 'rejected'):
            return resp(403, headers, {'error': 'Оформить карту можно после погашения займа или при отклонённой заявке'})
        cur.execute(f"SELECT COALESCE(rejected_at, updated_at) FROM {SCHEMA}.card_applications WHERE phone = %s AND status = 'rejected' ORDER BY COALESCE(rejected_at, updated_at) DESC LIMIT 1", (phone,))
        rj = cur.fetchone()
        if rj and rj[0]:
            cur.execute("SELECT EXTRACT(DAY FROM NOW() - %s)", (rj[0],))
            passed = int(cur.fetchone()[0] or 0)
            if passed < 45:
                return resp(403, headers, {'error': f'Повторная подача возможна через {45 - passed} дн.'})
        cur.execute(sel + " WHERE phone = %s AND status IN ('new','review') LIMIT 1", (phone,))
        if cur.fetchone():
            return resp(409, headers, {'error': 'У вас уже есть заявка на рассмотрении'})
        cur.execute(
            f"""INSERT INTO {SCHEMA}.card_applications (ref_number, phone, full_name, email, birth_date, passport,
                address, work_place, income, requested_limit) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING {', '.join(COLS)}""",
            (body.get('ref_number') or '', phone, full_name, body.get('email'), body.get('birth_date'),
             body.get('passport'), body.get('address'), body.get('work_place'),
             int(body['income']) if body.get('income') else None, req_limit))
        new = row_to_dict(cur.fetchone())
        conn.commit()
        send_status_email(new['email'], 'new', new)
        return resp(201, headers, new)
    finally:
        conn.close()
