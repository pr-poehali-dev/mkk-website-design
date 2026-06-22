"""Смена статуса заявки администратором."""
import json
import os
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'
VALID_STATUSES = ('review', 'approved', 'issued', 'rejected')

def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = req_headers.get('x-admin-token', '')
    if token != ADMIN_TOKEN:
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}

    body = json.loads(event.get('body') or '{}')
    ref = body.get('ref_number')
    status = body.get('status')

    if not ref or status not in VALID_STATUSES:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверные параметры'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.loan_requests SET status = %s, updated_at = NOW() WHERE ref_number = %s RETURNING id",
        (status, ref)
    )
    updated = cur.fetchone()
    conn.commit()
    conn.close()

    if not updated:
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'ref_number': ref, 'status': status})}