"""Удаление заявок администратором по списку ref_number."""
import json
import os
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'

def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    if req_headers.get('x-admin-token') != ADMIN_TOKEN:
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}

    body = json.loads(event.get('body') or '{}')
    refs = body.get('ref_numbers', [])
    if not refs or not isinstance(refs, list):
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref_numbers обязателен'})}

    placeholders = ', '.join(['%s'] * len(refs))
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {SCHEMA}.loan_requests WHERE ref_number IN ({placeholders}) RETURNING ref_number", refs)
    deleted = [row[0] for row in cur.fetchall()]
    conn.commit()
    conn.close()

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'deleted': deleted})}
