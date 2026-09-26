"""Пиксель для отслеживания открытия писем клиентом (открыл/прочитал письмо)."""
import os
import base64
import psycopg2  # noqa: F401

SCHEMA = os.environ['MAIN_DB_SCHEMA']

# 1x1 прозрачный GIF
PIXEL_GIF = base64.b64decode('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==')


def handler(event: dict, context) -> dict:
    """Отдаёт прозрачный пиксель 1x1 и фиксирует момент открытия письма по tracking_id из query-параметра.
    Args: event - dict с httpMethod, queryStringParameters (tid); context - объект с request_id.
    Returns: HTTP-ответ с картинкой image/gif (isBase64Encoded=true).
    """
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    params = event.get('queryStringParameters') or {}
    tid = params.get('tid')

    if tid:
        try:
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            cur.execute(
                f"""UPDATE {SCHEMA}.email_log
                    SET opened_at = COALESCE(opened_at, NOW()), open_count = open_count + 1
                    WHERE tracking_id = %s""",
                (tid,)
            )
            conn.commit()
            conn.close()
        except Exception:
            pass

    return {
        'statusCode': 200,
        'headers': headers,
        'body': base64.b64encode(PIXEL_GIF).decode('ascii'),
        'isBase64Encoded': True,
    }