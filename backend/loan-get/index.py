"""Получение заявки по ref_number (для кабинета) или всех заявок (для админки)."""
import json
import os
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'

COLS = ['id', 'ref_number', 'full_name', 'phone', 'passport', 'passport_by',
        'birth_date', 'amount', 'days', 'status', 'operator_comment', 'created_at',
        'address_residence', 'address_registration', 'work_place', 'work_phone', 'income_doc_url',
        'payment_bank', 'is_blocked', 'email', 'doc_urls']

def row_to_dict(row):
    d = dict(zip(COLS, row))
    if d.get('created_at'):
        d['created_at'] = d['created_at'].isoformat()
    if d.get('birth_date'):
        d['birth_date'] = d['birth_date'].isoformat()
    return d

def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    params = event.get('queryStringParameters') or {}
    ref = params.get('ref')
    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    is_admin = req_headers.get('x-admin-token') == ADMIN_TOKEN

    # Публичный запрос настроек сайта
    if params.get('action') == 'settings':
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings")
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({r[0]: r[1] for r in rows})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if is_admin:
        cur.execute(
            f"""SELECT id, ref_number, full_name, phone, passport, passport_by,
                       birth_date, amount, days, status, operator_comment, created_at,
                       address_residence, address_registration, work_place, work_phone, income_doc_url,
                       payment_bank, is_blocked, email, doc_urls
                FROM {SCHEMA}.loan_requests ORDER BY created_at DESC"""
        )
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps([row_to_dict(r) for r in rows])}

    if not ref:
        conn.close()
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ref обязателен'})}

    cur.execute(
        f"""SELECT id, ref_number, full_name, phone, passport, passport_by,
                   birth_date, amount, days, status, operator_comment, created_at,
                   address_residence, address_registration, work_place, work_phone, income_doc_url,
                   payment_bank, is_blocked, email, doc_urls
            FROM {SCHEMA}.loan_requests WHERE ref_number = %s""",
        (ref,)
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заявка не найдена'})}

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps(row_to_dict(row))}