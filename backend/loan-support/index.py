"""Обращения в поддержку: приём вопроса от клиента, просмотр/ответ администратором."""
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'
SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465
SUPPORT_INBOX_ENV = 'SMTP_LOGIN'

DEFAULT_DESIGN = {'brand_name': 'Частные займы плюс', 'primary_color': '#1a2b4c', 'accent_color': '#f2f4f8'}

COLS = ['id', 'name', 'phone', 'email', 'message', 'status', 'admin_reply', 'created_at', 'replied_at']


def row_to_dict(row):
    d = dict(zip(COLS, row))
    if d.get('created_at'):
        d['created_at'] = d['created_at'].isoformat()
    if d.get('replied_at'):
        d['replied_at'] = d['replied_at'].isoformat()
    return d


def get_system_email_settings(cur) -> dict:
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key = 'system_email_templates'")
    row = cur.fetchone()
    if not row:
        return {}
    try:
        return json.loads(row[0])
    except Exception:
        return {}


def send_html_email(to_email: str, subject: str, body_html: str, design: dict) -> None:
    login = os.environ.get('SMTP_LOGIN')
    password = os.environ.get('SMTP_PASSWORD')
    if not login or not password:
        return
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="color:{design['primary_color']};">{design['brand_name']}</h2>
      <div style="color:#333;font-size:14px;line-height:1.6;">{body_html}</div>
    </div>
    """
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = login
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(login, password)
        server.sendmail(login, [to_email], msg.as_string())


def handler(event: dict, context) -> dict:
    """Приём обращения клиента в поддержку (создаёт запись, шлёт письмо клиенту и уведомление в поддержку),
    и обработка администратором: просмотр списка обращений и отправка ответа клиенту на email."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    is_admin = req_headers.get('x-admin-token') == ADMIN_TOKEN

    if event.get('httpMethod') == 'GET':
        if not is_admin:
            return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"SELECT {', '.join(COLS)} FROM {SCHEMA}.support_messages ORDER BY created_at DESC")
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps([row_to_dict(r) for r in rows])}

    body = json.loads(event.get('body') or '{}')

    # Ответ администратора на обращение
    if is_admin and body.get('action') == 'reply':
        msg_id = body.get('id')
        reply_text = (body.get('reply') or '').strip()
        if not msg_id or not reply_text:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'id и reply обязательны'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"SELECT email, name FROM {SCHEMA}.support_messages WHERE id = %s", (msg_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Обращение не найдено'})}
        client_email, client_name = row
        settings = get_system_email_settings(cur)
        design = {**DEFAULT_DESIGN, **(settings.get('design') or {})}
        cur.execute(
            f"UPDATE {SCHEMA}.support_messages SET admin_reply = %s, status = 'answered', replied_at = NOW() WHERE id = %s",
            (reply_text, msg_id)
        )
        conn.commit()
        conn.close()
        if client_email:
            try:
                send_html_email(
                    client_email,
                    'Ответ службы поддержки',
                    f'Здравствуйте, {client_name}!<br><br>{reply_text.replace(chr(10), "<br>")}',
                    design,
                )
            except Exception:
                pass
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    # Новое обращение от клиента
    name = (body.get('name') or '').strip()
    phone = (body.get('phone') or '').strip()
    email = (body.get('email') or '').strip().lower()
    message = (body.get('message') or '').strip()

    if not name or not phone or not message:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Заполните имя, телефон и сообщение'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    settings = get_system_email_settings(cur)
    design = {**DEFAULT_DESIGN, **(settings.get('design') or {})}
    cur.execute(
        f"""INSERT INTO {SCHEMA}.support_messages (name, phone, email, message)
            VALUES (%s, %s, %s, %s) RETURNING id, created_at""",
        (name, phone, email or None, message)
    )
    row = cur.fetchone()
    conn.commit()
    conn.close()

    # Уведомление в почту поддержки
    support_inbox = os.environ.get(SUPPORT_INBOX_ENV)
    if support_inbox:
        try:
            send_html_email(
                support_inbox,
                f'Новое обращение в поддержку от {name}',
                f'Имя: {name}<br>Телефон: {phone}<br>Email: {email or "не указан"}<br><br>Сообщение:<br>{message.replace(chr(10), "<br>")}',
                design,
            )
        except Exception:
            pass

    # Автоответ клиенту
    if email:
        try:
            send_html_email(
                email,
                'Ваш запрос принят',
                f'Здравствуйте, {name}!<br><br>Ваш запрос принят, ожидайте ответа службы поддержки. Обычно мы отвечаем в течение рабочего дня.',
                design,
            )
        except Exception:
            pass

    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({'id': row[0], 'created_at': row[1].isoformat()})
    }
