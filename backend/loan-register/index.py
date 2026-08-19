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
    required = ['full_name', 'phone', 'amount', 'days', 'email']
    for field in required:
        if not body.get(field):
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': f'Поле {field} обязательно'})}

    email = body['email'].strip().lower()

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Проверяем, что email был подтверждён кодом из письма незадолго до отправки заявки
    cur.execute(
        f"""SELECT id FROM {SCHEMA}.verification_codes
            WHERE email = %s AND purpose = 'register' AND used = true
              AND created_at > NOW() - INTERVAL '30 minutes'
            ORDER BY created_at DESC LIMIT 1""",
        (email,)
    )
    if not cur.fetchone():
        conn.close()
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Email не подтверждён кодом. Запросите и введите код из письма.'})}

    phone = body['phone']
    full_name = body['full_name']
    passport = body.get('passport') or None

    # Проверяем существующего клиента по телефону, либо по совпадению ФИО + паспорта
    if passport:
        cur.execute(
            f"""SELECT id, status, password_hash, ref_number, created_at, phone
                FROM {SCHEMA}.loan_requests
                WHERE phone = %s
                   OR (passport = %s AND LOWER(TRIM(full_name)) = LOWER(TRIM(%s)))
                ORDER BY created_at DESC LIMIT 1""",
            (phone, passport, full_name)
        )
    else:
        cur.execute(
            f"""SELECT id, status, password_hash, ref_number, created_at, phone
                FROM {SCHEMA}.loan_requests WHERE phone = %s ORDER BY created_at DESC LIMIT 1""",
            (phone,)
        )
    existing = cur.fetchone()
    if existing:
        ex_status = existing[1]
        ex_phone = existing[5]
        if ex_status not in ('repaid', 'rejected'):
            # Клиент с такими данными уже зарегистрирован и имеет активную заявку
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({
                'error': 'Клиент с такими данными (ФИО, паспорт или телефон) уже зарегистрирован. Войдите в личный кабинет, чтобы продолжить.'
            })}

    # Пароль: plain → hash, или hash напрямую, или берём из существующей заявки (только если совпал телефон)
    if body.get('password'):
        pwd_hash = hash_password(body['password'])
    elif body.get('password_hash'):
        pwd_hash = body['password_hash']
    elif existing and existing[5] == phone and existing[2]:
        pwd_hash = existing[2]
    else:
        conn.close()
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Поле password обязательно'})}

    # Номер заявки: берём максимальный существующий номер (не просто COUNT,
    # т.к. удаление старых заявок могло привести к повторному номеру и конфликту уникальности)
    cur.execute(
        f"SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(ref_number, '[^0-9]', '', 'g') AS INTEGER)), 1042) FROM {SCHEMA}.loan_requests"
    )
    max_num = cur.fetchone()[0]

    row = None
    for attempt in range(5):
        ref_number = f"ZP-{max_num + 1 + attempt}"
        try:
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
                    pwd_hash,
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
                    email,
                    body.get('passport_photo_url') or None,
                )
            )
            row = cur.fetchone()
            break
        except psycopg2.IntegrityError:
            conn.rollback()
            continue

    if row is None:
        conn.close()
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'Не удалось сгенерировать номер заявки. Попробуйте ещё раз.'})}

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