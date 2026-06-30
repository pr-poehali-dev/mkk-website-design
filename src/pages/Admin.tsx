import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { apiGetAll, apiDeleteRequests, apiGetSiteSettings, apiSaveSiteSettings, type UserSession } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';
import AdminRequestCard from '@/components/admin/AdminRequestCard';
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
  const [maintenanceBanner, setMaintenanceBanner] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [siteClosed, setSiteClosed] = useState(false);
  const [siteClosedSaving, setSiteClosedSaving] = useState(false);

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
      apiGetSiteSettings().then((s) => {
        setMaintenanceBanner(s.maintenance_banner === 'true');
        setSiteClosed(s.site_closed === 'true');
      });
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
            <span className="font-display text-lg font-bold tracking-wide">АДМИН · ЗАЙМЫ ПЛЮС</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchAll} className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="RefreshCw" size={16} className={loadingList ? 'animate-spin' : ''} /> Обновить
            </button>
            <button onClick={() => { sessionStorage.removeItem('zaimy_admin'); setAuthed(false); }}
              className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="LogOut" size={16} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-primary">Управление заявками</h1>

        {/* Баннер технических работ */}
        <div className={`mt-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${maintenanceBanner ? 'border-yellow-300 bg-yellow-50' : 'border-border bg-card'}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${maintenanceBanner ? 'bg-yellow-200 text-yellow-700' : 'bg-secondary text-muted-foreground'}`}>
              <Icon name="Construction" size={18} />
            </div>
            <div>
              <p className="font-semibold text-primary">Баннер «Технические работы»</p>
              <p className="text-sm text-muted-foreground">
                {maintenanceBanner
                  ? 'Сейчас показывается на сайте — клиенты видят уведомление'
                  : 'Сейчас скрыт — клиенты работают в обычном режиме'}
              </p>
            </div>
          </div>
          <Button
            disabled={bannerSaving}
            size="sm"
            onClick={async () => {
              setBannerSaving(true);
              const next = !maintenanceBanner;
              try {
                await apiSaveSiteSettings({ maintenance_banner: next ? 'true' : 'false' });
                setMaintenanceBanner(next);
              } catch (_e) {
                // ignore
              } finally { setBannerSaving(false); }
            }}
            className={maintenanceBanner
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-yellow-500 text-white hover:bg-yellow-600'}>
            {bannerSaving
              ? <span className="flex items-center gap-1.5"><Icon name="Loader2" size={14} className="animate-spin" /> Сохранение...</span>
              : maintenanceBanner
                ? <span className="flex items-center gap-1.5"><Icon name="EyeOff" size={14} /> Отключить баннер</span>
                : <span className="flex items-center gap-1.5"><Icon name="Eye" size={14} /> Включить баннер</span>
            }
          </Button>
        </div>

        {/* Закрытие сайта */}
        <div className={`mt-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${siteClosed ? 'border-red-300 bg-red-50' : 'border-border bg-card'}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${siteClosed ? 'bg-red-200 text-red-700' : 'bg-secondary text-muted-foreground'}`}>
              <Icon name="ShieldOff" size={18} />
            </div>
            <div>
              <p className="font-semibold text-primary">Закрыть сайт полностью</p>
              <p className="text-sm text-muted-foreground">
                {siteClosed
                  ? 'Сайт закрыт — посетители видят страницу «Сайт на доработке»'
                  : 'Сайт открыт — работает в обычном режиме'}
              </p>
            </div>
          </div>
          <Button
            disabled={siteClosedSaving}
            size="sm"
            onClick={async () => {
              setSiteClosedSaving(true);
              const next = !siteClosed;
              try {
                await apiSaveSiteSettings({ site_closed: next ? 'true' : 'false' });
                setSiteClosed(next);
              } catch (_e) {
                // ignore
              } finally { setSiteClosedSaving(false); }
            }}
            className={siteClosed
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-red-600 text-white hover:bg-red-700'}>
            {siteClosedSaving
              ? <span className="flex items-center gap-1.5"><Icon name="Loader2" size={14} className="animate-spin" /> Сохранение...</span>
              : siteClosed
                ? <span className="flex items-center gap-1.5"><Icon name="Globe" size={14} /> Открыть сайт</span>
                : <span className="flex items-center gap-1.5"><Icon name="ShieldOff" size={14} /> Закрыть сайт</span>
            }
          </Button>
        </div>

        {/* Статистика */}
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.key} className="rounded-2xl border border-border bg-card p-4">
              <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                <Icon name={s.icon} size={20} />
              </div>
              <p className="text-2xl font-bold text-primary">{s.count}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

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

        {/* Список заявок */}
        <div className="mt-6 space-y-3">
          {loadingList && requests.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
            </div>
          )}
          {!loadingList && requests.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">Заявок пока нет</p>
          )}
          {requests.map((r) => {
            const phoneCount = requests.filter((x) => x.phone === r.phone).length;
            const isRepeat = phoneCount > 1;
            return (
              <AdminRequestCard
                key={r.ref_number}
                r={r}
                checked={checkedRefs.has(r.ref_number)}
                onCheck={handleCheck}
                onEdit={openModal}
                fmt={fmt}
                isRepeat={isRepeat}
              />
            );
          })}
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