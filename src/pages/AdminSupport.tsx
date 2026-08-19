import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import {
  apiGetSupportMessages, apiReplySupportMessage, apiSetSupportStatus, apiUploadFile,
  type SupportMessage, type SupportStatus,
} from '@/lib/api';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';

const fmtDate = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const STATUS_META: Record<SupportStatus, { label: string; badge: string; border: string; bg: string }> = {
  new: { label: 'Новое', badge: 'bg-accent/15 text-accent', border: 'border-accent/40', bg: 'bg-accent/5' },
  in_progress: { label: 'В работе', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-300', bg: 'bg-blue-50/50' },
  closed: { label: 'Закрыт вопрос', badge: 'bg-green-100 text-green-700', border: 'border-border', bg: 'bg-card' },
};

const AdminSupport = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SupportMessage[]>([]);
  const [tab, setTab] = useState<SupportStatus | 'all'>('new');
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyFiles, setReplyFiles] = useState<Record<number, string[]>>({});
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

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
  const countByStatus = (s: SupportStatus) => items.filter((m) => m.status === s).length;

  const handleReplyFileUpload = async (id: number, file: File) => {
    setUploadingId(id);
    try {
      const url = await apiUploadFile(file, 'support-replies');
      setReplyFiles((prev) => ({ ...prev, [id]: [...(prev[id] || []), url] }));
    } finally {
      setUploadingId(null);
    }
  };

  const removeReplyFile = (id: number, url: string) => {
    setReplyFiles((prev) => ({ ...prev, [id]: (prev[id] || []).filter((u) => u !== url) }));
  };

  const handleReply = async (id: number) => {
    const text = (replyDrafts[id] || '').trim();
    if (!text) return;
    setSendingId(id);
    try {
      await apiReplySupportMessage(id, text, replyFiles[id] || []);
      setReplyDrafts({ ...replyDrafts, [id]: '' });
      setReplyFiles({ ...replyFiles, [id]: [] });
      await fetchAll();
    } finally {
      setSendingId(null);
    }
  };

  const handleSetStatus = async (id: number, status: SupportStatus) => {
    setStatusUpdatingId(id);
    try {
      await apiSetSupportStatus(id, status);
      await fetchAll();
    } finally {
      setStatusUpdatingId(null);
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

        <div className="mt-5 flex flex-wrap gap-2">
          {([
            { key: 'new', label: 'Новые', count: countByStatus('new') },
            { key: 'in_progress', label: 'В работе', count: countByStatus('in_progress') },
            { key: 'closed', label: 'Закрытые', count: countByStatus('closed') },
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
            {filtered.map((m) => {
              const meta = STATUS_META[m.status] || STATUS_META.new;
              return (
                <div key={m.id} className={`rounded-2xl border p-5 ${meta.border} ${meta.bg}`}>
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

                    <div className="flex items-center gap-1.5">
                      {statusUpdatingId === m.id ? (
                        <Icon name="Loader2" size={16} className="animate-spin text-muted-foreground" />
                      ) : (
                        <select
                          value={m.status}
                          onChange={(e) => handleSetStatus(m.id, e.target.value as SupportStatus)}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none cursor-pointer ${meta.badge}`}
                        >
                          <option value="new">Новое</option>
                          <option value="in_progress">В работе</option>
                          <option value="closed">Закрыт вопрос</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap rounded-xl bg-secondary p-3 text-sm text-primary">{m.message}</p>

                  {m.file_urls && m.file_urls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.file_urls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-primary hover:bg-secondary transition-colors">
                          <Icon name="Paperclip" size={12} /> Файл клиента {idx + 1}
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
                      {m.admin_file_urls && m.admin_file_urls.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {m.admin_file_urls.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-2.5 py-1.5 text-xs text-green-700 hover:bg-green-100 transition-colors">
                              <Icon name="Paperclip" size={12} /> Файл {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {m.status !== 'closed' && (
                    <div className="mt-3 space-y-2">
                      {!m.email && (
                        <p className="flex items-center gap-1.5 text-xs text-orange-600">
                          <Icon name="AlertTriangle" size={13} /> Email не указан — ответ клиенту не будет отправлен письмом, свяжитесь по телефону
                        </p>
                      )}
                      <Textarea
                        placeholder={m.admin_reply ? 'Добавить ещё один ответ клиенту...' : 'Введите ответ клиенту...'}
                        className="min-h-[80px] bg-card"
                        value={replyDrafts[m.id] || ''}
                        onChange={(e) => setReplyDrafts({ ...replyDrafts, [m.id]: e.target.value })}
                      />

                      {(replyFiles[m.id] || []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(replyFiles[m.id] || []).map((url) => (
                            <div key={url} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-primary">
                              <Icon name="Paperclip" size={12} />
                              <span className="max-w-[120px] truncate">{url.split('/').pop()}</span>
                              <button type="button" onClick={() => removeReplyFile(m.id, url)} className="text-muted-foreground hover:text-red-600">
                                <Icon name="X" size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors">
                          {uploadingId === m.id ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Paperclip" size={13} />}
                          Прикрепить файл
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            disabled={uploadingId === m.id}
                            onChange={(e) => e.target.files?.[0] && handleReplyFileUpload(m.id, e.target.files[0])}
                          />
                        </label>
                        <Button
                          size="sm"
                          disabled={sendingId === m.id || !(replyDrafts[m.id] || '').trim()}
                          onClick={() => handleReply(m.id)}
                          className="flex items-center gap-1.5">
                          {sendingId === m.id ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                          Отправить ответ
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSupport;
