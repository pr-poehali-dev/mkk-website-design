import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { apiGetAccessRequests, apiUpdateAccessRequest, apiReplyAccessRequest, type AccessRequestItem } from '@/lib/api';

const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const META = {
  new: { label: 'Новая', badge: 'bg-accent/15 text-accent', border: 'border-accent/40' },
  approved: { label: 'Пароль изменён', badge: 'bg-green-100 text-green-700', border: 'border-green-300' },
  rejected: { label: 'Отклонена', badge: 'bg-red-100 text-red-600', border: 'border-red-300' },
} as const;

const AdminAccessRequests = () => {
  const [items, setItems] = useState<AccessRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'new' | 'approved' | 'rejected' | 'all'>('new');
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [replyInfo, setReplyInfo] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGetAccessRequests();
      setItems(data);
      setDrafts((prev) => {
        const next = { ...prev };
        data.forEach((i) => { if (next[i.id] === undefined) next[i.id] = i.admin_comment || ''; });
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id: number, status?: 'new' | 'approved' | 'rejected') => {
    setBusyId(id);
    try {
      await apiUpdateAccessRequest({ id, status, admin_comment: drafts[id] ?? '' });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const sendReply = async (i: AccessRequestItem) => {
    const text = (replies[i.id] || '').trim();
    if (!text) return;
    setSendingId(i.id);
    try {
      const r = await apiReplyAccessRequest(i.id, text);
      setReplies((p) => ({ ...p, [i.id]: '' }));
      setReplyInfo((p) => ({ ...p, [i.id]: r.email_sent ? 'Ответ отправлен клиенту на почту и в кабинет' : 'Ответ отправлен в кабинет клиента (почта не указана)' }));
      await load();
    } finally {
      setSendingId(null);
    }
  };

  const count = (s: string) => items.filter((i) => i.status === s).length;
  const filtered = items.filter((i) => tab === 'all' || i.status === tab);

  return (
    <div>
      <div className="mt-5 flex flex-wrap gap-2">
        {([
          { key: 'new', label: 'Новые', count: count('new') },
          { key: 'approved', label: 'Выполненные', count: count('approved') },
          { key: 'rejected', label: 'Отклонённые', count: count('rejected') },
          { key: 'all', label: 'Все', count: items.length },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
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
          Заявок на смену пароля нет
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {filtered.map((i) => {
            const meta = META[i.status] || META.new;
            const busy = busyId === i.id;
            return (
              <div key={i.id} className={`rounded-2xl border bg-card p-5 ${meta.border}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-primary">
                      <Icon name="KeyRound" size={16} className="text-accent" /> {i.full_name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Icon name="FileText" size={12} /> {i.ref_number}</span>
                      {i.phone && <a href={`tel:${i.phone}`} className="flex items-center gap-1 hover:text-primary"><Icon name="Phone" size={12} /> {i.phone}</a>}
                      {i.email && <span className="flex items-center gap-1"><Icon name="Mail" size={12} /> {i.email}</span>}
                      <span className="flex items-center gap-1"><Icon name="Clock" size={12} /> {fmtDate(i.created_at)}</span>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>{meta.label}</span>
                </div>

                <div className="mt-3 grid gap-2 rounded-xl bg-secondary p-3 text-sm sm:grid-cols-2">
                  <p><span className="text-muted-foreground">Паспорт: </span><span className="font-medium text-primary">{i.passport.slice(0, 4)} {i.passport.slice(4)}</span></p>
                  <p><span className="text-muted-foreground">СНИЛС: </span><span className="font-medium text-primary">{i.snils}</span></p>
                </div>

                <div className="mt-2 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm">
                  <Icon name="KeyRound" size={15} className="shrink-0 text-accent" />
                  <span className="text-muted-foreground">Пароль клиента:</span>
                  {i.new_password
                    ? <span className="select-all rounded bg-card px-2 py-0.5 font-mono font-semibold text-primary">{i.new_password}</span>
                    : <span className="text-xs text-muted-foreground">не сохранён (старая заявка)</span>}
                </div>

                {i.selfie_url && (
                  <a href={i.selfie_url} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-border bg-black">
                    <img src={i.selfie_url} alt="Селфи с паспортом" className="mx-auto max-h-64 w-full object-contain" />
                  </a>
                )}

                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    <Icon name="MessageSquareReply" size={13} /> Ответ клиенту
                  </p>
                  {i.admin_reply && (
                    <div className="mb-2 rounded-lg border border-green-200 bg-green-50 p-2.5 text-sm text-green-900">
                      <p className="whitespace-pre-wrap">{i.admin_reply}</p>
                      <p className="mt-1 text-[11px] text-green-700">Отправлено: {fmtDate(i.replied_at)}</p>
                    </div>
                  )}
                  <Textarea
                    placeholder={i.admin_reply ? 'Отправить ещё одно сообщение клиенту...' : 'Введите ответ клиенту...'}
                    className="min-h-[70px] bg-card"
                    value={replies[i.id] || ''}
                    onChange={(e) => setReplies({ ...replies, [i.id]: e.target.value })}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button size="sm" disabled={sendingId === i.id || !(replies[i.id] || '').trim()} onClick={() => sendReply(i)}>
                      {sendingId === i.id ? <Icon name="Loader2" size={14} className="mr-1.5 animate-spin" /> : <Icon name="Send" size={14} className="mr-1.5" />}
                      Отправить ответ
                    </Button>
                    {replyInfo[i.id] && <span className="text-xs text-green-700">{replyInfo[i.id]}</span>}
                    {!i.email && <span className="text-xs text-orange-600">Почта не указана — ответ придёт только в кабинет</span>}
                  </div>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Комментарий оператора</p>
                <Textarea
                  placeholder="Заметка по этой заявке (клиенту не показывается)"
                  className="mt-1 min-h-[70px] bg-card"
                  value={drafts[i.id] ?? ''}
                  onChange={(e) => setDrafts({ ...drafts, [i.id]: e.target.value })}
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => act(i.id)}>
                    <Icon name="Save" size={14} className="mr-1.5" /> Сохранить комментарий
                  </Button>
                  {i.status !== 'approved' && (
                    <Button size="sm" disabled={busy} onClick={() => act(i.id, 'approved')} className="bg-green-600 text-white hover:bg-green-700">
                      {busy ? <Icon name="Loader2" size={14} className="mr-1.5 animate-spin" /> : <Icon name="Check" size={14} className="mr-1.5" />}
                      Сменить пароль клиенту
                    </Button>
                  )}
                  {i.status !== 'rejected' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => act(i.id, 'rejected')} className="border-red-400 text-red-600 hover:bg-red-50">
                      <Icon name="X" size={14} className="mr-1.5" /> Отклонить
                    </Button>
                  )}
                  {i.processed_at && <span className="text-xs text-muted-foreground">Обработана: {fmtDate(i.processed_at)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminAccessRequests;
