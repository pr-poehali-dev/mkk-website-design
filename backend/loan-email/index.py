"""Ручная отправка письма клиенту оператором из админ-панели."""
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
DEFAULT_DESIGN = {
    'brand_name': 'Частные займы плюс', 'primary_color': '#1a2b4c', 'accent_color': '#f2f4f8',
    'logo_url': '', 'signature': 'С уважением,\nЗаймы-плюс.рф\nРежим работы с 09:00 до 18:00 по мск.',
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


def send_email(to_email: str, subject: str, html_body: str) -> None:
    login = os.environ['SMTP_LOGIN']
    password = os.environ['SMTP_PASSWORD']
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = login
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(login, password)
        server.sendmail(login, [to_email], msg.as_string())


def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = req_headers.get('x-admin-token', '')
    if token != ADMIN_TOKEN:
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}

    body = json.loads(event.get('body') or '{}')
    to_email = body.get('to')
    ref_number = body.get('ref_number')
    subject = body.get('subject')
    message = body.get('message')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    settings = get_system_email_settings(cur)

    if not to_email and ref_number:
        cur.execute(f"SELECT email FROM {SCHEMA}.loan_requests WHERE ref_number = %s", (ref_number,))
        row = cur.fetchone()
        if row:
            to_email = row[0]
    conn.close()

    if not to_email:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Email клиента не указан'})}
    if not subject or not message:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Заполните тему и текст письма'})}

    design = {**DEFAULT_DESIGN, **(settings.get('design') or {})}
    logo_html = f'<img src="{design["logo_url"]}" alt="{design["brand_name"]}" style="max-height:48px;margin:0 0 12px;display:block;" />' if design.get('logo_url') else ''
    signature_html = ''
    if design.get('signature'):
        sig = design['signature'].replace(chr(10), '<br>')
        signature_html = f'<p style="color:#888;font-size:12px;margin:20px 0 0;border-top:1px solid #eee;padding-top:12px;">{sig}</p>'
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      {logo_html}
      <h2 style="color:{design['primary_color']};">{design['brand_name']}</h2>
      <div style="white-space:pre-wrap;color:#333;font-size:14px;line-height:1.6;">{message}</div>
      {signature_html}
    </div>
    """

    try:
        send_email(to_email, subject, html_body)
    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': f'Не удалось отправить письмо: {str(e)}'})}

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}