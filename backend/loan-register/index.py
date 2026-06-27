"""Регистрация новой заявки на займ."""
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
    required = ['full_name', 'phone', 'password', 'amount', 'days']
    for field in required:
        if not body.get(field):
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': f'Поле {field} обязательно'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(f"SELECT id FROM {SCHEMA}.loan_requests WHERE phone = %s", (body['phone'],))
    if cur.fetchone():
        conn.close()
        return {'statusCode': 409, 'headers': headers, 'body': json.dumps({'error': 'Телефон уже зарегистрирован'})}

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.loan_requests")
    count = cur.fetchone()[0]
    ref_number = f"ZP-{1042 + count + 1}"

    cur.execute(
        f"""INSERT INTO {SCHEMA}.loan_requests
            (ref_number, full_name, phone, password_hash, birth_date, passport, passport_by, amount, days,
             address_residence, address_registration, work_place, work_phone, income_doc_url, email, passport_photo_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, ref_number, status, created_at""",
        (
            ref_number,
            body['full_name'],
            body['phone'],
            hash_password(body['password']),
            body.get('birth_date') or None,
            body.get('passport') or None,
            body.get('passport_by') or None,
            int(body['amount']),
            int(body['days']),
            body.get('address_residence') or None,
            body.get('address_registration') or None,
            body.get('work_place') or None,
            body.get('work_phone') or None,
            body.get('income_doc_url') or None,
            body.get('email') or None,
            body.get('passport_photo_url') or None,
        )
    )
    row = cur.fetchone()
    conn.commit()
    conn.close()

    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({
            'id': row[0],
            'ref_number': row[1],
            'status': row[2],
            'created_at': row[3].isoformat(),
        })
    }