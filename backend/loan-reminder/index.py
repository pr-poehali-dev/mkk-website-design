"""Автоматическая проверка и отправка клиентам напоминаний о скором сроке погашения займа.

Вызывается с фронтенда (без авторизации, идемпотентно) — сама решает, нужно ли что-то делать,
и не отправляет повторных писем в течение одного дня благодаря отметке в site_settings.
"""
import json
import os
import smtplib
from datetime import date, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465
LAST_RUN_KEY = 'reminder_last_run_date'

DEFAULT_DESIGN = {
    'brand_name': 'Частные займы плюс', 'primary_color': '#1a2b4c', 'accent_color': '#f2f4f8',
    'logo_url': '', 'signature': 'С уважением,\nЗаймы-плюс.рф\nРежим работы с 09:00 до 18:00 по мск.',
}
DEFAULT_REMINDER_EMAIL = {
    'subject': 'Напоминание о погашении займа',
    'body': 'Напоминаем, что по заявке {ref} срок погашения займа — {return_date}. Сумма к возврату: {total} ₽. '
            'Пожалуйста, подготовьте средства заранее, чтобы избежать просрочки.',
}


def render_email_html(design: dict, body_html: str) -> str:
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
        return f"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 28px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;text-align:center;">
          {logo_html}
          <h2 style="color:{design['primary_color']};margin:0 0 16px;">{design['brand_name']}</h2>
          <div style="border-top:1px solid #eee;margin:0 0 16px;"></div>
          <p style="color:#333;font-size:14px;line-height:1.6;text-align:center;">{body_html}</p>
          {signature_html}
        </div>
        """
    if layout == 'header':
        return f"""
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #eee;border-radius:14px;overflow:hidden;">
          <div style="background:{design['primary_color']};padding:24px;text-align:center;">
            {logo_html}
            <h2 style="color:#fff;margin:0;font-size:18px;">{design['brand_name']}</h2>
          </div>
          <div style="padding:24px;background:#ffffff;">
            <p style="color:#333;font-size:14px;line-height:1.6;">{body_html}</p>
            {signature_html}
          </div>
        </div>
        """
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      {logo_html}
      <h2 style="color:{design['primary_color']};">{design['brand_name']}</h2>
      <p style="color:#333;font-size:14px;line-height:1.6;">{body_html}</p>
      {signature_html}
    </div>
    """


def get_setting(cur, key: str) -> Optional[str]:
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key = %s", (key,))
    row = cur.fetchone()
    return row[0] if row else None


def set_setting(cur, key: str, value: str) -> None:
    cur.execute(
        f"INSERT INTO {SCHEMA}.site_settings (key, value, updated_at) VALUES (%s, %s, NOW()) "
        f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
        (key, value)
    )


def get_email_settings(cur) -> dict:
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key = 'system_email_templates'")
    row = cur.fetchone()
    if not row:
        return {}
    try:
        return json.loads(row[0])
    except Exception:
        return {}


def send_reminder_email(to_email: str, ref_number: str, return_date: str, total: int, settings: dict) -> bool:
    login = os.environ.get('SMTP_LOGIN')
    password = os.environ.get('SMTP_PASSWORD')
    if not login or not password:
        return False
    design = {**DEFAULT_DESIGN, **(settings.get('design') or {})}
    tpl = {**DEFAULT_REMINDER_EMAIL, **(settings.get('reminder_email') or {})}
    text = (
        tpl['body']
        .replace('{ref}', ref_number)
        .replace('{return_date}', return_date)
        .replace('{total}', f'{total:,}'.replace(',', ' '))
    )
    html_body = render_email_html(design, text)
    msg = MIMEMultipart('alternative')
    msg['Subject'] = tpl['subject']
    msg['From'] = login
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(login, password)
            server.sendmail(login, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f'[loan-reminder] Failed to send reminder to {to_email} for {ref_number}: {e}')
        return False


def handler(event: dict, context) -> dict:
    """Проверяет активные займы (статус money_sent) и рассылает клиентам письмо-напоминание
    за 1-2 дня до расчётной даты погашения. Запускается максимум один раз в сутки —
    повторные вызовы в тот же день ничего не делают (флаг хранится в site_settings)."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    today = date.today().isoformat()

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    last_run = get_setting(cur, LAST_RUN_KEY)
    if last_run == today:
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'skipped': 'already_run_today'})}

    set_setting(cur, LAST_RUN_KEY, today)
    conn.commit()

    cur.execute(
        f"""SELECT ref_number, email, amount, days, money_sent_at, updated_at
            FROM {SCHEMA}.loan_requests
            WHERE status = 'money_sent' AND reminder_sent = false AND email IS NOT NULL"""
    )
    rows = cur.fetchall()

    email_settings = get_email_settings(cur)
    sent_count = 0

    for ref_number, email, amount, days, money_sent_at, updated_at in rows:
        base_date = (money_sent_at or updated_at).date()
        return_date = base_date + timedelta(days=days)
        days_left = (return_date - date.today()).days
        if days_left not in (1, 2):
            continue
        overpay = round(amount * 0.008 * days)
        total = amount + overpay
        ok = send_reminder_email(email, ref_number, return_date.strftime('%d.%m.%Y'), total, email_settings)
        if ok:
            cur.execute(
                f"UPDATE {SCHEMA}.loan_requests SET reminder_sent = true WHERE ref_number = %s",
                (ref_number,)
            )
            sent_count += 1

    conn.commit()
    conn.close()

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'checked': len(rows), 'sent': sent_count})}