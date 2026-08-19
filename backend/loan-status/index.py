"""Обновление/удаление заявок администратором."""
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'
VALID_STATUSES = ('review', 'approved', 'issued', 'money_sent', 'rejected', 'transfer_error', 'repaid')
STATUS_LABELS = {
    'review': 'На скоринге', 'approved': 'Одобрено', 'issued': 'Договор подписан',
    'money_sent': 'Деньги выданы', 'rejected': 'Отказано', 'transfer_error': 'Ошибка перевода',
    'repaid': 'Займ погашен',
}
SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465

DEFAULT_DESIGN = {
    'brand_name': 'Частные займы плюс', 'primary_color': '#1a2b4c', 'accent_color': '#f2f4f8',
    'logo_url': '', 'signature': 'С уважением,\nЗаймы-плюс.рф\nРежим работы с 09:00 до 18:00 по мск.',
}


def render_email_html(design: dict, body_html: str) -> str:
    logo_html = f'<img src="{design["logo_url"]}" alt="{design["brand_name"]}" style="max-height:48px;margin:0 0 12px;display:block;" />' if design.get('logo_url') else ''
    signature_html = ''
    if design.get('signature'):
        sig = design['signature'].replace(chr(10), '<br>')
        signature_html = f'<p style="color:#888;font-size:12px;margin:20px 0 0;border-top:1px solid #eee;padding-top:12px;">{sig}</p>'
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      {logo_html}
      <h2 style="color:{design['primary_color']};">{design['brand_name']}</h2>
      <p style="color:#333;font-size:14px;line-height:1.6;">{body_html}</p>
      {signature_html}
    </div>
    """

DEFAULT_STATUS_EMAIL_TEXT = {
    'review': ('Заявка принята', 'Ваша заявка {ref} принята и находится на рассмотрении. Мы уведомим вас, как только решение будет готово.'),
    'approved': ('Заявка одобрена', 'Отличные новости! Ваша заявка {ref} одобрена. Зайдите в личный кабинет, чтобы продолжить оформление.'),
    'issued': ('Договор подписан', 'Договор по заявке {ref} подписан. Ожидайте поступления денежных средств.'),
    'money_sent': ('Деньги отправлены', 'Денежные средства по заявке {ref} отправлены на ваш счёт.'),
    'rejected': ('Заявка отклонена', 'К сожалению, по заявке {ref} принято решение об отказе.'),
    'transfer_error': ('Ошибка перевода', 'При переводе средств по заявке {ref} произошла ошибка. Наш оператор свяжется с вами.'),
    'repaid': ('Займ погашен', 'Займ по заявке {ref} успешно погашен. Спасибо, что выбираете нас!'),
}


def create_notification(cur, phone: str, ref_number: str, n_type: str, title: str, message: str) -> None:
    if not phone:
        return
    cur.execute(
        f"""INSERT INTO {SCHEMA}.notifications (phone, ref_number, type, title, message)
            VALUES (%s, %s, %s, %s, %s)""",
        (phone, ref_number, n_type, title, message)
    )


def get_system_email_settings(cur) -> dict:
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key = 'system_email_templates'")
    row = cur.fetchone()
    if not row:
        return {}
    try:
        return json.loads(row[0])
    except Exception:
        return {}


def send_status_email(to_email: str, ref_number: str, status: str, settings: dict) -> str:
    if status not in DEFAULT_STATUS_EMAIL_TEXT:
        return 'skipped: unknown status'
    login = os.environ.get('SMTP_LOGIN')
    password = os.environ.get('SMTP_PASSWORD')
    if not login or not password:
        return 'skipped: SMTP credentials not configured'
    design = {**DEFAULT_DESIGN, **(settings.get('design') or {})}
    default_subject, default_body = DEFAULT_STATUS_EMAIL_TEXT[status]
    status_templates = settings.get('status_emails') or {}
    tpl = status_templates.get(status) or {}
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
        return 'ok'
    except Exception as e:
        print(f'[loan-status] Failed to send status email to {to_email} for {ref_number} status={status}: {e}')
        return f'error: {e}'

def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = req_headers.get('x-admin-token', '')
    is_admin = token == ADMIN_TOKEN

    body = json.loads(event.get('body') or '{}')

    # Клиент обновляет свои документы (без admin-токена)
    if not is_admin and body.get('action') == 'client_update_docs':
        ref = body.get('ref_number')
        if not ref:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number обязателен'})}
        fields = []
        values = []
        # При загрузке нового файла — сбрасываем статус в pending
        for field in ('passport_photo_url', 'registration_photo_url', 'income_doc_url'):
            if field in body:
                fields.append(f'{field} = %s')
                values.append(body[field] or None)
                status_field = field.replace('_url', '_status')
                fields.append(f'{status_field} = %s')
                values.append('pending')
        if not fields:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Нет полей для обновления'})}
        fields.append('updated_at = NOW()')
        values.append(ref)
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.loan_requests SET {', '.join(fields)} WHERE ref_number = %s RETURNING id",
            values
        )
        updated = cur.fetchone()
        conn.commit()
        conn.close()
        if not updated:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    if not is_admin:
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}

    # Сохранение настроек сайта
    if body.get('action') == 'save_settings':
        settings = body.get('settings', {})
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        for k, v in settings.items():
            cur.execute(
                f"INSERT INTO {SCHEMA}.site_settings (key, value, updated_at) VALUES (%s, %s, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (k, str(v))
            )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    # Удаление списка заявок
    if event.get('httpMethod') == 'DELETE' or body.get('action') == 'delete':
        refs = body.get('ref_numbers', [])
        if not refs:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_numbers обязателен'})}
        placeholders = ', '.join(['%s'] * len(refs))
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.loan_requests WHERE ref_number IN ({placeholders}) RETURNING ref_number", refs)
        deleted = [row[0] for row in cur.fetchall()]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'deleted': deleted})}
    ref = body.get('ref_number')
    if not ref:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number обязателен'})}

    # Собираем только переданные поля
    fields = []
    values = []

    reset_reminder = False

    status = body.get('status')
    if status is not None:
        if status not in VALID_STATUSES:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверный статус'})}
        fields.append('status = %s')
        values.append(status)
        if status == 'money_sent':
            # Фиксируем дату выдачи денег — отсчёт срока начинается заново
            fields.append('money_sent_at = NOW()')
            reset_reminder = True
        elif status == 'repaid':
            reset_reminder = True

    if 'amount' in body:
        fields.append('amount = %s')
        values.append(int(body['amount']))

    if 'days' in body:
        fields.append('days = %s')
        values.append(int(body['days']))
        # Срок изменился — напоминание нужно отправить заново под новую дату
        reset_reminder = True

    if reset_reminder:
        fields.append('reminder_sent = false')

    if 'operator_comment' in body:
        fields.append('operator_comment = %s')
        values.append(body['operator_comment'] or None)

    if 'payment_bank' in body:
        fields.append('payment_bank = %s')
        values.append(body['payment_bank'] or None)

    if 'is_blocked' in body:
        fields.append('is_blocked = %s')
        values.append(bool(body['is_blocked']))

    if 'doc_urls' in body:
        fields.append('doc_urls = %s')
        values.append(body['doc_urls'] or [])

    if 'insurance_enabled' in body:
        fields.append('insurance_enabled = %s')
        values.append(bool(body['insurance_enabled']))

    # Статусы документов (принять/отклонить) — только для админа
    VALID_DOC_STATUSES = ('pending', 'approved', 'rejected')
    for doc_status_field in ('passport_photo_status', 'registration_photo_status', 'income_doc_status'):
        if doc_status_field in body:
            val = body[doc_status_field]
            if val not in VALID_DOC_STATUSES:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': f'Неверный статус документа: {val}'})}
            fields.append(f'{doc_status_field} = %s')
            values.append(val)
            # При отклонении — сбрасываем URL файла
            if val == 'rejected':
                url_field = doc_status_field.replace('_status', '_url')
                fields.append(f'{url_field} = %s')
                values.append(None)

    if not fields:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Нет полей для обновления'})}

    fields.append('updated_at = NOW()')
    values.append(ref)

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.loan_requests SET {', '.join(fields)} WHERE ref_number = %s RETURNING id, email, phone",
        values
    )
    updated = cur.fetchone()
    if not updated:
        conn.close()
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}

    updated_phone = updated[2]
    email_settings = get_system_email_settings(cur) if status is not None and updated[1] else {}

    if status is not None:
        default_subject, default_body = DEFAULT_STATUS_EMAIL_TEXT.get(status, (STATUS_LABELS.get(status, status), ''))
        status_templates = (email_settings.get('status_emails') or {})
        tpl = status_templates.get(status) or {}
        notif_text = (tpl.get('body') or default_body).format(ref=ref)
        create_notification(cur, updated_phone, ref, 'status', f'Статус заявки {ref}: {STATUS_LABELS.get(status, status)}', notif_text)

    if 'operator_comment' in body and body['operator_comment']:
        create_notification(cur, updated_phone, ref, 'comment', 'Сообщение от оператора', body['operator_comment'])

    conn.commit()
    conn.close()

    if status is not None and updated[1]:
        send_status_email(updated[1], ref, status, email_settings)

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'ref_number': ref})}