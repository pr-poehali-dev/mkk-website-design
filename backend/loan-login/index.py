"""Вход клиента по телефону и паролю."""
import json
import os
import hashlib
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']

def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    phone = body.get('phone', '').strip()
    password = body.get('password', '').strip()

    if not phone or not password:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите телефон и пароль'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"""SELECT id, ref_number, full_name, phone, passport, amount, days, status, created_at, is_blocked
            FROM {SCHEMA}.loan_requests
            WHERE phone = %s AND password_hash = %s""",
        (phone, hash_password(password))
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Неверный телефон или пароль'})}

    cols = ['id', 'ref_number', 'full_name', 'phone', 'passport', 'amount', 'days', 'status', 'created_at', 'is_blocked']
    user = dict(zip(cols, row))
    user['created_at'] = user['created_at'].isoformat()

    if user.get('is_blocked'):
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Доступ в личный кабинет заблокирован. Обратитесь к оператору.'})}

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps(user)}