import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import {
  apiChatStart, apiChatSend, apiChatMenuSelect, apiChatPoll, apiChatRate,
  type ChatMessage, type ChatSession, type ChatMenuItem,
} from '@/lib/api';

const SESSION_KEY_STORAGE = 'zaimy_chat_session';
const POLL_MS = 4000;

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [operatorName, setOperatorName] = useState('Оператор');
  const [operatorAvatarUrl, setOperatorAvatarUrl] = useState('');
  const [menuItems, setMenuItems] = useState<ChatMenuItem[]>([]);
  const [starting, setStarting] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [rated, setRated] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [unread, setUnread] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const start = async () => {
    setStarting(true);
    try {
      const res = await apiChatStart();
      setSession(res.session);
      setMessages(res.messages);
      setOperatorName(res.operator_name || 'Оператор');
      setOperatorAvatarUrl(res.operator_avatar_url || '');
      setMenuItems(res.menu_items || []);
      lastIdRef.current = res.messages.length ? res.messages[res.messages.length - 1].id : 0;
      sessionStorage.setItem(SESSION_KEY_STORAGE, res.session.session_key);
      scrollToBottom();
    } finally {
      setStarting(false);
    }
  };

  const restore = async (sessionKey: string) => {
    setStarting(true);
    try {
      const res = await apiChatPoll(sessionKey, 0);
      setSession(res.session);
      setMessages(res.messages);
      if (res.operator_name) setOperatorName(res.operator_name);
      if (res.operator_avatar_url) setOperatorAvatarUrl(res.operator_avatar_url);
      if (res.menu_items) setMenuItems(res.menu_items);
      lastIdRef.current = res.messages.length ? res.messages[res.messages.length - 1].id : 0;
      scrollToBottom();
    } catch {
      sessionStorage.removeItem(SESSION_KEY_STORAGE);
      await start();
    } finally {
      setStarting(false);
    }
  };

  const openChat = () => {
    setOpen(true);
    setUnread(0);
    if (session) return;
    const saved = sessionStorage.getItem(SESSION_KEY_STORAGE);
    if (saved) restore(saved);
    else start();
  };

  // Поллинг новых сообщений
  useEffect(() => {
    if (!session || session.status === 'closed') {
      if (pollTimer.current) clearInterval(pollTimer.current);
      return;
    }
    pollTimer.current = setInterval(async () => {
      try {
        const res = await apiChatPoll(session.session_key, lastIdRef.current);
        if (res.messages.length) {
          setMessages((prev) => [...prev, ...res.messages]);
          lastIdRef.current = res.messages[res.messages.length - 1].id;
          if (!open) setUnread((u) => u + res.messages.filter((m) => m.sender !== 'client').length);
          else scrollToBottom();
        }
        setSession(res.session);
      } catch {
        // ignore transient errors
      }
    }, POLL_MS);
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.session_key, session?.status, open]);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !session || sending) return;
    setSending(true);
    setInput('');
    setMessages((prev) => [...prev, {
      id: -Date.now(), session_id: session.id, sender: 'client', text, file_url: null, is_read: true, created_at: new Date().toISOString(),
    }]);
    scrollToBottom();
    try {
      const res = await apiChatSend(session.session_key, text);
      if (res.messages.length) {
        setMessages((prev) => [...prev.filter((m) => m.id > 0 || m.text !== text), ...res.messages]);
        lastIdRef.current = Math.max(lastIdRef.current, ...res.messages.map((m) => m.id));
      }
    } finally {
      setSending(false);
    }
  };

  const handleMenuSelect = async (option: string) => {
    if (!session || sending) return;
    setSending(true);
    try {
      const res = await apiChatMenuSelect(session.session_key, option);
      if (res.messages.length) {
        setMessages((prev) => [...prev, res.messages[0]]);
        lastIdRef.current = Math.max(lastIdRef.current, ...res.messages.map((m) => m.id));
      }
      const poll = await apiChatPoll(session.session_key, lastIdRef.current);
      if (poll.messages.length) {
        setMessages((prev) => [...prev, ...poll.messages]);
        lastIdRef.current = poll.messages[poll.messages.length - 1].id;
      }
      setSession(poll.session);
    } finally {
      setSending(false);
    }
  };

  const handleRate = async () => {
    if (!session || !ratingValue) return;
    setRatingSubmitting(true);
    try {
      await apiChatRate(session.session_key, ratingValue, ratingComment.trim() || undefined);
      setRated(true);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const closeAndReset = () => {
    setOpen(false);
  };

  const startNewChat = async () => {
    sessionStorage.removeItem(SESSION_KEY_STORAGE);
    setSession(null);
    setMessages([]);
    setRated(false);
    setRatingValue(0);
    setRatingComment('');
    await start();
  };

  const isMenuMessage = (m: ChatMessage) => m.sender === 'bot' && m.text?.includes('Чем я могу помочь?');
  const lastMenuIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (isMenuMessage(messages[i])) return i;
    return -1;
  })();

  const canShowMenuButtons = session?.status === 'bot' && lastMenuIdx === messages.length - 1;

  const renderMessageText = (text: string | null, isClient: boolean) => {
    if (!text) return null;
    const parts = text.split(/(\/appeal)/g);
    return parts.map((part, idx) =>
      part === '/appeal' ? (
        <Link key={idx} to="/appeal" onClick={() => setOpen(false)}
          className={`font-semibold underline ${isClient ? 'text-accent-foreground' : 'text-accent'}`}>
          Оставить обращение
        </Link>
      ) : part
    );
  };

  return (
    <>
      {/* Плавающая кнопка */}
      {!open && (
        <button
          onClick={openChat}
          className="fixed bottom-5 right-5 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
        >
          <Icon name="MessageCircle" size={26} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end sm:inset-auto sm:bottom-5 sm:right-5">
          <div className="flex h-full w-full flex-col bg-background sm:h-[600px] sm:max-h-[85vh] sm:w-[380px] sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl">
            {/* Шапка */}
            <div className="flex shrink-0 items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground sm:rounded-t-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                {session?.status === 'active' ? (
                  operatorAvatarUrl ? (
                    <img src={operatorAvatarUrl} alt={operatorName} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                      <Icon name="Headset" size={18} />
                    </div>
                  )
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Icon name="Bot" size={18} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {session?.status === 'active' ? operatorName : 'Бот+'}
                  </p>
                  <p className="text-xs text-primary-foreground/70">
                    {session?.status === 'active' ? 'В диалоге' : session?.status === 'waiting_operator' ? 'Ожидание оператора' : 'Чат-бот'}
                  </p>
                </div>
              </div>
              <button onClick={closeAndReset} className="shrink-0 rounded-full p-1.5 hover:bg-white/10">
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Сообщения */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-secondary/30 px-3 py-4">
              {starting && messages.length === 0 && (
                <div className="flex items-center justify-center py-10">
                  <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
                </div>
              )}
              {messages.map((m, i) => {
                if (m.sender === 'system') {
                  return (
                    <div key={m.id ?? i} className="text-center text-xs text-muted-foreground">
                      {m.text}
                    </div>
                  );
                }
                const isClient = m.sender === 'client';
                return (
                  <div key={m.id ?? i} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm ${
                      isClient
                        ? 'bg-accent text-accent-foreground rounded-br-sm'
                        : 'bg-card border border-border text-primary rounded-bl-sm'
                    }`}>
                      {renderMessageText(m.text, isClient)}
                      {m.file_url && (
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                          className={`mt-1.5 flex items-center gap-1.5 text-xs underline ${isClient ? 'text-accent-foreground/90' : 'text-accent'}`}>
                          <Icon name="Paperclip" size={12} /> Файл
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {canShowMenuButtons && !sending && menuItems.length > 0 && (
                <div className="flex flex-col gap-2 pt-1">
                  {menuItems.map((item) => (
                    <button key={item.id} onClick={() => handleMenuSelect(item.id)}
                      className="rounded-xl border border-accent/40 bg-accent/5 px-3 py-2 text-left text-sm font-medium text-accent hover:bg-accent/10">
                      {item.emoji} {item.label}
                    </button>
                  ))}
                </div>
              )}

              {session?.status === 'closed' && !rated && (
                <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-center">
                  <p className="mb-2 text-sm font-semibold text-primary">Оцените качество диалога</p>
                  <div className="mb-3 flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRatingValue(n)}>
                        <Icon name="Star" size={26}
                          className={n <= ratingValue ? 'fill-amber-400 text-amber-400' : 'text-border'} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Комментарий (необязательно)"
                    className="mb-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                    rows={2}
                  />
                  <button
                    onClick={handleRate}
                    disabled={!ratingValue || ratingSubmitting}
                    className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                  >
                    {ratingSubmitting ? 'Отправляем...' : 'Отправить оценку'}
                  </button>
                </div>
              )}

              {session?.status === 'closed' && rated && (
                <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
                  <Icon name="CheckCircle2" size={24} className="text-green-600" />
                  <p className="text-sm font-medium text-green-700">Спасибо за оценку!</p>
                  <button onClick={startNewChat} className="mt-1 text-xs font-medium text-accent hover:underline">
                    Начать новый диалог
                  </button>
                </div>
              )}
            </div>

            {/* Поле ввода */}
            {session?.status !== 'closed' && (
              <div className="flex shrink-0 items-center gap-2 border-t border-border bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="Напишите сообщение..."
                  disabled={sending || starting}
                  className="flex-1 rounded-full border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground disabled:opacity-40"
                >
                  <Icon name="Send" size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;