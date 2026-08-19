import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { apiGetSupportMessages, apiReplySupportMessage, type SupportMessage } from '@/lib/api';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';

const fmtDate = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const AdminSupport = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SupportMessage[]>([]);
  const [tab, setTab] = useState<'new' | 'answered' | 'all'>('new');
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await apiGetSupportMessages();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchAll();
  }, [authed]);

  if (!authed) {
    return <AdminLoginScreen onAuth={() => setAuthed(true)} />;
  }

  const filtered = items.filter((m) => tab === 'all' ? true : m.status === tab);
  const newCount = items.filter((m) => m.status === 'new').length;

  const handleReply = async (id: number) => {
    const text = (replyDrafts[id] || '').trim();
    if (!text) return;
    setSendingId(id);
    try {
      await apiReplySupportMessage(id, text);
      setReplyDrafts({ ...replyDrafts, [id]: '' });
      await fetchAll();
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon name="MessageCircleQuestion" size={20} className="text-accent" />
            <span className="font-display text-lg font-bold tracking-wide">ОБРАЩЕНИЯ</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchAll} className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
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

      <main className="container max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-primary">Обращения в поддержку</h1>

        <div className="mt-5 flex gap-2">
          {([
            { key: 'new', label: 'Новые', count: newCount },
            { key: 'answered', label: 'Отвеченные', count: items.filter((m) => m.status === 'answered').length },
            { key: 'all', label: 'Все', count: items.length },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card text-muted-foreground hover:text-primary'}`}>
              {t.label}
              <span className={`rounded-full px-1.5 text-xs ${tab === t.key ? 'bg-accent text-accent-foreground' : 'bg-secondary'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <Icon name="Inbox" size={32} className="mx-auto mb-3 opacity-50" />
            Обращений нет
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {filtered.map((m) => (
              <div key={m.id} className={`rounded-2xl border p-5 ${m.status === 'new' ? 'border-accent/40 bg-accent/5' : 'border-border bg-card'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary">{m.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="flex items-center gap-1 hover:text-primary">
                          <Icon name="Phone" size={12} /> {m.phone}
                        </a>
                      )}
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="flex items-center gap-1 hover:text-primary">
                          <Icon name="Mail" size={12} /> {m.email}
                        </a>
                      )}
                      {m.ref_number && (
                        <span className="flex items-center gap-1">
                          <Icon name="FileText" size={12} /> {m.ref_number}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Icon name="Clock" size={12} /> {fmtDate(m.created_at)}</span>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${m.status === 'new' ? 'bg-accent/15 text-accent' : 'bg-green-100 text-green-700'}`}>
                    {m.status === 'new' ? 'Новое' : 'Отвечено'}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-secondary p-3 text-sm text-primary">{m.message}</p>

                {m.file_urls && m.file_urls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.file_urls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-primary hover:bg-secondary transition-colors">
                        <Icon name="Paperclip" size={12} /> Файл {idx + 1}
                      </a>
                    ))}
                  </div>
                )}

                {m.admin_reply && (
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-green-700">
                      <Icon name="CornerDownRight" size={13} /> Ваш ответ {m.replied_at && `· ${fmtDate(m.replied_at)}`}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-green-800">{m.admin_reply}</p>
                  </div>
                )}

                {!m.admin_reply && (
                  <div className="mt-3 space-y-2">
                    {!m.email && (
                      <p className="flex items-center gap-1.5 text-xs text-orange-600">
                        <Icon name="AlertTriangle" size={13} /> Email не указан — ответ клиенту не будет отправлен письмом, свяжитесь по телефону
                      </p>
                    )}
                    <Textarea
                      placeholder="Введите ответ клиенту..."
                      className="min-h-[80px]"
                      value={replyDrafts[m.id] || ''}
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [m.id]: e.target.value })}
                    />
                    <Button
                      size="sm"
                      disabled={sendingId === m.id || !(replyDrafts[m.id] || '').trim()}
                      onClick={() => handleReply(m.id)}
                      className="flex items-center gap-1.5">
                      {sendingId === m.id ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                      Отправить ответ
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSupport;