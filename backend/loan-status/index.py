"""Обновление/удаление заявок администратором."""
import json
import os
import smtplib
import uuid
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2
import boto3

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'
VALID_STATUSES = ('review', 'approved', 'issued', 'money_sent', 'rejected', 'transfer_error', 'repaid', 'photo_request', 'overdue')
STATUS_LABELS = {
    'review': 'На скоринге', 'approved': 'Одобрено', 'issued': 'Договор подписан',
    'money_sent': 'Деньги выданы', 'rejected': 'Отказано', 'transfer_error': 'Ошибка перевода',
    'repaid': 'Займ погашен', 'photo_request': 'Запрос фото', 'overdue': 'Просрочка',
}
SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465
DEFAULT_DEBT_THRESHOLD = 120000

DEFAULT_DESIGN = {
    'brand_name': 'Частные займы плюс', 'primary_color': '#1a2b4c', 'accent_color': '#f2f4f8',
    'logo_url': '', 'signature': 'С уважением,\nЗаймы-плюс.рф\nРежим работы с 09:00 до 18:00 по мск.',
}
DEFAULT_COMPANY_NAME = 'КПК «Частные займы плюс»'
DEFAULT_COMPANY_INN = '220038299987'
DEFAULT_COMPANY_OGRN = '0092800992828288'

RECEIPT_TITLES = {'money_sent': 'Чек о выдаче займа', 'repaid': 'Чек о погашении займа'}


def fmt_money(n: int) -> str:
    return f'{n:,}'.replace(',', ' ')


def build_receipt_html(full_name: str, phone: str, email: str, ref_number: str, days: int,
                        receipt_type: str, receipt_number: str, amount: int,
                        company_name: str, company_inn: str, company_ogrn: str, company_phone: str) -> str:
    is_sent = receipt_type == 'money_sent'
    title = RECEIPT_TITLES[receipt_type]
    now = datetime.now()
    date_str = now.strftime('%d.%m.%Y')
    time_str = now.strftime('%H:%M')
    total = amount + round(amount * 0.008 * days) if is_sent else amount
    style = (
        'body{font-family:Arial,sans-serif;max-width:520px;margin:32px auto;color:#111;font-size:13px;line-height:1.6}'
        'h1{font-size:17px;text-align:center;margin:0 0 4px}'
        '.sub{text-align:center;color:#666;font-size:12px;margin:0 0 20px}'
        '.badge{display:block;margin:0 auto 18px;width:56px;height:56px;border-radius:50%;text-align:center;line-height:56px;font-size:26px;color:#fff}'
        '.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}'
        '.label{color:#666}'
        '.val{font-weight:bold;text-align:right}'
        '.total{font-size:16px}'
        '.total .val{color:#1a56db}'
        '.footer{margin-top:24px;text-align:center;color:#888;font-size:11px;border-top:1px solid #eee;padding-top:14px}'
        '.company{margin-top:18px;padding-top:14px;border-top:1px dashed #ccc;font-size:11px;color:#666;text-align:center}'
    )
    email_row = f'<div class="row"><span class="label">Email</span><span class="val">{email}</span></div>' if email else ''
    phone_line = f'<br>Тел.: {company_phone}' if company_phone else ''
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>{title} {receipt_number}</title>
<style>{style}</style>
</head>
<body>
<div class="badge" style="background:{'#16a34a' if is_sent else '#1a56db'}">{'✓' if is_sent else '₽'}</div>
<h1>{title}</h1>
<p class="sub">№ {receipt_number} &nbsp;·&nbsp; {date_str} {time_str}</p>

<div class="row"><span class="label">Заёмщик</span><span class="val">{full_name}</span></div>
<div class="row"><span class="label">Телефон</span><span class="val">{phone}</span></div>
{email_row}
<div class="row"><span class="label">Номер заявки</span><span class="val">{ref_number}</span></div>
<div class="row"><span class="label">{'Сумма выданного займа' if is_sent else 'Сумма погашения'}</span><span class="val">{fmt_money(amount)} ₽</span></div>
<div class="row total"><span class="label">{'К возврату' if is_sent else 'Статус'}</span><span class="val">{f'{fmt_money(total)} ₽' if is_sent else 'Займ погашен полностью'}</span></div>

<div class="company">
  <b>{company_name}</b><br>
  ИНН {company_inn} · ОГРН {company_ogrn}{phone_line}
</div>

<p class="footer">Документ сформирован автоматически и не требует подписи.<br>Сохраните его как подтверждение операции по договору займа.</p>
</body>
</html>"""


def upload_html_to_s3(html: str, folder: str, filename: str) -> str:
    data = html.encode('utf-8')
    key = f'{folder}/{filename}'
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType='text/html; charset=utf-8')
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def generate_and_store_receipt(cur, ref_number: str, receipt_type: str, full_name: str, phone: str,
                                email: str, days: int, amount: int, company_settings: dict) -> dict:
    prefix = 'В' if receipt_type == 'money_sent' else 'П'
    receipt_number = f"ЧК-{prefix}-{ref_number}-{datetime.now().strftime('%y%m%d%H%M')}"
    company_name = company_settings.get('company_name') or DEFAULT_COMPANY_NAME
    company_inn = company_settings.get('company_inn') or DEFAULT_COMPANY_INN
    company_ogrn = company_settings.get('company_ogrn') or DEFAULT_COMPANY_OGRN
    company_phone = company_settings.get('company_phone') or ''
    html = build_receipt_html(full_name, phone, email or '', ref_number, days, receipt_type,
                               receipt_number, amount, company_name, company_inn, company_ogrn, company_phone)
    file_url = upload_html_to_s3(html, 'receipts', f'{uuid.uuid4()}.html')
    cur.execute(
        f"""INSERT INTO {SCHEMA}.loan_receipts (ref_number, receipt_number, receipt_type, amount, html, file_url)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at""",
        (ref_number, receipt_number, receipt_type, amount, html, file_url)
    )
    row = cur.fetchone()
    return {
        'id': row[0], 'ref_number': ref_number, 'receipt_number': receipt_number,
        'receipt_type': receipt_type, 'amount': amount, 'file_url': file_url,
        'created_at': row[1].isoformat() if row[1] else None,
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
          <div style="color:#333;font-size:14px;line-height:1.6;text-align:center;">{body_html}</div>
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
            <div style="color:#333;font-size:14px;line-height:1.6;">{body_html}</div>
            {signature_html}
          </div>
        </div>
        """
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      {logo_html}
      <h2 style="color:{design['primary_color']};">{design['brand_name']}</h2>
      <div style="color:#333;font-size:14px;line-height:1.6;">{body_html}</div>
      {signature_html}
    </div>
    """


def render_attachment_html(attachment_url: str, attachment_name: str) -> str:
    if not attachment_url:
        return ''
    label = attachment_name or 'Скачать файл'
    return (
        f'<p style="margin:16px 0 0;"><a href="{attachment_url}" target="_blank" rel="noopener noreferrer" '
        f'style="display:inline-flex;align-items:center;gap:6px;color:#1a2b4c;text-decoration:none;font-size:13px;'
        f'border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;">📎 {label}</a></p>'
    )

DEFAULT_STATUS_EMAIL_TEXT = {
    'review': ('Заявка принята', 'Ваша заявка {ref} принята и находится на рассмотрении. Мы уведомим вас, как только решение будет готово.'),
    'approved': ('Заявка одобрена', 'Отличные новости! Ваша заявка {ref} одобрена. Зайдите в личный кабинет, чтобы продолжить оформление.'),
    'issued': ('Договор подписан', 'Договор по заявке {ref} подписан. Ожидайте поступления денежных средств.'),
    'money_sent': ('Деньги отправлены', 'Денежные средства по заявке {ref} отправлены на ваш счёт.'),
    'rejected': ('Заявка отклонена', 'К сожалению, по заявке {ref} принято решение об отказе.'),
    'transfer_error': ('Ошибка перевода', 'При переводе средств по заявке {ref} произошла ошибка. Наш оператор свяжется с вами.'),
    'repaid': ('Займ погашен', 'Займ по заявке {ref} успешно погашен. Спасибо, что выбираете нас!'),
    'photo_request': ('Требуется идентификация', 'По заявке {ref} требуется идентификация. Зайдите в личный кабинет и загрузите фото паспорта, селфи, банковской карты и СНИЛС.'),
    'overdue': ('Просрочка платежа', 'По вашему займу {ref} образовалась просрочка. Пожалуйста, погасите задолженность как можно скорее, чтобы избежать штрафов.'),
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


def send_status_email(to_email: str, ref_number: str, status: str, settings: dict,
                       extra_attachment_url: str = '', extra_attachment_name: str = '') -> str:
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
    text = body_template.replace('{ref}', ref_number)
    text += render_attachment_html(tpl.get('attachment_url', ''), tpl.get('attachment_name', ''))
    text += render_attachment_html(extra_attachment_url, extra_attachment_name)
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

    # Клиент меняет email (без admin-токена, только с подтверждённым кодом)
    if not is_admin and body.get('action') == 'client_update_email':
        ref = body.get('ref_number')
        new_email = (body.get('email') or '').strip().lower()
        if not ref or not new_email:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number и email обязательны'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id FROM {SCHEMA}.verification_codes
                WHERE email = %s AND purpose = 'email_change' AND used = true
                  AND created_at > NOW() - INTERVAL '30 minutes'
                ORDER BY created_at DESC LIMIT 1""",
            (new_email,)
        )
        if not cur.fetchone():
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Email не подтверждён кодом. Запросите и введите код из письма.'})}
        cur.execute(
            f"UPDATE {SCHEMA}.loan_requests SET email = %s, updated_at = NOW() WHERE ref_number = %s RETURNING id",
            (new_email, ref)
        )
        updated = cur.fetchone()
        conn.commit()
        conn.close()
        if not updated:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'email': new_email})}

    # Клиент обновляет свои документы (без admin-токена)
    if not is_admin and body.get('action') == 'client_update_docs':
        ref = body.get('ref_number')
        if not ref:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number обязателен'})}
        fields = []
        values = []
        # При загрузке нового файла — сбрасываем статус в pending
        for field in ('passport_photo_url', 'registration_photo_url', 'income_doc_url', 'selfie_photo_url', 'card_photo_url', 'snils_photo_url'):
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

    # Клиент завершает загрузку 5 фото для идентификации (без admin-токена).
    # Фото считаются принятыми, заявка возвращается на скоринг.
    if not is_admin and body.get('action') == 'client_submit_identify_photos':
        ref = body.get('ref_number')
        if not ref:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number обязателен'})}
        required = ('passport_photo_url', 'registration_photo_url', 'selfie_photo_url', 'card_photo_url', 'snils_photo_url')
        if not all(body.get(f) for f in required):
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Нужны все пять фото: паспорт, регистрация, селфи, карта, СНИЛС'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"""UPDATE {SCHEMA}.loan_requests SET
                    passport_photo_url = %s, passport_photo_status = 'approved',
                    registration_photo_url = %s, registration_photo_status = 'approved',
                    selfie_photo_url = %s, selfie_photo_status = 'approved',
                    card_photo_url = %s, card_photo_status = 'approved',
                    snils_photo_url = %s, snils_photo_status = 'approved',
                    status = 'review', rejection_reason = NULL, identify_submitted_at = NOW(), updated_at = NOW()
                WHERE ref_number = %s AND status = 'photo_request'
                RETURNING id, email, phone""",
            (body['passport_photo_url'], body['registration_photo_url'], body['selfie_photo_url'], body['card_photo_url'], body['snils_photo_url'], ref)
        )
        updated = cur.fetchone()
        if not updated:
            conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена или не находится в статусе запроса фото'})}
        client_phone = updated[2]
        # Письмо "заявка принята" не отправляем повторно — клиент уже получал его при первой подаче заявки
        create_notification(cur, client_phone, ref, 'status', f'Статус заявки {ref}: {STATUS_LABELS["review"]}', 'Фото документов успешно загружены и приняты. Заявка возвращена на рассмотрение.')
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    # Клиент смотрит свои чеки (без admin-токена)
    if not is_admin and body.get('action') == 'client_list_receipts':
        ref = body.get('ref_number')
        if not ref:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number обязателен'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id, ref_number, receipt_number, receipt_type, amount, file_url, created_at
                FROM {SCHEMA}.loan_receipts WHERE ref_number = %s ORDER BY created_at DESC""",
            (ref,)
        )
        rows = cur.fetchall()
        conn.close()
        receipts = [{
            'id': r[0], 'ref_number': r[1], 'receipt_number': r[2], 'receipt_type': r[3],
            'amount': r[4], 'file_url': r[5], 'created_at': r[6].isoformat() if r[6] else None,
        } for r in rows]
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(receipts)}

    if not is_admin:
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}

    # Список чеков по заявке (админ)
    if body.get('action') == 'list_receipts':
        ref = body.get('ref_number')
        if not ref:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number обязателен'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id, ref_number, receipt_number, receipt_type, amount, file_url, created_at
                FROM {SCHEMA}.loan_receipts WHERE ref_number = %s ORDER BY created_at DESC""",
            (ref,)
        )
        rows = cur.fetchall()
        conn.close()
        receipts = [{
            'id': r[0], 'ref_number': r[1], 'receipt_number': r[2], 'receipt_type': r[3],
            'amount': r[4], 'file_url': r[5], 'created_at': r[6].isoformat() if r[6] else None,
        } for r in rows]
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(receipts)}

    # Сформировать чек вручную (админ)
    if body.get('action') == 'create_receipt':
        ref = body.get('ref_number')
        receipt_type = body.get('receipt_type')
        if not ref or receipt_type not in ('money_sent', 'repaid'):
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number и корректный receipt_type обязательны'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"SELECT full_name, phone, email, days, amount FROM {SCHEMA}.loan_requests WHERE ref_number = %s",
            (ref,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}
        full_name, phone, email, days, loan_amount = row
        amount = body.get('amount') or loan_amount
        cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings WHERE key LIKE 'company_%'")
        company_settings = {r[0]: r[1] for r in cur.fetchall()}
        receipt = generate_and_store_receipt(cur, ref, receipt_type, full_name, phone, email, days, amount, company_settings)
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': headers, 'body': json.dumps(receipt)}

    # Список платежей по заявке
    if body.get('action') == 'list_payments':
        ref = body.get('ref_number')
        if not ref:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number обязателен'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id, ref_number, amount, payment_method, transaction_id, status, created_at
                FROM {SCHEMA}.loan_payments WHERE ref_number = %s ORDER BY created_at DESC""",
            (ref,)
        )
        rows = cur.fetchall()
        conn.close()
        payments = [{
            'id': r[0], 'ref_number': r[1], 'amount': float(r[2]), 'payment_method': r[3],
            'transaction_id': r[4], 'status': r[5], 'created_at': r[6].isoformat() if r[6] else None,
        } for r in rows]
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(payments)}

    # Добавить платёж в историю
    if body.get('action') == 'add_payment':
        ref = body.get('ref_number')
        amount = body.get('amount')
        if not ref or amount is None:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number и amount обязательны'})}
        payment_method = body.get('payment_method') or 'card'
        transaction_id = body.get('transaction_id') or None
        status = body.get('status') or 'success'
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.loan_requests WHERE ref_number = %s", (ref,))
        if not cur.fetchone():
            conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}
        cur.execute(
            f"""INSERT INTO {SCHEMA}.loan_payments (ref_number, amount, payment_method, transaction_id, status)
                VALUES (%s, %s, %s, %s, %s) RETURNING id, ref_number, amount, payment_method, transaction_id, status, created_at""",
            (ref, amount, payment_method, transaction_id, status)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        payment = {
            'id': row[0], 'ref_number': row[1], 'amount': float(row[2]), 'payment_method': row[3],
            'transaction_id': row[4], 'status': row[5], 'created_at': row[6].isoformat() if row[6] else None,
        }
        return {'statusCode': 201, 'headers': headers, 'body': json.dumps(payment)}

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

    # Автоскоринг заявки роботом
    if body.get('action') == 'run_scoring':
        ref = body.get('ref_number')
        if not ref:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number обязателен'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key = 'scoring_debt_threshold'", ())
        row = cur.fetchone()
        try:
            threshold = int(row[0]) if row and row[0] else DEFAULT_DEBT_THRESHOLD
        except (ValueError, TypeError):
            threshold = DEFAULT_DEBT_THRESHOLD
        cur.execute(
            f"SELECT existing_debt_amount, email, phone FROM {SCHEMA}.loan_requests WHERE ref_number = %s",
            (ref,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}
        debt_amount, client_email, client_phone = row
        debt_amount = debt_amount or 0
        approved = debt_amount <= threshold
        new_status = 'approved' if approved else 'rejected'
        reason = (
            f'Долговая нагрузка в норме ({debt_amount:,} ₽ ≤ {threshold:,} ₽)'.replace(',', ' ')
            if approved else
            f'Превышен порог допустимого долга: {debt_amount:,} ₽ > {threshold:,} ₽'.replace(',', ' ')
        )
        client_reason = None if approved else 'Высокая долговая нагрузка'
        cur.execute(
            f"UPDATE {SCHEMA}.loan_requests SET status = %s, rejection_reason = %s, updated_at = NOW() WHERE ref_number = %s",
            (new_status, client_reason, ref)
        )
        default_subject, default_body = DEFAULT_STATUS_EMAIL_TEXT.get(new_status, (STATUS_LABELS.get(new_status, new_status), ''))
        email_settings = get_system_email_settings(cur)
        status_templates = (email_settings.get('status_emails') or {})
        tpl = status_templates.get(new_status) or {}
        notif_text = (tpl.get('body') or default_body).format(ref=ref)
        create_notification(cur, client_phone, ref, 'status', f'Статус заявки {ref}: {STATUS_LABELS.get(new_status, new_status)}', notif_text)
        conn.commit()
        conn.close()
        if client_email:
            send_status_email(client_email, ref, new_status, email_settings)
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'ok': True, 'approved': approved, 'status': new_status, 'reason': reason,
            'debt_amount': debt_amount, 'threshold': threshold,
        })}

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
        if status != 'rejected':
            # Ручная смена статуса оператором — сбрасываем причину автоотказа робота
            fields.append('rejection_reason = %s')
            values.append(None)
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
    for doc_status_field in ('passport_photo_status', 'registration_photo_status', 'income_doc_status', 'selfie_photo_status', 'card_photo_status', 'snils_photo_status'):
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
        f"""UPDATE {SCHEMA}.loan_requests SET {', '.join(fields)} WHERE ref_number = %s
            RETURNING id, email, phone, full_name, days, amount""",
        values
    )
    updated = cur.fetchone()
    if not updated:
        conn.close()
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}

    updated_phone = updated[2]
    updated_full_name = updated[3]
    updated_days = updated[4]
    updated_amount = updated[5]
    email_settings = get_system_email_settings(cur) if status is not None and updated[1] else {}

    if status is not None:
        default_subject, default_body = DEFAULT_STATUS_EMAIL_TEXT.get(status, (STATUS_LABELS.get(status, status), ''))
        status_templates = (email_settings.get('status_emails') or {})
        tpl = status_templates.get(status) or {}
        notif_text = (tpl.get('body') or default_body).format(ref=ref)
        create_notification(cur, updated_phone, ref, 'status', f'Статус заявки {ref}: {STATUS_LABELS.get(status, status)}', notif_text)

    if 'operator_comment' in body and body['operator_comment']:
        create_notification(cur, updated_phone, ref, 'comment', 'Сообщение от оператора', body['operator_comment'])

    # Займ выдан или погашен — формируем фирменный чек и прикладываем к письму
    receipt = None
    if status in ('money_sent', 'repaid'):
        cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings WHERE key LIKE 'company_%'")
        company_settings = {r[0]: r[1] for r in cur.fetchall()}
        receipt = generate_and_store_receipt(
            cur, ref, status, updated_full_name, updated_phone, updated[1] or '', updated_days, updated_amount, company_settings
        )

    conn.commit()
    conn.close()

    if status is not None and updated[1]:
        extra_url = receipt['file_url'] if receipt else ''
        extra_name = RECEIPT_TITLES.get(status, '') if receipt else ''
        send_status_email(updated[1], ref, status, email_settings, extra_url, extra_name)

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'ref_number': ref})}