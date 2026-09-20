"""Одноразовая ссылка для идентификации клиента (фото паспорта, селфи, карты, СНИЛС, согласия)."""
import json
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'
LINK_TTL_MINUTES = 40
SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465

STATUS_LABELS = {
    'review': 'На скоринге', 'approved': 'Одобрено', 'issued': 'Договор подписан',
    'money_sent': 'Деньги выданы', 'rejected': 'Отказано', 'transfer_error': 'Ошибка перевода',
    'repaid': 'Займ погашен',
}

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


def render_email_html(design: dict, body_html: str) -> str:
    logo_html = ''
    if design.get('logo_url'):
        logo_html = f'<img src="{design["logo_url"]}" alt="{design["brand_name"]}" style="max-height:48px;margin:0 0 12px;display:block;" />'
    signature_html = ''
    if design.get('signature'):
        sig = design['signature'].replace(chr(10), '<br>')
        signature_html = f'<p style="color:#888;font-size:12px;margin:20px 0 0;border-top:1px solid #eee;padding-top:12px;">{sig}</p>'
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      {logo_html}
      <h2 style="color:{design['primary_color']};">{design['brand_name']}</h2>
      <div style="color:#333;font-size:14px;line-height:1.6;">{body_html}</div>
      {signature_html}
    </div>
    """


def send_identify_email(to_email: str, ref_number: str, link_url: str, settings: dict) -> None:
    login = os.environ.get('SMTP_LOGIN')
    password = os.environ.get('SMTP_PASSWORD')
    if not login or not password:
        return
    design = {**DEFAULT_DESIGN, **(settings.get('design') or {})}
    text = (
        f'По заявке {ref_number} требуется идентификация: загрузите, пожалуйста, фото паспорта, '
        f'селфи, банковской карты и СНИЛС по ссылке ниже. Ссылка действует {LINK_TTL_MINUTES} минут '
        f'и может быть использована только один раз.<br><br>'
        f'<a href="{link_url}" style="display:inline-block;background:{design["primary_color"]};color:#fff;'
        f'padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Загрузить документы</a>'
    )
    html_body = render_email_html(design, text)
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Ссылка для идентификации'
    msg['From'] = login
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(login, password)
            server.sendmail(login, [to_email], msg.as_string())
    except Exception as e:
        print(f'[loan-identify] Failed to send identify email to {to_email} for {ref_number}: {e}')


def create_notification(cur, phone: str, ref_number: str, n_type: str, title: str, message: str) -> None:
    if not phone:
        return
    cur.execute(
        f"""INSERT INTO {SCHEMA}.notifications (phone, ref_number, type, title, message)
            VALUES (%s, %s, %s, %s, %s)""",
        (phone, ref_number, n_type, title, message)
    )


def handler(event: dict, context) -> dict:
    """Генерирует одноразовую ссылку идентификации для заявки (админ или сам клиент),
    отдаёт данные по токену и принимает от клиента фото документов вместе с согласиями."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    is_admin = req_headers.get('x-admin-token') == ADMIN_TOKEN
    method = event.get('httpMethod')
    params = event.get('queryStringParameters') or {}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Получение состояния по токену (публично, без токена админа)
    if method == 'GET':
        token = params.get('token')
        if not token:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'token обязателен'})}
        cur.execute(
            f"""SELECT ref_number, full_name, identify_token_expires_at, identify_submitted_at,
                       passport_photo_status, selfie_photo_status, card_photo_status, snils_photo_status, status
                FROM {SCHEMA}.loan_requests WHERE identify_token = %s""",
            (token,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'not_found'})}
        (ref_number, full_name, expires_at, submitted_at, passport_status, selfie_status,
         card_status, snils_status, status) = row
        now = datetime.now(timezone.utc)
        if submitted_at:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'state': 'submitted', 'ref_number': ref_number, 'full_name': full_name,
                'passport_photo_status': passport_status, 'selfie_photo_status': selfie_status,
                'card_photo_status': card_status, 'snils_photo_status': snils_status,
                'status': status, 'status_label': STATUS_LABELS.get(status, status),
            })}
        if not expires_at or expires_at < now:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'state': 'expired'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'state': 'valid', 'ref_number': ref_number, 'full_name': full_name,
            'expires_at': expires_at.isoformat(),
        })}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')

    # Генерация ссылки — админом из панели или самим клиентом из личного кабинета
    if action == 'generate':
        ref = body.get('ref_number')
        origin = (body.get('origin') or '').rstrip('/')
        if not ref:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number обязателен'})}
        token = secrets.token_urlsafe(24)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=LINK_TTL_MINUTES)
        cur.execute(
            f"""UPDATE {SCHEMA}.loan_requests
                SET identify_token = %s, identify_token_expires_at = %s, identify_submitted_at = NULL
                WHERE ref_number = %s RETURNING id, email, phone""",
            (token, expires_at, ref)
        )
        updated = cur.fetchone()
        if not updated:
            conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}
        _, client_email, client_phone = updated
        if client_email and origin:
            settings = get_system_email_settings(cur)
            link_url = f'{origin}/verify/{token}'
            send_identify_email(client_email, ref, link_url, settings)
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'ok': True, 'token': token, 'expires_at': expires_at.isoformat(), 'ttl_minutes': LINK_TTL_MINUTES,
        })}

    # Приём данных от клиента — публично, только по действующему токену
    if action == 'submit':
        token = body.get('token')
        if not token:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'token обязателен'})}
        passport_photo_url = body.get('passport_photo_url')
        selfie_photo_url = body.get('selfie_photo_url')
        card_photo_url = body.get('card_photo_url')
        snils_photo_url = body.get('snils_photo_url')
        consent_pd = bool(body.get('consent_pd'))
        consent_transfer = bool(body.get('consent_transfer'))
        consent_sms = bool(body.get('consent_sms'))
        if not passport_photo_url or not selfie_photo_url or not card_photo_url or not snils_photo_url:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Нужны все четыре фото: паспорт, селфи, карта, СНИЛС'})}
        if not (consent_pd and consent_transfer):
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Нужно принять обязательные согласия'})}

        cur.execute(
            f"""SELECT ref_number, phone, identify_token_expires_at, identify_submitted_at
                FROM {SCHEMA}.loan_requests WHERE identify_token = %s""",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Ссылка не найдена'})}
        ref_number, phone, expires_at, submitted_at = row
        now = datetime.now(timezone.utc)
        if submitted_at:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Данные уже были отправлены по этой ссылке'})}
        if not expires_at or expires_at < now:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Срок действия ссылки истёк'})}

        cur.execute(
            f"""UPDATE {SCHEMA}.loan_requests SET
                    passport_photo_url = %s, passport_photo_status = 'pending',
                    selfie_photo_url = %s, selfie_photo_status = 'pending',
                    card_photo_url = %s, card_photo_status = 'pending',
                    snils_photo_url = %s, snils_photo_status = 'pending',
                    identify_consent_pd = %s, identify_consent_transfer = %s, identify_consent_sms = %s,
                    identify_submitted_at = NOW(), identify_token = NULL, identify_token_expires_at = NULL,
                    updated_at = NOW()
                WHERE ref_number = %s""",
            (passport_photo_url, selfie_photo_url, card_photo_url, snils_photo_url,
             consent_pd, consent_transfer, consent_sms, ref_number)
        )
        create_notification(
            cur, phone, ref_number, 'comment',
            'Документы получены',
            'Ваши документы для идентификации получены и переданы на проверку.'
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестное действие'})}
