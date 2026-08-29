"""Ручная отправка письма клиенту оператором из админ-панели."""
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid, formataddr
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'
SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465
DEFAULT_DESIGN = {
    'brand_name': 'Частные займы плюс', 'primary_color': '#1a2b4c', 'accent_color': '#f2f4f8',
    'logo_url': '', 'signature': 'С уважением,\nЗаймы-плюс.рф\nРежим работы с 09:00 до 18:00 по мск.',
}


def html_to_text(html: str) -> str:
    import re
    text = re.sub(r'<br\s*/?>', '\n', html)
    text = re.sub(r'</p>', '\n\n', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    return re.sub(r'\n{3,}', '\n\n', text).strip()


def get_system_email_settings(cur) -> dict:
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key = 'system_email_templates'")
    row = cur.fetchone()
    if not row:
        return {}
    try:
        return json.loads(row[0])
    except Exception:
        return {}


def send_email(to_email: str, subject: str, html_body: str, text_body: str, brand_name: str) -> None:
    login = os.environ['SMTP_LOGIN']
    password = os.environ['SMTP_PASSWORD']
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = formataddr((brand_name, login))
    msg['To'] = to_email
    msg['Reply-To'] = login
    msg['Date'] = formatdate(localtime=True)
    msg['Message-ID'] = make_msgid(domain=login.split('@')[-1])
    msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
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
    layout = design.get('layout', 'classic')
    logo_html = ''
    if design.get('logo_url'):
        if layout == 'header':
            logo_html = f'<div style="display:inline-block;background:#fff;border-radius:8px;padding:6px 10px;margin:0 0 10px;"><img src="{design["logo_url"]}" alt="{design["brand_name"]}" style="max-height:36px;display:block;" /></div>'
        else:
            margin = 'margin:0 auto 12px' if layout == 'card' else 'margin:0 0 12px'
            logo_html = f'<img src="{design["logo_url"]}" alt="{design["brand_name"]}" style="max-height:48px;{margin};display:block;" />'
    signature_html = ''
    if design.get('signature'):
        sig = design['signature'].replace(chr(10), '<br>')
        align = 'text-align:center;' if layout == 'card' else ''
        signature_html = f'<p style="color:#888;font-size:12px;margin:20px 0 0;border-top:1px solid #eee;padding-top:12px;{align}">{sig}</p>'
    if layout == 'card':
        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 28px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;text-align:center;">
          {logo_html}
          <h2 style="color:{design['primary_color']};margin:0 0 16px;">{design['brand_name']}</h2>
          <div style="border-top:1px solid #eee;margin:0 0 16px;"></div>
          <div style="white-space:pre-wrap;color:#333;font-size:14px;line-height:1.6;text-align:center;">{message}</div>
          {signature_html}
        </div>
        """
    elif layout == 'header':
        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #eee;border-radius:14px;overflow:hidden;">
          <div style="background:{design['primary_color']};padding:24px;text-align:center;">
            {logo_html}
            <h2 style="color:#fff;margin:0;font-size:18px;">{design['brand_name']}</h2>
          </div>
          <div style="padding:24px;background:#ffffff;">
            <div style="white-space:pre-wrap;color:#333;font-size:14px;line-height:1.6;">{message}</div>
            {signature_html}
          </div>
        </div>
        """
    else:
        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          {logo_html}
          <h2 style="color:{design['primary_color']};">{design['brand_name']}</h2>
          <div style="white-space:pre-wrap;color:#333;font-size:14px;line-height:1.6;">{message}</div>
          {signature_html}
        </div>
        """

    text_body = html_to_text(html_body)

    try:
        send_email(to_email, subject, html_body, text_body, design['brand_name'])
    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': f'Не удалось отправить письмо: {str(e)}'})}

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}