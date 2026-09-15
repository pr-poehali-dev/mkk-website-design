import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  apiChatAdminList, apiChatAdminGet, apiChatAdminSend, apiChatAdminAccept, apiChatAdminClose, apiUploadFile,
  type ChatSession, type ChatMessage,
} from '@/lib/api';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const STATUS_META: Record<string, { label: string; badge: string }> = {
  bot: { label: 'С ботом', badge: 'bg-slate-100 text-slate-600' },
  waiting_operator: { label: 'Ждёт оператора', badge: 'bg-amber-100 text-amber-700' },
  active: { label: 'В диалоге', badge: 'bg-blue-100 text-blue-700' },
  closed: { label: 'Закрыт', badge: 'bg-green-100 text-green-700' },
};

const AdminChats = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [tab, setTab] = useState<'waiting_operator' | 'active' | 'closed' | 'all'>('waiting_operator');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [closing, setClosing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiChatAdminList();
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchList();
      const t = setInterval(fetchList, 5000);
      return () => clearInterval(t);
    }
  }, [authed, fetchList]);

  const openChat = async (session_key: string) => {
    setSelectedKey(session_key);
    setDetailLoading(true);
    try {
      const res = await apiChatAdminGet(session_key);
      setSelected(res.session);
      setMessages(res.messages);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedKey) return;
    const t = setInterval(async () => {
      try {
        const res = await apiChatAdminGet(selectedKey);
        setSelected(res.session);
        setMessages(res.messages);
      } catch {
        // ignore
      }
    }, 4000);
    return () => clearInterval(t);
  }, [selectedKey]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedKey || sending) return;
    setSending(true);
    setDraft('');
    try {
      await apiChatAdminSend(selectedKey, text);
      const res = await apiChatAdminGet(selectedKey);
      setSelected(res.session);
      setMessages(res.messages);
      fetchList();
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }));
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedKey) return;
    setUploading(true);
    try {
      const url = await apiUploadFile(file, 'chat-files');
      await apiChatAdminSend(selectedKey, undefined, url);
      const res = await apiChatAdminGet(selectedKey);
      setSelected(res.session);
      setMessages(res.messages);
      fetchList();
    } finally {
      setUploading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedKey) return;
    setAccepting(true);
    try {
      await apiChatAdminAccept(selectedKey);
      const res = await apiChatAdminGet(selectedKey);
      setSelected(res.session);
      setMessages(res.messages);
      fetchList();
    } finally {
      setAccepting(false);
    }
  };

  const handleClose = async () => {
    if (!selectedKey) return;
    setClosing(true);
    try {
      await apiChatAdminClose(selectedKey);
      const res = await apiChatAdminGet(selectedKey);
      setSelected(res.session);
      setMessages(res.messages);
      fetchList();
    } finally {
      setClosing(false);
    }
  };

  if (!authed) {
    return <AdminLoginScreen onAuth={() => setAuthed(true)} />;
  }

  const filtered = sessions.filter((s) => tab === 'all' ? true : s.status === tab);
  const countByStatus = (s: string) => sessions.filter((x) => x.status === s).length;

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon name="MessageCircle" size={20} className="text-accent" />
            <span className="font-display text-lg font-bold tracking-wide">ЧАТЫ</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchList} className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="RefreshCw" size={16} className={loading ? 'animate-spin' : ''} /> Обновить
            </button>
            <Link to="/admin" className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="ArrowLeft" size={16} /> К заявкам
            </Link>
            <button onClick={() => { sessionStorage.removeItem('zaimy_admin'); setAuthed(false); }}
              className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="LogOut" size={16} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-primary">Чаты с клиентами</h1>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row">
          {/* Список диалогов */}
          <div className="w-full shrink-0 lg:w-80">
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'waiting_operator', label: 'Ждут' },
                { key: 'active', label: 'В диалоге' },
                { key: 'closed', label: 'Закрытые' },
                { key: 'all', label: 'Все' },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${tab === t.key ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card text-muted-foreground hover:text-primary'}`}>
                  {t.label}
                  {t.key !== 'all' && (
                    <span className={`rounded-full px-1.5 text-[10px] ${tab === t.key ? 'bg-accent text-accent-foreground' : 'bg-secondary'}`}>{countByStatus(t.key)}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {loading && sessions.length === 0 && (
                <div className="flex items-center justify-center py-10">
                  <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">Диалогов нет</p>
              )}
              {filtered.map((s) => {
                const meta = STATUS_META[s.status] || STATUS_META.bot;
                const isActive = selectedKey === s.session_key;
                return (
                  <button
                    key={s.session_key}
                    onClick={() => openChat(s.session_key)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${isActive ? 'border-accent bg-accent/5' : 'border-border bg-card hover:bg-secondary/60'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-primary">{s.client_name || 'Гость'}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.badge}`}>{meta.label}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{s.client_phone || '—'}</span>
                      <span>{fmtTime(s.updated_at)}</span>
                    </div>
                    {!!s.unread_count && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                        <Icon name="Circle" size={6} className="fill-red-500 text-red-500" /> {s.unread_count} новых
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Окно диалога */}
          <div className="flex-1 rounded-2xl border border-border bg-card">
            {!selectedKey ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 text-muted-foreground">
                <Icon name="MessagesSquare" size={36} className="opacity-40" />
                <p className="text-sm">Выберите диалог слева</p>
              </div>
            ) : detailLoading && !selected ? (
              <div className="flex h-full min-h-[400px] items-center justify-center">
                <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
              </div>
            ) : selected ? (
              <div className="flex h-[75vh] flex-col">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border p-4">
                  <div>
                    <p className="font-semibold text-primary">{selected.client_name || 'Гость'}</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.client_phone || '—'} · {STATUS_META[selected.status]?.label}
                      {selected.rating ? ` · Оценка: ${selected.rating}★` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(selected.status === 'bot' || selected.status === 'waiting_operator') && (
                      <Button size="sm" disabled={accepting} onClick={handleAccept} className="bg-blue-600 text-white hover:bg-blue-700">
                        {accepting ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="UserCheck" size={14} />}
                        <span className="ml-1.5">Принять</span>
                      </Button>
                    )}
                    {selected.status !== 'closed' && (
                      <Button size="sm" variant="outline" disabled={closing} onClick={handleClose}>
                        {closing ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="X" size={14} />}
                        <span className="ml-1.5">Закрыть</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-secondary/30 p-4">
                  {messages.map((m) => {
                    if (m.sender === 'system') {
                      return <div key={m.id} className="text-center text-xs text-muted-foreground">{m.text}</div>;
                    }
                    const fromClient = m.sender === 'client';
                    return (
                      <div key={m.id} className={`flex ${fromClient ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm ${
                          fromClient ? 'bg-card border border-border text-primary rounded-bl-sm' : 'bg-accent text-accent-foreground rounded-br-sm'
                        }`}>
                          {m.text}
                          {m.file_url && (
                            <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                              className={`mt-1.5 flex items-center gap-1.5 text-xs underline ${fromClient ? 'text-accent' : 'text-accent-foreground/90'}`}>
                              <Icon name="Paperclip" size={12} /> Файл
                            </a>
                          )}
                          <p className={`mt-1 text-[10px] ${fromClient ? 'text-muted-foreground' : 'text-accent-foreground/70'}`}>{fmtDate(m.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selected.status !== 'closed' ? (
                  <div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
                    <label className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground hover:text-accent ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                      {uploading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Paperclip" size={16} />}
                      <input type="file" className="hidden" disabled={uploading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; }} />
                    </label>
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                      placeholder="Ответить клиенту..."
                      className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                    />
                    <Button size="icon" disabled={!draft.trim() || sending} onClick={handleSend} className="h-10 w-10 shrink-0 rounded-full">
                      {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                    </Button>
                  </div>
                ) : (
                  <div className="shrink-0 border-t border-border p-3 text-center text-xs text-muted-foreground">
                    Диалог закрыт{selected.rating ? ` · Оценка клиента: ${selected.rating}★${selected.rating_comment ? ` — «${selected.rating_comment}»` : ''}` : ''}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminChats;
