"""Обновление заявки администратором: статус, сумма, срок, комментарий оператора."""
import json
import os
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'
VALID_STATUSES = ('review', 'approved', 'issued', 'rejected')

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
