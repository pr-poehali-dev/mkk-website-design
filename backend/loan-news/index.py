"""Новости и акции: публичное чтение списка/одной новости, CRUD для администратора."""
import json
import os
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'

COLS = ['id', 'title', 'excerpt', 'content', 'image_url', 'published_at', 'is_published', 'created_at', 'updated_at']


def row_to_dict(row):
    d = dict(zip(COLS, row))
    if d.get('published_at'):
        d['published_at'] = d['published_at'].isoformat()
    if d.get('created_at'):
        d['created_at'] = d['created_at'].isoformat()
    if d.get('updated_at'):
        d['updated_at'] = d['updated_at'].isoformat()
    return d


def handler(event: dict, context) -> dict:
    """Публичное получение опубликованных новостей (список или одна по id),
    и полный CRUD для администратора (создание, редактирование, удаление, просмотр всех)."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    req_headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    is_admin = req_headers.get('x-admin-token') == ADMIN_TOKEN
    method = event.get('httpMethod')
    params = event.get('queryStringParameters') or {}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    try:
        if method == 'GET':
            news_id = params.get('id')
            if news_id:
                cur.execute(f"SELECT {', '.join(COLS)} FROM {SCHEMA}.news WHERE id = %s", (news_id,))
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Новость не найдена'})}
                item = row_to_dict(row)
                if not item['is_published'] and not is_admin:
                    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Новость не найдена'})}
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps(item)}

            if is_admin:
                cur.execute(f"SELECT {', '.join(COLS)} FROM {SCHEMA}.news ORDER BY published_at DESC, id DESC")
            else:
                cur.execute(f"SELECT {', '.join(COLS)} FROM {SCHEMA}.news WHERE is_published = true ORDER BY published_at DESC, id DESC")
            rows = cur.fetchall()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps([row_to_dict(r) for r in rows])}

        if not is_admin:
            return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}

        body = json.loads(event.get('body') or '{}')

        if method == 'POST':
            title = (body.get('title') or '').strip()
            content = (body.get('content') or '').strip()
            if not title or not content:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'title и content обязательны'})}
            cur.execute(
                f"""INSERT INTO {SCHEMA}.news (title, excerpt, content, image_url, published_at, is_published)
                    VALUES (%s, %s, %s, %s, COALESCE(%s, CURRENT_DATE), %s)
                    RETURNING {', '.join(COLS)}""",
                (title, body.get('excerpt') or None, content, body.get('image_url') or None,
                 body.get('published_at') or None, body.get('is_published', True))
            )
            row = cur.fetchone()
            conn.commit()
            return {'statusCode': 201, 'headers': headers, 'body': json.dumps(row_to_dict(row))}

        if method == 'PUT':
            news_id = body.get('id')
            if not news_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'id обязателен'})}
            fields = []
            values = []
            for key in ('title', 'excerpt', 'content', 'image_url', 'published_at'):
                if key in body:
                    fields.append(f'{key} = %s')
                    values.append(body[key] or None)
            if 'is_published' in body:
                fields.append('is_published = %s')
                values.append(bool(body['is_published']))
            if not fields:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Нет полей для обновления'})}
            fields.append('updated_at = NOW()')
            values.append(news_id)
            cur.execute(
                f"UPDATE {SCHEMA}.news SET {', '.join(fields)} WHERE id = %s RETURNING {', '.join(COLS)}",
                values
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Новость не найдена'})}
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps(row_to_dict(row))}

        if method == 'DELETE':
            news_id = params.get('id') or json.loads(event.get('body') or '{}').get('id')
            if not news_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'id обязателен'})}
            cur.execute(f"DELETE FROM {SCHEMA}.news WHERE id = %s RETURNING id", (news_id,))
            deleted = cur.fetchone()
            conn.commit()
            if not deleted:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Новость не найдена'})}
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Метод не поддерживается'})}
    finally:
        conn.close()
