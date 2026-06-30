"""Вход клиента по телефону и паролю. Смена пароля."""
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
    if body.get('action') == 'admin_set_password':
        admin_token = event.get('headers', {}).get('x-admin-token', '')
        if admin_token != 'admin_zaimy_plus':
            return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}
        phone = body.get('phone', '').strip()
        new_password = body.get('new_password', '').strip()
        if not phone or not new_password:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Заполните все поля'})}
        if len(new_password) < 4:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Пароль должен быть не менее 4 символов'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.loan_requests SET password_hash = %s, password_plain = %s WHERE phone = %s", (hash_password(new_password), new_password, phone))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    if body.get('action') == 'change_password':
        phone = body.get('phone', '').strip()
        old_password = body.get('old_password', '').strip()
        new_password = body.get('new_password', '').strip()
        if not phone or not old_password or not new_password:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Заполните все поля'})}
        if len(new_password) < 4:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Новый пароль должен быть не менее 4 символов'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.loan_requests WHERE phone = %s AND password_hash = %s", (phone, hash_password(old_password)))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Текущий пароль неверный'})}
        cur.execute(f"UPDATE {SCHEMA}.loan_requests SET password_hash = %s WHERE phone = %s", (hash_password(new_password), phone))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    phone = body.get('phone', '').strip()
    password = body.get('password', '').strip()

    if not phone or not password:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите телефон и пароль'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"""SELECT id, ref_number, full_name, phone, passport, amount, days, status, created_at, is_blocked
            FROM {SCHEMA}.loan_requests
            WHERE phone = %s AND password_hash = %s
            ORDER BY created_at DESC LIMIT 1""",
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