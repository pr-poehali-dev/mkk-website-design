"""Регистрация новой заявки на займ."""
import json
import os
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465

DEFAULT_DESIGN = {
    'brand_name': 'Частные займы плюс', 'primary_color': '#1a2b4c', 'accent_color': '#f2f4f8',
    'logo_url': '', 'signature': 'С уважением,\nЗаймы-плюс.рф\nРежим работы с 09:00 до 18:00 по мск.',
}
DEFAULT_REVIEW_EMAIL = (
    'Заявка принята',
    'Ваша заявка {ref} принята и находится на рассмотрении. Мы уведомим вас, как только решение будет готово.',
)


def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()


def get_system_email_settings(cur) -> dict:
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key = 'system_email_templates'")
    row = cur.fetchone()
    if not row:
        return {}
    try:
        return json.loads(row[0])
    except Exception:
        return {}


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


def send_review_email(to_email: str, ref_number: str, settings: dict) -> None:
    login = os.environ.get('SMTP_LOGIN')
    password = os.environ.get('SMTP_PASSWORD')
    if not login or not password:
        return
    design = {**DEFAULT_DESIGN, **(settings.get('design') or {})}
    default_subject, default_body = DEFAULT_REVIEW_EMAIL
    tpl = (settings.get('status_emails') or {}).get('review') or {}
    subject = tpl.get('subject') or default_subject
    body_template = tpl.get('body') or default_body
    text = body_template.format(ref=ref_number)
    html_body = render_email_html(design, text)
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = login
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(login, password)
            server.sendmail(login, [to_email], msg.as_string())
    except Exception as e:
        print(f'[loan-register] Failed to send review email to {to_email} for {ref_number}: {e}')


def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    required = ['full_name', 'phone', 'amount', 'days', 'email']
    for field in required:
        if not body.get(field):
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': f'Поле {field} обязательно'})}

    email = body['email'].strip().lower()

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Проверяем, что email был подтверждён кодом из письма незадолго до отправки заявки
    cur.execute(
        f"""SELECT id FROM {SCHEMA}.verification_codes
            WHERE email = %s AND purpose = 'register' AND used = true
              AND created_at > NOW() - INTERVAL '30 minutes'
            ORDER BY created_at DESC LIMIT 1""",
        (email,)
    )
    if not cur.fetchone():
        conn.close()
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Email не подтверждён кодом. Запросите и введите код из письма.'})}

    phone = body['phone']
    full_name = body['full_name']
    passport = body.get('passport') or None

    # Проверяем существующего клиента по телефону, либо по совпадению ФИО + паспорта
    if passport:
        cur.execute(
            f"""SELECT id, status, password_hash, ref_number, created_at, phone
                FROM {SCHEMA}.loan_requests
                WHERE phone = %s
                   OR (passport = %s AND LOWER(TRIM(full_name)) = LOWER(TRIM(%s)))
                ORDER BY created_at DESC LIMIT 1""",
            (phone, passport, full_name)
        )
    else:
        cur.execute(
            f"""SELECT id, status, password_hash, ref_number, created_at, phone
                FROM {SCHEMA}.loan_requests WHERE phone = %s ORDER BY created_at DESC LIMIT 1""",
            (phone,)
        )
    existing = cur.fetchone()
    if existing:
        ex_status = existing[1]
        ex_phone = existing[5]
        if ex_status not in ('repaid', 'rejected'):
            # Клиент с такими данными уже зарегистрирован и имеет активную заявку
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({
                'error': 'Клиент с такими данными (ФИО, паспорт или телефон) уже зарегистрирован. Войдите в личный кабинет, чтобы продолжить.'
            })}

    # Пароль: plain → hash, или hash напрямую, или берём из существующей заявки (только если совпал телефон)
    if body.get('password'):
        pwd_hash = hash_password(body['password'])
    elif body.get('password_hash'):
        pwd_hash = body['password_hash']
    elif existing and existing[5] == phone and existing[2]:
        pwd_hash = existing[2]
    else:
        conn.close()
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Поле password обязательно'})}

    # Номер заявки: берём максимальный существующий номер (не просто COUNT,
    # т.к. удаление старых заявок могло привести к повторному номеру и конфликту уникальности)
    cur.execute(
        f"SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(ref_number, '[^0-9]', '', 'g') AS INTEGER)), 1042) FROM {SCHEMA}.loan_requests"
    )
    max_num = cur.fetchone()[0]

    row = None
    for attempt in range(5):
        ref_number = f"ZP-{max_num + 1 + attempt}"
        try:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.loan_requests
                    (ref_number, full_name, phone, password_hash, birth_date, passport, passport_by, amount, days,
                     address_residence, address_registration, work_place, work_phone, income_doc_url, email, passport_photo_url,
                     selfie_photo_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, ref_number, status, created_at""",
                (
                    ref_number,
                    body['full_name'],
                    body['phone'],
                    pwd_hash,
                    body.get('birth_date') or None,
                    body.get('passport') or None,
                    body.get('passport_by') or None,
                    int(body['amount']),
                    int(body['days']),
                    body.get('address_residence') or None,
                    body.get('address_registration') or None,
                    body.get('work_place') or None,
                    body.get('work_phone') or None,
                    body.get('income_doc_url') or None,
                    email,
                    body.get('passport_photo_url') or None,
                    body.get('selfie_photo_url') or None,
                )
            )
            row = cur.fetchone()
            break
        except psycopg2.IntegrityError:
            conn.rollback()
            continue

    if row is None:
        conn.close()
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'Не удалось сгенерировать номер заявки. Попробуйте ещё раз.'})}

    email_settings = get_system_email_settings(cur)
    conn.commit()
    conn.close()

    send_review_email(email, row[1], email_settings)

    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({
            'id': row[0],
            'ref_number': row[1],
            'status': row[2],
            'created_at': row[3].isoformat(),
        })
    }