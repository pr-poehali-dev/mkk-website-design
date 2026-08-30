"""Одноразовая ссылка для идентификации клиента (фото паспорта, селфи с паспортом, согласия)."""
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'
LINK_TTL_MINUTES = 40

STATUS_LABELS = {
    'review': 'На скоринге', 'approved': 'Одобрено', 'issued': 'Договор подписан',
    'money_sent': 'Деньги выданы', 'rejected': 'Отказано', 'transfer_error': 'Ошибка перевода',
    'repaid': 'Займ погашен',
}


def create_notification(cur, phone: str, ref_number: str, n_type: str, title: str, message: str) -> None:
    if not phone:
        return
    cur.execute(
        f"""INSERT INTO {SCHEMA}.notifications (phone, ref_number, type, title, message)
            VALUES (%s, %s, %s, %s, %s)""",
        (phone, ref_number, n_type, title, message)
    )


def handler(event: dict, context) -> dict:
    """Генерирует одноразовую ссылку идентификации для заявки (админ), отдаёт данные по токену
    и принимает от клиента фото документов вместе с согласиями."""
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
                       passport_photo_status, selfie_photo_status, status
                FROM {SCHEMA}.loan_requests WHERE identify_token = %s""",
            (token,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'not_found'})}
        ref_number, full_name, expires_at, submitted_at, passport_status, selfie_status, status = row
        now = datetime.now(timezone.utc)
        if submitted_at:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'state': 'submitted', 'ref_number': ref_number, 'full_name': full_name,
                'passport_photo_status': passport_status, 'selfie_photo_status': selfie_status,
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

    # Генерация ссылки — только админ
    if action == 'generate':
        if not is_admin:
            conn.close()
            return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}
        ref = body.get('ref_number')
        if not ref:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_number обязателен'})}
        token = secrets.token_urlsafe(24)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=LINK_TTL_MINUTES)
        cur.execute(
            f"""UPDATE {SCHEMA}.loan_requests
                SET identify_token = %s, identify_token_expires_at = %s, identify_submitted_at = NULL
                WHERE ref_number = %s RETURNING id""",
            (token, expires_at, ref)
        )
        updated = cur.fetchone()
        if not updated:
            conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}
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
        consent_pd = bool(body.get('consent_pd'))
        consent_transfer = bool(body.get('consent_transfer'))
        consent_sms = bool(body.get('consent_sms'))
        if not passport_photo_url or not selfie_photo_url:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Нужны оба фото'})}
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
                    identify_consent_pd = %s, identify_consent_transfer = %s, identify_consent_sms = %s,
                    identify_submitted_at = NOW(), identify_token = NULL, identify_token_expires_at = NULL,
                    updated_at = NOW()
                WHERE ref_number = %s""",
            (passport_photo_url, selfie_photo_url, consent_pd, consent_transfer, consent_sms, ref_number)
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