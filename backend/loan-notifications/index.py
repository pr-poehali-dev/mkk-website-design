"""Уведомления клиента в личном кабинете: получение списка (по телефону), отметка прочитанным, создание (админ/системно)."""
import json
import os
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'

COLS = ['id', 'phone', 'ref_number', 'type', 'title', 'message', 'is_read', 'created_at']


def row_to_dict(row):
    d = dict(zip(COLS, row))
    if d.get('created_at'):
        d['created_at'] = d['created_at'].isoformat()
    return d


def handler(event: dict, context) -> dict:
    """Клиент получает свои уведомления по телефону (GET ?phone=), отмечает прочитанными (POST action=mark_read);
    администратор/другие backend-функции создают уведомление (POST с x-admin-token)."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    is_admin = req_headers.get('x-admin-token') == ADMIN_TOKEN
    params = event.get('queryStringParameters') or {}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    try:
        if event.get('httpMethod') == 'GET':
            phone = params.get('phone')
            if not phone:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'phone обязателен'})}
            cur.execute(
                f"SELECT {', '.join(COLS)} FROM {SCHEMA}.notifications WHERE phone = %s ORDER BY created_at DESC LIMIT 50",
                (phone,)
            )
            rows = cur.fetchall()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps([row_to_dict(r) for r in rows])}

        body = json.loads(event.get('body') or '{}')

        if body.get('action') == 'mark_read':
            phone = body.get('phone')
            ids = body.get('ids')
            if not phone:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'phone обязателен'})}
            if ids:
                placeholders = ', '.join(['%s'] * len(ids))
                cur.execute(
                    f"UPDATE {SCHEMA}.notifications SET is_read = true WHERE phone = %s AND id IN ({placeholders})",
                    (phone, *ids)
                )
            else:
                cur.execute(f"UPDATE {SCHEMA}.notifications SET is_read = true WHERE phone = %s", (phone,))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        # Создание уведомления — только системно (админ-токен, используется другими backend-функциями)
        if not is_admin:
            return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}

        phone = (body.get('phone') or '').strip()
        n_type = body.get('type') or 'info'
        title = (body.get('title') or '').strip()
        message = body.get('message')
        ref_number = body.get('ref_number')
        if not phone or not title:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'phone и title обязательны'})}
        cur.execute(
            f"""INSERT INTO {SCHEMA}.notifications (phone, ref_number, type, title, message)
                VALUES (%s, %s, %s, %s, %s) RETURNING {', '.join(COLS)}""",
            (phone, ref_number, n_type, title, message)
        )
        row = cur.fetchone()
        conn.commit()
        return {'statusCode': 201, 'headers': headers, 'body': json.dumps(row_to_dict(row))}
    finally:
        conn.close()
