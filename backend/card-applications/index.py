"""Заявки на виртуальную карту (кошелёк): клиент подаёт заявку, админ меняет статус, лимит, срок, ставку, пересчитывает график; клиенту уходит письмо по статусу."""
import json
import os
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
        'admin_comment', 'created_at', 'updated_at']

STATUS_MAIL = {
    'new': ('Заявка на карту принята', 'Ваша заявка на виртуальную карту принята и поставлена в очередь на рассмотрение.'),
    'review': ('Заявка на карту на рассмотрении', 'Ваша заявка на виртуальную карту взята в работу. Мы свяжемся с вами после принятия решения.'),
    'approved': ('Заявка на карту одобрена', 'Ваша заявка на виртуальную карту одобрена.'),
    'issued': ('Виртуальная карта открыта', 'Ваша виртуальная карта открыта и доступна в кошельке личного кабинета.'),
    'rejected': ('По заявке на карту принято отрицательное решение', 'К сожалению, по вашей заявке на виртуальную карту принято отрицательное решение.'),
}


def row_to_dict(row):
    d = dict(zip(COLS, row))
    for k in ('created_at', 'updated_at'):
        if d.get(k):
            d[k] = d[k].isoformat()
    if d.get('rate_percent') is not None:
        d['rate_percent'] = float(d['rate_percent'])
    return d


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
            term = body.get('term_months', old['term_months'])
            term = int(term) if term not in (None, '') else None
            rate = body.get('rate_percent', old['rate_percent'])
            rate = float(rate) if rate not in (None, '') else None
            comment = body.get('admin_comment', old['admin_comment'])
            schedule = old['schedule']
            if body.get('recalc') or (limit and term and schedule is None):
                schedule = build_schedule(limit or 0, term or 0, rate or 0)
            cur.execute(
                f"""UPDATE {SCHEMA}.card_applications SET status=%s, approved_limit=%s, term_months=%s,
                    rate_percent=%s, admin_comment=%s, schedule=%s, updated_at=NOW() WHERE id=%s""",
                (status, limit, term, rate, comment, json.dumps(schedule) if schedule is not None else None, app_id))
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
