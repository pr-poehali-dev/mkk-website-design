"""Отправка и проверка кода подтверждения по email (для регистрации заявки и подписи договора)."""
import json
import os
import random
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465
CODE_TTL_MINUTES = 10
MAX_ATTEMPTS = 5

DEFAULT_DESIGN = {
    'brand_name': 'Частные займы плюс', 'primary_color': '#1a2b4c', 'accent_color': '#f2f4f8',
    'logo_url': '', 'signature': 'С уважением,\nЗаймы-плюс.рф\nРежим работы с 09:00 до 18:00 по мск.',
}

DEFAULT_PURPOSE_TEXT = {
    'register': ('Код подтверждения регистрации', 'Ваш код подтверждения для оформления заявки на займ:'),
    'sign': ('Код подписи договора', 'Ваш код для подписания договора займа:'),
}


def get_system_email_settings(cur) -> dict:
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key = 'system_email_templates'")
    row = cur.fetchone()
    if not row:
        return {}
    try:
        return json.loads(row[0])
    except Exception:
        return {}


def send_code_email(to_email: str, code: str, purpose: str, settings: dict) -> None:
    login = os.environ['SMTP_LOGIN']
    password = os.environ['SMTP_PASSWORD']
    design = {**DEFAULT_DESIGN, **(settings.get('design') or {})}
    default_subject, default_intro = DEFAULT_PURPOSE_TEXT.get(purpose, DEFAULT_PURPOSE_TEXT['register'])
    code_templates = settings.get('code_emails') or {}
    tpl = code_templates.get(purpose) or {}
    subject = tpl.get('subject') or default_subject
    intro = tpl.get('intro') or default_intro
    logo_html = f'<img src="{design["logo_url"]}" alt="{design["brand_name"]}" style="max-height:48px;margin:0 0 12px;display:block;" />' if design.get('logo_url') else ''
    signature_html = ''
    if design.get('signature'):
        sig = design['signature'].replace(chr(10), '<br>')
        signature_html = f'<p style="color:#888;font-size:12px;margin:20px 0 0;border-top:1px solid #eee;padding-top:12px;">{sig}</p>'
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      {logo_html}
      <h2 style="color:{design['primary_color']};">{design['brand_name']}</h2>
      <p style="color:#333;font-size:14px;line-height:1.6;">{intro}</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:{design['primary_color']};text-align:center;
                background:{design['accent_color']};border-radius:10px;padding:16px;">{code}</p>
      <p style="color:#888;font-size:12px;">Код действителен {CODE_TTL_MINUTES} минут. Никому не сообщайте его.</p>
      {signature_html}
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
    """Генерирует и отправляет 6-значный код на email, а также проверяет введённый клиентом код."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')
    email = (body.get('email') or '').strip().lower()
    purpose = body.get('purpose')

    if purpose not in ('register', 'sign'):
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверное назначение кода'})}
    if not email:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Email обязателен'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if action == 'send_code':
        ref_number = body.get('ref_number')
        code = f"{random.randint(0, 999999):06d}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=CODE_TTL_MINUTES)
        settings = get_system_email_settings(cur)
        cur.execute(
            f"""INSERT INTO {SCHEMA}.verification_codes (email, code, purpose, ref_number, expires_at)
                VALUES (%s, %s, %s, %s, %s)""",
            (email, code, purpose, ref_number, expires_at)
        )
        conn.commit()
        conn.close()
        try:
            send_code_email(email, code, purpose, settings)
        except Exception as e:
            return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': f'Не удалось отправить письмо: {str(e)}'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    if action == 'verify_code':
        code = (body.get('code') or '').strip()
        if not code:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Введите код'})}
        cur.execute(
            f"""SELECT id, code, attempts FROM {SCHEMA}.verification_codes
                WHERE email = %s AND purpose = %s AND used = false AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1""",
            (email, purpose)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Код не найден или истёк. Запросите новый код.'})}
        code_id, real_code, attempts = row
        if attempts >= MAX_ATTEMPTS:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Превышено число попыток. Запросите новый код.'})}
        if code != real_code:
            cur.execute(f"UPDATE {SCHEMA}.verification_codes SET attempts = attempts + 1 WHERE id = %s", (code_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверный код'})}
        cur.execute(f"UPDATE {SCHEMA}.verification_codes SET used = true WHERE id = %s", (code_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестное действие'})}