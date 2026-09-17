"""Чат на сайте: бот отвечает на вопросы клиента и передаёт диалог оператору, админка ведёт переписку."""
import json
import os
import re
import secrets
from datetime import datetime, timezone, timedelta
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
                'accepted_at', 'closed_at', 'bot_step', 'bot_phone',
                'operator_requested_at', 'wait_notice_sent', 'pending_operator_prefix']

WAIT_NOTICE_AFTER_MINUTES = 3
WAIT_NOTICE_TEXT = 'Оператор немного задерживается. Пожалуйста, подождите ещё немного — он обязательно ответит.'

DEFAULT_GREETING = 'Здравствуйте! 👋'
DEFAULT_MENU_ITEMS = [
    {'id': 'status', 'emoji': '📋', 'label': 'Узнать статус заявки', 'type': 'status'},
    {'id': 'operator', 'emoji': '🙋', 'label': 'Позвать оператора', 'type': 'operator'},
    {'id': 'terms', 'emoji': '📄', 'label': 'Условия займа', 'type': 'text',
     'text': 'Сумма займа: от 1 000 до 100 000 ₽\nСрок: от 7 до 30 дней\nСтавка: 0,8% в день\n'
             'Первый займ до 30 000 ₽ доступен без переплаты для новых клиентов.\n'
             'Никаких скрытых комиссий — итоговая сумма к возврату видна в калькуляторе ещё до подачи заявки.'},
    {'id': 'change_phone', 'emoji': '📱', 'label': 'Как сменить номер', 'type': 'operator',
     'prefix': 'По вопросу смены номера телефона подключаю оператора. '},
    {'id': 'appeal', 'emoji': '📝', 'label': 'Оставить обращение', 'type': 'appeal',
     'text': 'Вы можете оставить обращение через специальную форму на сайте.\n/appeal'},
    {'id': 'insurance', 'emoji': '🛡', 'label': 'Вернуть страховку', 'type': 'text',
     'text': 'Для возврата страховки по займу вам надо написать нам на почту 📩 мы ответим вам в рабочее '
             'время до 12 рабочих дней с момента получения вашего обращения.'},
    {'id': 'other', 'emoji': '❓', 'label': 'Другой вопрос', 'type': 'operator',
     'prefix': 'Опишите ваш вопрос — '},
]


def msg_to_dict(row):
    d = dict(zip(MSG_COLS, row))
    if d.get('created_at'):
        d['created_at'] = d['created_at'].isoformat()
    return d


def session_to_dict(row):
    d = dict(zip(SESSION_COLS, row))
    for k in ('created_at', 'updated_at', 'accepted_at', 'closed_at', 'operator_requested_at'):
        if d.get(k):
            d[k] = d[k].isoformat()
    return d


def only_digits(s: str) -> str:
    return re.sub(r'\D', '', s or '')


def get_settings(cur) -> dict:
    cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings WHERE key IN "
                f"('operator_name','operator_avatar_url','operator_status','chat_working_hours',"
                f"'chat_greeting_text','chat_menu_items')")
    return {r[0]: r[1] for r in cur.fetchall()}


def get_menu_config(settings: dict):
    greeting = settings.get('chat_greeting_text') or DEFAULT_GREETING
    items = DEFAULT_MENU_ITEMS
    raw = settings.get('chat_menu_items')
    if raw:
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list) and parsed:
                items = parsed
        except (ValueError, TypeError):
            pass
    return greeting, items


def build_menu_text(items) -> str:
    return 'Чем я могу помочь?'


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
    return 'Обращение передано оператору — он ответит вам в течение 3 минут.'


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
            s = session_to_dict(srow)
            session_id = s['id']

            # Если оператор задерживается — один раз мягко предупреждаем клиента
            if (s['status'] == 'waiting_operator' and not s['wait_notice_sent'] and s['operator_requested_at']):
                requested_at = datetime.fromisoformat(s['operator_requested_at'])
                if datetime.now(timezone.utc) - requested_at > timedelta(minutes=WAIT_NOTICE_AFTER_MINUTES):
                    add_message(cur, session_id, 'bot', WAIT_NOTICE_TEXT)
                    bump_session(cur, session_id, wait_notice_sent=True)
                    conn.commit()

            after_id = int(params.get('after_id') or 0)
            cur.execute(
                f"SELECT {', '.join(MSG_COLS)} FROM {SCHEMA}.chat_messages WHERE session_id = %s AND id > %s ORDER BY created_at ASC",
                (session_id, after_id)
            )
            mrows = cur.fetchall()
            cur.execute(f"UPDATE {SCHEMA}.chat_messages SET is_read = true WHERE session_id = %s AND sender IN ('operator','bot','system')", (session_id,))
            conn.commit()

            cur.execute(f"SELECT {', '.join(SESSION_COLS)} FROM {SCHEMA}.chat_sessions WHERE id = %s", (session_id,))
            srow = cur.fetchone()
            settings = get_settings(cur)
            _, items = get_menu_config(settings)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'session': session_to_dict(srow), 'messages': [msg_to_dict(r) for r in mrows],
                'operator_name': settings.get('operator_name') or 'Оператор',
                'operator_avatar_url': settings.get('operator_avatar_url') or '',
                'operator_status': settings.get('operator_status') or 'online',
                'menu_items': items,
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
            greeting, items = get_menu_config(settings)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.chat_sessions (session_key, client_name, client_phone, status, bot_step)
                    VALUES (%s, %s, %s, 'bot', 'menu') RETURNING {', '.join(SESSION_COLS)}""",
                (session_key, client_name, client_phone)
            )
            srow = cur.fetchone()
            greet = add_message(cur, srow[0], 'bot', f'{greeting}\n{build_menu_text(items)}')
            conn.commit()
            return {'statusCode': 201, 'headers': headers, 'body': json.dumps({
                'session': session_to_dict(srow), 'messages': [msg_to_dict(greet)],
                'operator_name': settings.get('operator_name') or 'Оператор',
                'operator_avatar_url': settings.get('operator_avatar_url') or '',
                'operator_status': settings.get('operator_status') or 'online',
                'working_hours': settings.get('chat_working_hours') or '',
                'menu_items': items,
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

        # ---- Клиент: вернуться в меню бота (только пока оператор не подключился) ----
        if action == 'return_to_bot':
            if s['status'] != 'waiting_operator':
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Недоступно в текущем статусе'})}
            settings = get_settings(cur)
            greeting, items = get_menu_config(settings)
            bump_session(cur, session_id, status='bot', bot_step='menu', operator_requested_at=None, wait_notice_sent=False)
            row = add_message(cur, session_id, 'bot', build_menu_text(items))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(row)]})}

        # ---- Клиент: выбор пункта меню бота ----
        if action == 'menu_select':
            if s['status'] != 'bot':
                # Диалог уже передан оператору — не дублируем автоответы бота
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': []})}
            option = body.get('option')
            settings = get_settings(cur)
            _, items = get_menu_config(settings)
            item = next((it for it in items if it.get('id') == option), None)
            if not item:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестный пункт меню'})}

            client_text = f"{(item.get('emoji') or '').strip()} {(item.get('label') or '').strip()}".strip()
            add_message(cur, session_id, 'client', client_text)
            item_type = item.get('type')

            if item_type == 'status':
                bump_session(cur, session_id, bot_step='ask_phone')
                row = add_message(cur, session_id, 'bot', 'Назовите номер телефона, указанный в заявке.')
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(row)]})}

            if item_type == 'operator':
                prefix = item.get('prefix') or ''
                op_status = settings.get('operator_status', 'online')
                if op_status in ('busy', 'offline') and not s.get('client_name'):
                    bump_session(cur, session_id, bot_step='ask_operator_name', pending_operator_prefix=prefix)
                    row = add_message(cur, session_id, 'bot', 'Прежде чем подключить оператора, назовите, пожалуйста, ваше имя.')
                    conn.commit()
                    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(row)]})}
                if op_status in ('busy', 'offline') and not s.get('client_phone'):
                    bump_session(cur, session_id, bot_step='ask_operator_phone', pending_operator_prefix=prefix)
                    row = add_message(cur, session_id, 'bot', 'Спасибо! Теперь укажите номер телефона для связи.')
                    conn.commit()
                    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(row)]})}
                bump_session(cur, session_id, status='waiting_operator', bot_step=None,
                             operator_requested_at=datetime.now(timezone.utc), wait_notice_sent=False)
                row = add_message(cur, session_id, 'bot', f'{prefix}{operator_greeting(settings)}')
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(row)]})}

            if item_type in ('text', 'appeal'):
                row = add_message(cur, session_id, 'bot', item.get('text') or '')
                row2 = add_message(cur, session_id, 'bot', build_menu_text(items))
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(row), msg_to_dict(row2)]})}

            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестный тип пункта меню'})}

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
                settings = get_settings(cur)
                _, items = get_menu_config(settings)
                if step == 'ask_phone':
                    digits = only_digits(text)
                    if len(digits) < 10:
                        row = add_message(cur, session_id, 'bot', 'Не похоже на номер телефона. Введите номер в формате +7XXXXXXXXXX.')
                        bot_replies.append(row)
                    else:
                        bump_session(cur, session_id, bot_phone=digits, bot_step='ask_passport')
                        row = add_message(cur, session_id, 'bot', 'Спасибо. Теперь укажите серию и номер паспорта (только цифры).')
                        bot_replies.append(row)
                elif step == 'ask_operator_name':
                    name = text.strip()
                    if len(name) < 2:
                        row = add_message(cur, session_id, 'bot', 'Пожалуйста, укажите ваше имя.')
                        bot_replies.append(row)
                    else:
                        bump_session(cur, session_id, client_name=name, bot_step='ask_operator_phone')
                        row = add_message(cur, session_id, 'bot', 'Спасибо! Теперь укажите номер телефона для связи.')
                        bot_replies.append(row)
                elif step == 'ask_operator_phone':
                    digits = only_digits(text)
                    if len(digits) < 10:
                        row = add_message(cur, session_id, 'bot', 'Не похоже на номер телефона. Введите номер в формате +7XXXXXXXXXX.')
                        bot_replies.append(row)
                    else:
                        prefix = s.get('pending_operator_prefix') or ''
                        bump_session(cur, session_id, client_phone=digits, status='waiting_operator', bot_step=None,
                                     pending_operator_prefix=None,
                                     operator_requested_at=datetime.now(timezone.utc), wait_notice_sent=False)
                        row = add_message(cur, session_id, 'bot', f'{prefix}{operator_greeting(settings)}')
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
                    row2 = add_message(cur, session_id, 'bot', build_menu_text(items))
                    bot_replies.append(row2)
                else:
                    row = add_message(cur, session_id, 'bot', 'Пожалуйста, воспользуйтесь кнопками ниже, либо позовите оператора для остальных вопросов.')
                    bot_replies.append(row)
                    row2 = add_message(cur, session_id, 'bot', build_menu_text(items))
                    bot_replies.append(row2)
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_to_dict(r) for r in bot_replies]})}

        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестное действие'})}
    finally:
        conn.close()