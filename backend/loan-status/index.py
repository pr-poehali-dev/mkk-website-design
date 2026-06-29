"""Обновление/удаление заявок администратором."""
import json
import os
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'
VALID_STATUSES = ('review', 'approved', 'issued', 'money_sent', 'rejected', 'transfer_error')

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

    status = body.get('status')
    if status is not None:
        if status not in VALID_STATUSES:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверный статус'})}
        fields.append('status = %s')
        values.append(status)

    if 'amount' in body:
        fields.append('amount = %s')
        values.append(int(body['amount']))

    if 'days' in body:
        fields.append('days = %s')
        values.append(int(body['days']))

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
        f"UPDATE {SCHEMA}.loan_requests SET {', '.join(fields)} WHERE ref_number = %s RETURNING id",
        values
    )
    updated = cur.fetchone()
    conn.commit()
    conn.close()

    if not updated:
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'ref_number': ref})}