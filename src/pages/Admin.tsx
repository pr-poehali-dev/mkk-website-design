import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { apiGetAll, apiDeleteRequests, apiGetSiteSettings, apiSaveSiteSettings, apiGetSupportMessages, type UserSession } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';
import AdminClientGroup from '@/components/admin/AdminClientGroup';
import AdminEditModal, { type EditForm } from '@/components/admin/AdminEditModal';

const fmt = (n: number) => n.toLocaleString('ru-RU');

const Admin = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [requests, setRequests] = useState<UserSession[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState<UserSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ status: '', amount: '', days: '', operator_comment: '', payment_bank: '', insurance_enabled: false });
  const [checkedRefs, setCheckedRefs] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusKey | null>(null);
  const [tab, setTab] = useState<'active' | 'rejected' | 'closed' | 'all'>('active');
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatCode, setChatCode] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSaving, setChatSaving] = useState(false);
  const [newSupportCount, setNewSupportCount] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await apiGetAll();
      setRequests(data);
    } catch (_e) {
      // ignore
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchAll();
      apiGetSupportMessages().then((items) => {
        setNewSupportCount(items.filter((m) => m.status === 'new').length);
      }).catch(() => {});
    }
  }, [authed, fetchAll]);

  const openModal = (r: UserSession) => {
    setSelected(r);
    setEditForm({
      status: r.status,
      amount: String(r.amount),
      days: String(r.days),
      operator_comment: r.operator_comment || '',
      payment_bank: r.payment_bank || '',
      insurance_enabled: r.insurance_enabled || false,
    });
  };

  const handleCheck = (ref: string, checked: boolean) => {
    const next = new Set(checkedRefs);
    if (checked) next.add(ref); else next.delete(ref);
    setCheckedRefs(next);
  };

  const openChatModal = async () => {
    setMenuOpen(false);
    setChatModalOpen(true);
    setChatLoading(true);
    try {
      const s = await apiGetSiteSettings();
      setChatCode(s.chat_widget_code || '');
    } catch (_e) {
      // ignore
    } finally {
      setChatLoading(false);
    }
  };

  const saveChatCode = async () => {
    setChatSaving(true);
    try {
      await apiSaveSiteSettings({ chat_widget_code: chatCode });
      setChatModalOpen(false);
    } catch (_e) {
      // ignore
    } finally {
      setChatSaving(false);
    }
  };

  if (!authed) {
    return <AdminLoginScreen onAuth={() => setAuthed(true)} />;
  }

  const stats = (Object.keys(STATUS_META) as StatusKey[]).map((k) => ({
    key: k, ...STATUS_META[k], count: requests.filter((r) => r.status === k).length,
  }));

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon name="LayoutDashboard" size={20} className="text-accent" />
            <span className="font-display text-lg font-bold tracking-wide">АДМИН.</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchAll} className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="RefreshCw" size={16} className={loadingList ? 'animate-spin' : ''} /> Обновить
            </button>
            <button onClick={() => setMenuOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-primary-foreground/20 px-3 py-1.5 text-sm text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors">
              <Icon name="Menu" size={16} /> Меню
            </button>
          </div>
        </div>
      </header>

      {/* Поп-ап меню */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Меню</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Link to="/admin/settings" onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Icon name="Settings" size={18} className="text-accent" /> Настройки
            </Link>
            <Link to="/admin/emails" onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Icon name="Mail" size={18} className="text-accent" /> Тексты писем
            </Link>
            <Link to="/admin/support" onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Icon name="MessageCircleQuestion" size={18} className="text-accent" /> Обращения
              {newSupportCount > 0 && (
                <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{newSupportCount}</span>
              )}
            </Link>
            <Link to="/admin/news" onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Icon name="Newspaper" size={18} className="text-accent" /> Новости
            </Link>
            <button onClick={openChatModal}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Icon name="MessageCircle" size={18} className="text-accent" /> Код чата
            </button>
            <button onClick={() => { sessionStorage.removeItem('zaimy_admin'); setAuthed(false); setMenuOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
              <Icon name="LogOut" size={18} /> Выйти
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Код чата */}
      <Dialog open={chatModalOpen} onOpenChange={setChatModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Код чата на сайте</DialogTitle>
          </DialogHeader>
          {chatLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Вставьте код виджета чата (например, Talk-Me) целиком, включая тег &lt;script&gt;. Он будет подключаться на всех страницах сайта.
              </p>
              <Textarea
                value={chatCode}
                onChange={(e) => setChatCode(e.target.value)}
                placeholder="<script>...</script>"
                className="min-h-[220px] font-mono text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setChatModalOpen(false)}>Отмена</Button>
                <Button disabled={chatSaving} onClick={saveChatCode} className="flex items-center gap-1.5">
                  {chatSaving && <Icon name="Loader2" size={14} className="animate-spin" />} Сохранить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <main className="container px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-primary">Управление заявками</h1>

        {/* Статистика */}
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => {
            const active = statusFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStatusFilter(active ? null : s.key as StatusKey)}
                className={`rounded-2xl border p-4 text-left transition-all hover:shadow-md ${active ? 'border-accent bg-accent/10 ring-2 ring-accent/40' : 'border-border bg-card'}`}
              >
                <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                  <Icon name={s.icon} size={20} />
                </div>
                <p className="text-2xl font-bold text-primary">{s.count}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </button>
            );
          })}
        </div>
        {statusFilter && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Фильтр: <span className="font-medium text-primary">{STATUS_META[statusFilter]?.label}</span></span>
            <button onClick={() => setStatusFilter(null)} className="flex items-center gap-1 text-xs text-accent hover:underline">
              <Icon name="X" size={12} /> Сбросить
            </button>
          </div>
        )}

        {/* Панель удаления */}
        {checkedRefs.size > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-sm font-medium text-red-700">Выбрано: {checkedRefs.size}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCheckedRefs(new Set())}
                className="border-red-200 text-red-600 hover:bg-red-100">
                Отменить
              </Button>
              <Button size="sm" disabled={deleting}
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  if (!confirm(`Удалить ${checkedRefs.size} заявок(у)? Это действие необратимо.`)) return;
                  setDeleting(true);
                  try {
                    await apiDeleteRequests(Array.from(checkedRefs));
                    setRequests((prev) => prev.filter((r) => !checkedRefs.has(r.ref_number)));
                    setCheckedRefs(new Set());
                  } catch (_e) {
                    // ignore
                  } finally { setDeleting(false); }
                }}>
                {deleting
                  ? <span className="flex items-center gap-1.5"><Icon name="Loader2" size={14} className="animate-spin" /> Удаление...</span>
                  : <span className="flex items-center gap-1.5"><Icon name="Trash2" size={14} /> Удалить</span>
                }
              </Button>
            </div>
          </div>
        )}

        {/* Вкладки по статусам */}
        <div className="mt-5 flex gap-6 overflow-x-auto border-b border-border">
          {([
            { key: 'active', label: 'Активные' },
            { key: 'rejected', label: 'Отклонённые' },
            { key: 'closed', label: 'Закрытые' },
            { key: 'all', label: 'Все' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setStatusFilter(null); }}
              className={`shrink-0 whitespace-nowrap pb-3 text-sm font-semibold transition-colors ${tab === t.key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Поиск */}
        <div className="mt-5 relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по ФИО или номеру телефона..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>

        {/* Список заявок */}
        <div className="mt-4 space-y-3">
          {loadingList && requests.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
            </div>
          )}
          {!loadingList && requests.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">Заявок пока нет</p>
          )}
          {(() => {
            const filtered = requests.filter((r) => {
              if (statusFilter && r.status !== statusFilter) return false;
              if (tab === 'active' && !['review', 'approved', 'issued', 'money_sent'].includes(r.status)) return false;
              if (tab === 'rejected' && !['rejected', 'transfer_error'].includes(r.status)) return false;
              if (tab === 'closed' && r.status !== 'repaid') return false;
              if (!search.trim()) return true;
              const q = search.trim().toLowerCase();
              return (
                r.full_name?.toLowerCase().includes(q) ||
                r.phone?.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
              );
            });

            // Группируем по телефону, сохраняя порядок первого появления
            const groupMap = new Map<string, UserSession[]>();
            filtered.forEach((r) => {
              const key = r.phone;
              if (!groupMap.has(key)) groupMap.set(key, []);
              groupMap.get(key)!.push(r);
            });

            return Array.from(groupMap.values()).map((group) => (
              <AdminClientGroup
                key={group[0].phone}
                requests={group}
                checkedRefs={checkedRefs}
                onCheck={handleCheck}
                onEdit={openModal}
                fmt={fmt}
              />
            ));
          })()}
        </div>

        <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <Icon name="ArrowLeft" size={16} /> На сайт
        </Link>
      </main>

      <AdminEditModal
        selected={selected}
        editForm={editForm}
        setEditForm={setEditForm}
        saving={saving}
        setSaving={setSaving}
        onClose={() => setSelected(null)}
        onSaved={(updated) => {
          setRequests((prev) => prev.map((r) =>
            r.ref_number === updated.ref_number ? { ...r, ...updated } : r
          ));
        }}
        onBlockToggled={(ref_number, is_blocked) => {
          setRequests((prev) => prev.map((r) => r.ref_number === ref_number ? { ...r, is_blocked } : r));
          setSelected((prev) => prev ? { ...prev, is_blocked } : null);
        }}
        onDocStatusChanged={(ref_number, patch) => {
          setRequests((prev) => prev.map((r) => r.ref_number === ref_number ? { ...r, ...patch } : r));
          setSelected((prev) => prev ? { ...prev, ...patch } : null);
        }}
      />
    </div>
  );
};

export default Admin;