"""Чат на сайте: бот отвечает на вопросы клиента и передаёт диалог оператору, админка ведёт переписку."""
import json
import os
import re
import secrets
from datetime import datetime, timezone
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
ADMIN_TOKEN = 'admin_zaimy_plus'

STATUS_LABELS = {
    'review': 'На скоринге', 'approved': 'Одобрено', 'issued': 'Договор подписан',
    'money_sent': 'Деньги выданы', 'rejected': 'Отказано', 'transfer_error': 'Ошибка перевода',
    'repaid': 'Займ погашен',
}

MSG_COLS = ['id', 'session_id', 'sender', 'text', 'file_url', 'is_read', 'created_at']
SESSION_COLS = ['id', 'session_key', 'client_name', 'client_phone', 'ref_number', 'status',
                'operator_name', 'rating', 'rating_comment', 'created_at', 'updated_at',
                'accepted_at', 'closed_at', 'bot_step', 'bot_phone']


def msg_to_dict(row):
    d = dict(zip(MSG_COLS, row))
    if d.get('created_at'):
        d['created_at'] = d['created_at'].isoformat()
    return d


def session_to_dict(row):
    d = dict(zip(SESSION_COLS, row))
    for k in ('created_at', 'updated_at', 'accepted_at', 'closed_at'):
        if d.get(k):
            d[k] = d[k].isoformat()
    return d


def only_digits(s: str) -> str:
    return re.sub(r'\D', '', s or '')


def get_settings(cur) -> dict:
    cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings WHERE key IN "
                f"('operator_name','operator_avatar_url','operator_status','chat_working_hours')")
    return {r[0]: r[1] for r in cur.fetchall()}


def add_message(cur, session_id: int, sender: str, text: str = None, file_url: str = None):
    cur.execute(
        f"""INSERT INTO {SCHEMA}.chat_messages (session_id, sender, text, file_url, is_read)
            VALUES (%s, %s, %s, %s, %s) RETURNING {', '.join(MSG_COLS)}""",
        (session_id, sender, text, file_url, sender != 'client')
    )
    return cur.fetchone()


def bump_session(cur, session_id: int, **fields):
    if not fields:
        cur.execute(f"UPDATE {SCHEMA}.chat_sessions SET updated_at = NOW() WHERE id = %s", (session_id,))
        return
    sets = ', '.join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [session_id]
    cur.execute(f"UPDATE {SCHEMA}.chat_sessions SET {sets}, updated_at = NOW() WHERE id = %s", values)


def operator_greeting(settings: dict) -> str:
    status = settings.get('operator_status', 'online')
    hours = settings.get('chat_working_hours') or 'ежедневно с 09:00 до 18:00 по мск'
    if status == 'offline':
        return f'Оператор сейчас не работает. Время работы: {hours}. Ваше сообщение обязательно увидят и ответят в рабочее время.'
    if status == 'busy':
        return 'Оператор сейчас занят другим клиентом и ответит вам в течение нескольких минут.'
    return 'Обращение передано оператору — он ответит вам в течение 2 минут.'


MENU_TEXT = 'Чем я могу помочь?\n📋 Узнать статус заявки\n🙋 Позвать оператора\n❓ Другой вопрос'


def handler(event: dict, context) -> dict:
    """Публичный чат для клиента (start/send/menu_select/get_messages/rate) и админ-интерфейс
    для оператора (list/get/admin_send/admin_accept/admin_close) с проверкой x-admin-token."""
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
        # ---- Админ: список диалогов ----
        if event.get('httpMethod') == 'GET' and params.get('admin') == '1':
            if not is_admin:
                return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}
            session_key = params.get('session_key')
            if session_key:
                cur.execute(f"SELECT {', '.join(SESSION_COLS)} FROM {SCHEMA}.chat_sessions WHERE session_key = %s", (session_key,))
                srow = cur.fetchone()
                if not srow:
                    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Диалог не найден'})}
                cur.execute(
                    f"SELECT {', '.join(MSG_COLS)} FROM {SCHEMA}.chat_messages WHERE session_id = %s ORDER BY created_at ASC",
                    (srow[0],)
                )
                mrows = cur.fetchall()
                cur.execute(f"UPDATE {SCHEMA}.chat_messages SET is_read = true WHERE session_id = %s AND sender = 'client'", (srow[0],))
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                    'session': session_to_dict(srow), 'messages': [msg_to_dict(r) for r in mrows],
                })}
            cur.execute(f"SELECT {', '.join(SESSION_COLS)} FROM {SCHEMA}.chat_sessions ORDER BY updated_at DESC LIMIT 200")
            rows = cur.fetchall()
            sessions = [session_to_dict(r) for r in rows]
            for s in sessions:
                cur.execute(
                    f"SELECT COUNT(*) FROM {SCHEMA}.chat_messages WHERE session_id = %s AND sender = 'client' AND is_read = false",
                    (s['id'],)
                )
                s['unread_count'] = cur.fetchone()[0]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps(sessions)}

        # ---- Клиент: получить новые сообщения (поллинг) ----
        if event.get('httpMethod') == 'GET':
            session_key = params.get('session_key')
            if not session_key:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'session_key обязателен'})}
            cur.execute(f"SELECT {', '.join(SESSION_COLS)} FROM {SCHEMA}.chat_sessions WHERE session_key = %s", (session_key,))
            srow = cur.fetchone()
            if not srow:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Диалог не найден'})}
            after_id = int(params.get('after_id') or 0)
            cur.execute(
                f"SELECT {', '.join(MSG_COLS)} FROM {SCHEMA}.chat_messages WHERE session_id = %s AND id > %s ORDER BY created_at ASC",
                (srow[0], after_id)
            )
            mrows = cur.fetchall()
            cur.execute(f"UPDATE {SCHEMA}.chat_messages SET is_read = true WHERE session_id = %s AND sender IN ('operator','bot','system')", (srow[0],))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'session': session_to_dict(srow), 'messages': [msg_to_dict(r) for r in mrows],
            })}

        body = json.loads(event.get('body') or '{}')
        action = body.get('action')

        # ---- Админ: действия оператора ----
        if is_admin and action in ('admin_send', 'admin_accept', 'admin_close'):
            session_key = body.get('session_key')
            if not session_key:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'session_key обязателен'})}
            cur.execute(f"SELECT id, status FROM {SCHEMA}.chat_sessions WHERE session_key = %s", (session_key,))
            srow = cur.fetchone()
            if not srow:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Диалог не найден'})}
            session_id, cur_status = srow
            settings = get_settings(cur)
            operator_name = settings.get('operator_name') or 'Оператор'

            if action == 'admin_accept':
                now_dt = datetime.now(timezone.utc)
                now_label = now_dt.astimezone().strftime('%H:%M')
                bump_session(cur, session_id, status='active', operator_name=operator_name, accepted_at=now_dt)
                add_message(cur, session_id, 'system', f'Диалог принят оператором {operator_name} в {now_label}')
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

            if action == 'admin_close':
                bump_session(cur, session_id, status='closed', closed_at=datetime.now(timezone.utc))
                add_message(cur, session_id, 'system', 'Диалог закрыт оператором')
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

            # admin_send
            text = (body.get('text') or '').strip()
            file_url = body.get('file_url')
            if not text and not file_url:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'text или file_url обязателен'})}
            fields = {}
            if cur_status in ('bot', 'waiting_operator'):
                fields['status'] = 'active'
                fields['operator_name'] = operator_name
                fields['accepted_at'] = datetime.now(timezone.utc)
            if fields:
                bump_session(cur, session_id, **fields)
            row = add_message(cur, session_id, 'operator', text or None, file_url)
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps(msg_to_dict(row))}

        # ---- Клиент: старт диалога ----
        if action == 'start':
            session_key = secrets.token_urlsafe(16)
            client_name = (body.get('name') or '').strip() or None
            client_phone = (body.get('phone') or '').strip() or None
            settings = get_settings(cur)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.chat_sessions (session_key, client_name, client_phone, status, bot_step)
                    VALUES (%s, %s, %s, 'bot', 'menu') RETURNING {', '.join(SESSION_COLS)}""",
                (session_key, client_name, client_phone)
            )
            srow = cur.fetchone()
            greet = add_message(cur, srow[0], 'bot', f'Здравствуйте! 👋\n{MENU_TEXT}')
            conn.commit()
            return {'statusCode': 201, 'headers': headers, 'body': json.dumps({
                'session': session_to_dict(srow), 'messages': [msg_to_dict(greet)],
                'operator_name': settings.get('operator_name') or 'Оператор',
                'operator_avatar_url': settings.get('operator_avatar_url') or '',
                'working_hours': settings.get('chat_working_hours') or '',
            })}

        session_key = body.get('session_key')
        if not session_key:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'session_key обязателен'})}
        cur.execute(f"SELECT {', '.join(SESSION_COLS)} FROM {SCHEMA}.chat_sessions WHERE session_key = %s", (session_key,))
        srow = cur.fetchone()
        if not srow:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Диалог не найден'})}
        s = session_to_dict(srow)
        session_id = s['id']

        # ---- Клиент: оценка диалога ----
        if action == 'rate':
            if s['status'] != 'closed':
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Диалог ещё не закрыт'})}
            rating = body.get('rating')
            if rating not in (1, 2, 3, 4, 5):
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'rating от 1 до 5'})}
            comment = (body.get('comment') or '').strip() or None
            bump_session(cur, session_id, rating=rating, rating_comment=comment)
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        if s['status'] == 'closed':
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Диалог закрыт'})}

        # ---- Клиент: выбор пункта меню бота ----
        if action == 'menu_select':
            option = body.get('option')
            if option == 'status':
                add_message(cur, session_id, 'client', '📋 Узнать статус заявки')
                bump_session(cur, session_id, bot_step='ask_phone')
                row = add_message(cur, session_id, 'bot', 'Назовите номер телефона, указанный в заявке.')
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(row)]})}
            if option == 'operator':
                add_message(cur, session_id, 'client', '🙋 Позвать оператора')
                settings = get_settings(cur)
                bump_session(cur, session_id, status='waiting_operator', bot_step=None)
                row = add_message(cur, session_id, 'bot', operator_greeting(settings))
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(row)]})}
            if option == 'other':
                add_message(cur, session_id, 'client', '❓ Другой вопрос')
                settings = get_settings(cur)
                bump_session(cur, session_id, status='waiting_operator', bot_step=None)
                row = add_message(cur, session_id, 'bot', f'Опишите ваш вопрос — {operator_greeting(settings)}')
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(row)]})}
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестный пункт меню'})}

        # ---- Клиент: свободное сообщение ----
        if action == 'send':
            text = (body.get('text') or '').strip()
            file_url = body.get('file_url')
            if not text and not file_url:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'text или file_url обязателен'})}
            add_message(cur, session_id, 'client', text or None, file_url)

            bot_replies = []
            if s['status'] == 'bot':
                step = s.get('bot_step')
                if step == 'ask_phone':
                    digits = only_digits(text)
                    if len(digits) < 10:
                        row = add_message(cur, session_id, 'bot', 'Не похоже на номер телефона. Введите номер в формате +7XXXXXXXXXX.')
                        bot_replies.append(row)
                    else:
                        bump_session(cur, session_id, bot_phone=digits, bot_step='ask_passport')
                        row = add_message(cur, session_id, 'bot', 'Спасибо. Теперь укажите серию и номер паспорта (только цифры).')
                        bot_replies.append(row)
                elif step == 'ask_passport':
                    passport_digits = only_digits(text)
                    phone_digits = s.get('bot_phone') or ''
                    cur.execute(
                        f"""SELECT ref_number, status, amount, days FROM {SCHEMA}.loan_requests
                            WHERE RIGHT(REGEXP_REPLACE(phone, '\\D', '', 'g'), 10) = RIGHT(%s, 10)
                              AND REGEXP_REPLACE(COALESCE(passport, ''), '\\D', '', 'g') = %s
                            ORDER BY created_at DESC LIMIT 1""",
                        (phone_digits, passport_digits)
                    )
                    found = cur.fetchone()
                    bump_session(cur, session_id, bot_step='menu')
                    if found:
                        ref, status, amount, days = found
                        label = STATUS_LABELS.get(status, status)
                        text_reply = f'Заявка {ref}\nСтатус: {label}\nСумма: {amount:,} ₽\nСрок: {days} дн.'.replace(',', ' ')
                        row = add_message(cur, session_id, 'bot', text_reply)
                        bot_replies.append(row)
                    else:
                        row = add_message(cur, session_id, 'bot', 'Не удалось найти заявку по указанным данным. Хотите позвать оператора?')
                        bot_replies.append(row)
                    row2 = add_message(cur, session_id, 'bot', MENU_TEXT)
                    bot_replies.append(row2)
                else:
                    row = add_message(cur, session_id, 'bot', 'Пожалуйста, воспользуйтесь кнопками ниже, либо позовите оператора для остальных вопросов.')
                    bot_replies.append(row)
                    row2 = add_message(cur, session_id, 'bot', MENU_TEXT)
                    bot_replies.append(row2)
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(r) for r in bot_replies]})}

        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестное действие'})}
    finally:
        conn.close()