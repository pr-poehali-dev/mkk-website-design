"""Вход клиента по телефону и паролю. Смена пароля."""
import json
import os
import hashlib
import re
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.utils import formatdate, formataddr

SCHEMA = os.environ['MAIN_DB_SCHEMA']

def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()

SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465
BRAND = 'Частные займы плюс'


def send_mail(to_email: str, subject: str, text: str) -> None:
    login = os.environ['SMTP_LOGIN']
    msg = MIMEText(text, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = formataddr((BRAND, login))
    msg['To'] = to_email
    msg['Date'] = formatdate(localtime=True)
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(login, os.environ['SMTP_PASSWORD'])
        server.sendmail(login, [to_email], msg.as_string())


def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    if body.get('action') == 'admin_set_password':
        admin_token = req_headers.get('x-admin-token', '')
        if admin_token != 'admin_zaimy_plus':
            return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}
        ref_number = body.get('ref_number', '').strip()
        new_password = body.get('new_password', '').strip()
        if not ref_number or not new_password:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Заполните все поля'})}
        if len(new_password) < 4:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Пароль должен быть не менее 4 символов'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        # Пароль меняется только у конкретной заявки (по ref_number), а не у всех заявок клиента с этим телефоном
        cur.execute(f"UPDATE {SCHEMA}.loan_requests SET password_hash = %s, password_plain = %s WHERE ref_number = %s", (hash_password(new_password), new_password, ref_number))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    if body.get('action') in ('admin_list_access_requests', 'admin_update_access_request'):
        if req_headers.get('x-admin-token', '') != 'admin_zaimy_plus':
            return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        if body['action'] == 'admin_update_access_request':
            req_id = int(body.get('id') or 0)
            status = body.get('status')
            comment = body.get('admin_comment')
            if status not in (None, 'new', 'approved', 'rejected'):
                conn.close()
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверный статус'})}
            cur.execute(f"SELECT ref_number, new_password_hash, status FROM {SCHEMA}.access_requests WHERE id = %s", (req_id,))
            row = cur.fetchone()
            if not row:
                conn.close()
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Обращение не найдено'})}
            sets = []
            vals = []
            if comment is not None:
                sets.append('admin_comment = %s')
                vals.append(str(comment).strip() or None)
            if status:
                sets.append('status = %s')
                vals.append(status)
                sets.append('processed_at = NOW()' if status != 'new' else 'processed_at = NULL')
                if status == 'approved' and row[2] != 'approved':
                    cur.execute(
                        f"UPDATE {SCHEMA}.loan_requests SET password_hash = %s, password_plain = NULL WHERE ref_number = %s",
                        (row[1], row[0])
                    )
            if sets:
                vals.append(req_id)
                cur.execute(f"UPDATE {SCHEMA}.access_requests SET {', '.join(sets)} WHERE id = %s", vals)
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}
        cur.execute(
            f"""SELECT a.id, a.ref_number, a.full_name, a.passport, a.snils, a.selfie_url, a.email, a.status,
                       a.created_at, a.admin_comment, a.processed_at, l.phone
                FROM {SCHEMA}.access_requests a
                LEFT JOIN LATERAL (SELECT phone FROM {SCHEMA}.loan_requests WHERE ref_number = a.ref_number LIMIT 1) l ON true
                ORDER BY a.created_at DESC"""
        )
        cols = ['id', 'ref_number', 'full_name', 'passport', 'snils', 'selfie_url', 'email', 'status', 'created_at', 'admin_comment', 'processed_at', 'phone']
        items = []
        for r in cur.fetchall():
            d = dict(zip(cols, r))
            d['created_at'] = d['created_at'].isoformat() if d['created_at'] else None
            d['processed_at'] = d['processed_at'].isoformat() if d['processed_at'] else None
            items.append(d)
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(items)}

    if body.get('action') == 'access_request':
        full_name = (body.get('full_name') or '').strip()
        new_password = (body.get('new_password') or '').strip()
        passport = re.sub(r'\D', '', body.get('passport') or '')
        snils = re.sub(r'\D', '', body.get('snils') or '')
        selfie_url = (body.get('selfie_url') or '').strip()
        if len(full_name.split()) < 2 or len(passport) != 10 or len(snils) != 11 or not selfie_url:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Заполните все поля и прикрепите селфи'})}
        if len(new_password) < 4:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Пароль должен быть не менее 4 символов'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"""SELECT ref_number, email, phone FROM {SCHEMA}.loan_requests
                WHERE regexp_replace(COALESCE(passport, ''), '[^0-9]', '', 'g') = %s
                ORDER BY created_at DESC LIMIT 1""",
            (passport,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Клиент с такими паспортными данными не найден'})}
        ref_number, client_email, client_phone = row
        cur.execute(
            f"""INSERT INTO {SCHEMA}.access_requests (ref_number, full_name, passport, snils, selfie_url, new_password_hash, email)
                VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (ref_number, full_name, passport, snils, selfie_url, hash_password(new_password), client_email)
        )
        conn.commit()
        conn.close()
        operator_text = (
            f"Новая заявка на смену пароля и номера телефона\n\n"
            f"Заявка клиента: {ref_number}\nФИО: {full_name}\nТелефон в системе: {client_phone}\n"
            f"Паспорт: {passport[:4]} {passport[4:]}\nСНИЛС: {snils}\nСелфи с паспортом: {selfie_url}\n"
        )
        try:
            send_mail(os.environ['SMTP_LOGIN'], f'Заявка на смену пароля {ref_number}', operator_text)
            if client_email:
                send_mail(
                    client_email,
                    'Номер телефона будет изменён',
                    f"Здравствуйте, {full_name}!\n\nМы получили вашу заявку на смену пароля. "
                    f"В связи с этим номер телефона, привязанный к вашему кабинету, будет изменён после проверки данных оператором. "
                    f"Если вы не отправляли эту заявку — срочно свяжитесь с нами.\n\nС уважением,\nЗаймы-плюс.рф"
                )
        except Exception as e:
            print(f'[loan-login] mail error: {e}')
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'email_sent': bool(client_email)})}

    if body.get('action') == 'change_password':
        phone = body.get('phone', '').strip()
        old_password = body.get('old_password', '').strip()
        new_password = body.get('new_password', '').strip()
        if not phone or not old_password or not new_password:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Заполните все поля'})}
        if len(new_password) < 4:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Новый пароль должен быть не менее 4 символов'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.loan_requests WHERE phone = %s AND password_hash = %s", (phone, hash_password(old_password)))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Текущий пароль неверный'})}
        cur.execute(f"UPDATE {SCHEMA}.loan_requests SET password_hash = %s WHERE phone = %s", (hash_password(new_password), phone))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    phone = body.get('phone', '').strip()
    password = body.get('password', '').strip()

    if not phone or not password:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите телефон и пароль'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"""SELECT id, ref_number, full_name, phone, passport, amount, days, status, created_at, is_blocked
            FROM {SCHEMA}.loan_requests
            WHERE phone = %s AND password_hash = %s
            ORDER BY created_at DESC LIMIT 1""",
        (phone, hash_password(password))
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Неверный телефон или пароль'})}

    cols = ['id', 'ref_number', 'full_name', 'phone', 'passport', 'amount', 'days', 'status', 'created_at', 'is_blocked']
    user = dict(zip(cols, row))
    user['created_at'] = user['created_at'].isoformat()

    if user.get('is_blocked'):
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Доступ в личный кабинет заблокирован. Обратитесь к оператору.'})}

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps(user)}