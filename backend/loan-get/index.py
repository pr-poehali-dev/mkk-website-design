"""Получение заявки по ref_number (для кабинета) или всех заявок (для админки)."""
import json
import os
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'

def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    params = event.get('queryStringParameters') or {}
    ref = params.get('ref')
    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    is_admin = req_headers.get('x-admin-token') == ADMIN_TOKEN

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if is_admin:
        cur.execute(
            f"""SELECT id, ref_number, full_name, phone, passport, amount, days, status, created_at
                FROM {SCHEMA}.loan_requests ORDER BY created_at DESC"""
        )
        cols = ['id', 'ref_number', 'full_name', 'phone', 'passport', 'amount', 'days', 'status', 'created_at']
        rows = cur.fetchall()
        conn.close()
        result = []
        for row in rows:
            d = dict(zip(cols, row))
            d['created_at'] = d['created_at'].isoformat()
            result.append(d)
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(result)}

    if not ref:
        conn.close()
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref обязателен'})}

    cur.execute(
        f"""SELECT id, ref_number, full_name, phone, passport, amount, days, status, created_at
            FROM {SCHEMA}.loan_requests WHERE ref_number = %s""",
        (ref,)
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}

    cols = ['id', 'ref_number', 'full_name', 'phone', 'passport', 'amount', 'days', 'status', 'created_at']
    d = dict(zip(cols, row))
    d['created_at'] = d['created_at'].isoformat()
    return {'statusCode': 200, 'headers': headers, 'body': json.dumps(d)}