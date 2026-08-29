import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { apiGetSiteSettings, apiSaveSiteSettings, apiUploadFile } from '@/lib/api';
import {
  DEFAULT_COMPANY_NAME, DEFAULT_COMPANY_LOGO_URL, DEFAULT_CABINET_BANNER_URL, DEFAULT_COMPANY_INN, DEFAULT_COMPANY_OGRN,
  DEFAULT_COMPANY_PHONE, DEFAULT_COMPANY_EMAIL, DEFAULT_SOCIAL_TELEGRAM, DEFAULT_SOCIAL_VK, DEFAULT_SOCIAL_OK, DEFAULT_SOCIAL_MAX,
} from '@/lib/maintenanceContext';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';

const DEFAULT_DEBT_THRESHOLD = 120000;

const AdminSettings = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [maintenanceBanner, setMaintenanceBanner] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [siteClosed, setSiteClosed] = useState(false);
  const [siteClosedSaving, setSiteClosedSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [scoringEnabled, setScoringEnabled] = useState(false);
  const [scoringSaving, setScoringSaving] = useState(false);
  const [debtThreshold, setDebtThreshold] = useState(String(DEFAULT_DEBT_THRESHOLD));
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);
  const [companyNameSaving, setCompanyNameSaving] = useState(false);
  const [companyNameSaved, setCompanyNameSaved] = useState(false);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(DEFAULT_COMPANY_LOGO_URL);
  const [logoUploading, setLogoUploading] = useState(false);
  const [cabinetBannerUrl, setCabinetBannerUrl] = useState(DEFAULT_CABINET_BANNER_URL);
  const [bannerImgUploading, setBannerImgUploading] = useState(false);
  const [companyInn, setCompanyInn] = useState(DEFAULT_COMPANY_INN);
  const [companyOgrn, setCompanyOgrn] = useState(DEFAULT_COMPANY_OGRN);
  const [requisitesSaving, setRequisitesSaving] = useState(false);
  const [requisitesSaved, setRequisitesSaved] = useState(false);
  const [companyPhone, setCompanyPhone] = useState(DEFAULT_COMPANY_PHONE);
  const [companyEmail, setCompanyEmail] = useState(DEFAULT_COMPANY_EMAIL);
  const [contactsSaving, setContactsSaving] = useState(false);
  const [contactsSaved, setContactsSaved] = useState(false);
  const [socialTelegram, setSocialTelegram] = useState(DEFAULT_SOCIAL_TELEGRAM);
  const [socialVk, setSocialVk] = useState(DEFAULT_SOCIAL_VK);
  const [socialOk, setSocialOk] = useState(DEFAULT_SOCIAL_OK);
  const [socialMax, setSocialMax] = useState(DEFAULT_SOCIAL_MAX);
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialSaved, setSocialSaved] = useState(false);

  useEffect(() => {
    if (authed) {
      apiGetSiteSettings().then((s) => {
        setMaintenanceBanner(s.maintenance_banner === 'true');
        setSiteClosed(s.site_closed === 'true');
        setScoringEnabled(s.scoring_enabled === 'true');
        setDebtThreshold(s.scoring_debt_threshold || String(DEFAULT_DEBT_THRESHOLD));
        setCompanyName(s.company_name || DEFAULT_COMPANY_NAME);
        setCompanyLogoUrl(s.company_logo_url || DEFAULT_COMPANY_LOGO_URL);
        setCabinetBannerUrl(s.cabinet_banner_url || DEFAULT_CABINET_BANNER_URL);
        setCompanyInn(s.company_inn || DEFAULT_COMPANY_INN);
        setCompanyOgrn(s.company_ogrn || DEFAULT_COMPANY_OGRN);
        setCompanyPhone(s.company_phone || DEFAULT_COMPANY_PHONE);
        setCompanyEmail(s.company_email || DEFAULT_COMPANY_EMAIL);
        setSocialTelegram(s.social_telegram ?? DEFAULT_SOCIAL_TELEGRAM);
        setSocialVk(s.social_vk ?? DEFAULT_SOCIAL_VK);
        setSocialOk(s.social_ok ?? DEFAULT_SOCIAL_OK);
        setSocialMax(s.social_max ?? DEFAULT_SOCIAL_MAX);
        setLoaded(true);
      });
    }
  }, [authed]);

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const url = await apiUploadFile(file, 'branding');
      await apiSaveSiteSettings({ company_logo_url: url });
      setCompanyLogoUrl(url);
    } catch (_e) {
      // ignore
    } finally {
      setLogoUploading(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    setBannerImgUploading(true);
    try {
      const url = await apiUploadFile(file, 'branding');
      await apiSaveSiteSettings({ cabinet_banner_url: url });
      setCabinetBannerUrl(url);
    } catch (_e) {
      // ignore
    } finally {
      setBannerImgUploading(false);
    }
  };

  const handleBannerRemove = async () => {
    setBannerImgUploading(true);
    try {
      await apiSaveSiteSettings({ cabinet_banner_url: '' });
      setCabinetBannerUrl('');
    } catch (_e) {
      // ignore
    } finally {
      setBannerImgUploading(false);
    }
  };

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
            {/* Название компании и логотип */}
            <div className="mt-5 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <Icon name="Building2" size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-primary">Название компании</p>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Используется на сайте (шапка, футер, договоры и справки для клиентов)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => { setCompanyName(e.target.value); setCompanyNameSaved(false); }}
                      className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={companyNameSaving || !companyName.trim()}
                      onClick={async () => {
                        setCompanyNameSaving(true);
                        try {
                          await apiSaveSiteSettings({ company_name: companyName.trim() });
                          setCompanyNameSaved(true);
                          setTimeout(() => setCompanyNameSaved(false), 2000);
                        } catch (_e) {
                          // ignore
                        } finally { setCompanyNameSaving(false); }
                      }}>
                      {companyNameSaving
                        ? <Icon name="Loader2" size={14} className="animate-spin" />
                        : companyNameSaved
                          ? <Icon name="Check" size={14} className="text-green-600" />
                          : <Icon name="Save" size={14} />}
                      <span className="ml-1.5">Сохранить</span>
                    </Button>
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    <p className="mb-2 text-sm font-medium text-primary">Логотип в личном кабинете</p>
                    <div className="flex items-center gap-3">
                      {companyLogoUrl ? (
                        <img src={companyLogoUrl} alt="Логотип" className="h-14 w-14 rounded-2xl object-cover border border-border" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                          <Icon name="Image" size={22} />
                        </div>
                      )}
                      <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors ${logoUploading ? 'pointer-events-none text-muted-foreground' : 'text-primary hover:bg-secondary'}`}>
                        {logoUploading
                          ? <><Icon name="Loader2" size={13} className="animate-spin" /> Загрузка...</>
                          : <><Icon name="Upload" size={13} /> {companyLogoUrl ? 'Заменить логотип' : 'Загрузить логотип'}</>}
                        <input type="file" accept="image/*" className="hidden" disabled={logoUploading}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    <p className="mb-2 text-sm font-medium text-primary">Реквизиты (ИНН и ОГРН)</p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Подставляются в договоры, справки и на страницы сайта
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={companyInn}
                        placeholder="ИНН"
                        onChange={(e) => { setCompanyInn(e.target.value); setRequisitesSaved(false); }}
                        className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                      />
                      <input
                        type="text"
                        value={companyOgrn}
                        placeholder="ОГРН"
                        onChange={(e) => { setCompanyOgrn(e.target.value); setRequisitesSaved(false); }}
                        className="w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={requisitesSaving || !companyInn.trim() || !companyOgrn.trim()}
                        onClick={async () => {
                          setRequisitesSaving(true);
                          try {
                            await apiSaveSiteSettings({ company_inn: companyInn.trim(), company_ogrn: companyOgrn.trim() });
                            setRequisitesSaved(true);
                            setTimeout(() => setRequisitesSaved(false), 2000);
                          } catch (_e) {
                            // ignore
                          } finally { setRequisitesSaving(false); }
                        }}>
                        {requisitesSaving
                          ? <Icon name="Loader2" size={14} className="animate-spin" />
                          : requisitesSaved
                            ? <Icon name="Check" size={14} className="text-green-600" />
                            : <Icon name="Save" size={14} />}
                        <span className="ml-1.5">Сохранить</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Баннер в личном кабинете */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <Icon name="Image" size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-primary">Баннер в личном кабинете</p>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Показывается клиентам сверху в личном кабинете (акции, новости)
                  </p>
                  {cabinetBannerUrl && (
                    <img src={cabinetBannerUrl} alt="Баннер" className="mb-3 w-full max-w-md rounded-xl border border-border object-cover" />
                  )}
                  <div className="flex items-center gap-2">
                    <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors ${bannerImgUploading ? 'pointer-events-none text-muted-foreground' : 'text-primary hover:bg-secondary'}`}>
                      {bannerImgUploading
                        ? <><Icon name="Loader2" size={13} className="animate-spin" /> Загрузка...</>
                        : <><Icon name="Upload" size={13} /> {cabinetBannerUrl ? 'Заменить баннер' : 'Загрузить баннер'}</>}
                      <input type="file" accept="image/*" className="hidden" disabled={bannerImgUploading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); e.target.value = ''; }} />
                    </label>
                    {cabinetBannerUrl && (
                      <Button size="sm" variant="outline" disabled={bannerImgUploading} onClick={handleBannerRemove}>
                        <Icon name="Trash2" size={13} className="mr-1.5" /> Убрать
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Контакты */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <Icon name="Phone" size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-primary">Телефон и почта</p>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Показываются в шапке, футере и модальных окнах на сайте
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={companyPhone}
                      placeholder="Телефон"
                      onChange={(e) => { setCompanyPhone(e.target.value); setContactsSaved(false); }}
                      className="w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <input
                      type="text"
                      value={companyEmail}
                      placeholder="Email"
                      onChange={(e) => { setCompanyEmail(e.target.value); setContactsSaved(false); }}
                      className="w-56 rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={contactsSaving || !companyPhone.trim() || !companyEmail.trim()}
                      onClick={async () => {
                        setContactsSaving(true);
                        try {
                          await apiSaveSiteSettings({ company_phone: companyPhone.trim(), company_email: companyEmail.trim() });
                          setContactsSaved(true);
                          setTimeout(() => setContactsSaved(false), 2000);
                        } catch (_e) {
                          // ignore
                        } finally { setContactsSaving(false); }
                      }}>
                      {contactsSaving
                        ? <Icon name="Loader2" size={14} className="animate-spin" />
                        : contactsSaved
                          ? <Icon name="Check" size={14} className="text-green-600" />
                          : <Icon name="Save" size={14} />}
                      <span className="ml-1.5">Сохранить</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Соцсети */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <Icon name="Share2" size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-primary">Ссылки на соцсети</p>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Оставьте поле пустым, чтобы значок не показывался на сайте
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-xs text-muted-foreground">Telegram</span>
                      <input
                        type="text"
                        value={socialTelegram}
                        placeholder="https://t.me/..."
                        onChange={(e) => { setSocialTelegram(e.target.value); setSocialSaved(false); }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-xs text-muted-foreground">VK</span>
                      <input
                        type="text"
                        value={socialVk}
                        placeholder="https://vk.com/..."
                        onChange={(e) => { setSocialVk(e.target.value); setSocialSaved(false); }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-xs text-muted-foreground">Одноклассники</span>
                      <input
                        type="text"
                        value={socialOk}
                        placeholder="https://ok.ru/..."
                        onChange={(e) => { setSocialOk(e.target.value); setSocialSaved(false); }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-xs text-muted-foreground">MAX</span>
                      <input
                        type="text"
                        value={socialMax}
                        placeholder="https://max.ru/..."
                        onChange={(e) => { setSocialMax(e.target.value); setSocialSaved(false); }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    disabled={socialSaving}
                    onClick={async () => {
                      setSocialSaving(true);
                      try {
                        await apiSaveSiteSettings({
                          social_telegram: socialTelegram.trim(),
                          social_vk: socialVk.trim(),
                          social_ok: socialOk.trim(),
                          social_max: socialMax.trim(),
                        });
                        setSocialSaved(true);
                        setTimeout(() => setSocialSaved(false), 2000);
                      } catch (_e) {
                        // ignore
                      } finally { setSocialSaving(false); }
                    }}>
                    {socialSaving
                      ? <Icon name="Loader2" size={14} className="animate-spin" />
                      : socialSaved
                        ? <Icon name="Check" size={14} className="text-green-600" />
                        : <Icon name="Save" size={14} />}
                    <span className="ml-1.5">Сохранить</span>
                  </Button>
                </div>
              </div>
            </div>

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

            {/* Автоскоринг заявок */}
            <div className={`mt-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${scoringEnabled ? 'border-blue-300 bg-blue-50' : 'border-border bg-card'}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${scoringEnabled ? 'bg-blue-200 text-blue-700' : 'bg-secondary text-muted-foreground'}`}>
                  <Icon name="Bot" size={18} />
                </div>
                <div>
                  <p className="font-semibold text-primary">Автоскоринг заявок роботом</p>
                  <p className="text-sm text-muted-foreground">
                    {scoringEnabled
                      ? 'Включён — оператор может запустить проверку по заявке в её карточке'
                      : 'Выключен — кнопка проверки в карточке заявки скрыта'}
                  </p>
                </div>
              </div>
              <Button
                disabled={scoringSaving}
                size="sm"
                onClick={async () => {
                  setScoringSaving(true);
                  const next = !scoringEnabled;
                  try {
                    await apiSaveSiteSettings({ scoring_enabled: next ? 'true' : 'false' });
                    setScoringEnabled(next);
                  } catch (_e) {
                    // ignore
                  } finally { setScoringSaving(false); }
                }}
                className={scoringEnabled
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'}>
                {scoringSaving
                  ? <span className="flex items-center gap-1.5"><Icon name="Loader2" size={14} className="animate-spin" /> Сохранение...</span>
                  : scoringEnabled
                    ? <span className="flex items-center gap-1.5"><Icon name="Power" size={14} /> Выключить</span>
                    : <span className="flex items-center gap-1.5"><Icon name="Power" size={14} /> Включить</span>
                }
              </Button>
            </div>

            {scoringEnabled && (
              <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Icon name="AlertTriangle" size={16} className="text-blue-600" /> Порог отказа по долгу
                </p>
                <p className="mb-3 text-sm text-muted-foreground">
                  Если сумма текущего долга клиента (указанного в анкете) больше этого значения — робот автоматически отклонит заявку.
                </p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 max-w-[200px]">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={debtThreshold}
                      onChange={(e) => { setDebtThreshold(e.target.value); setThresholdSaved(false); }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₽</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={thresholdSaving || !debtThreshold}
                    onClick={async () => {
                      setThresholdSaving(true);
                      try {
                        await apiSaveSiteSettings({ scoring_debt_threshold: String(Math.max(0, Number(debtThreshold) || 0)) });
                        setThresholdSaved(true);
                        setTimeout(() => setThresholdSaved(false), 2000);
                      } catch (_e) {
                        // ignore
                      } finally { setThresholdSaving(false); }
                    }}>
                    {thresholdSaving
                      ? <Icon name="Loader2" size={14} className="animate-spin" />
                      : thresholdSaved
                        ? <Icon name="Check" size={14} className="text-green-600" />
                        : <Icon name="Save" size={14} />}
                    <span className="ml-1.5">Сохранить</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminSettings;