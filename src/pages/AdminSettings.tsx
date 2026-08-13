import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { apiGetSiteSettings, apiSaveSiteSettings } from '@/lib/api';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';

const AdminSettings = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [maintenanceBanner, setMaintenanceBanner] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [siteClosed, setSiteClosed] = useState(false);
  const [siteClosedSaving, setSiteClosedSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authed) {
      apiGetSiteSettings().then((s) => {
        setMaintenanceBanner(s.maintenance_banner === 'true');
        setSiteClosed(s.site_closed === 'true');
        setLoaded(true);
      });
    }
  }, [authed]);

  if (!authed) {
    return <AdminLoginScreen onAuth={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon name="Settings" size={20} className="text-accent" />
            <span className="font-display text-lg font-bold tracking-wide">НАСТРОЙКИ САЙТА</span>
          </div>
          <div className="flex items-center gap-4">
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

      <main className="container max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-primary">Настройки сайта</h1>

        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  );
};

export default AdminSettings;
