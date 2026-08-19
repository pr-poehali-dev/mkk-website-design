import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import {
  apiGetSystemEmailTemplates, apiSaveSystemEmailTemplates, apiUploadFile,
  DEFAULT_SYSTEM_EMAIL_TEMPLATES, type SystemEmailTemplates,
} from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';

const CODE_PURPOSES: { key: 'register' | 'sign'; label: string; icon: string }[] = [
  { key: 'register', label: 'Код подтверждения регистрации', icon: 'UserPlus' },
  { key: 'sign', label: 'Код подписи договора', icon: 'PenLine' },
];

const AdminEmails = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tpl, setTpl] = useState<SystemEmailTemplates>(DEFAULT_SYSTEM_EMAIL_TEMPLATES);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (authed) {
      apiGetSystemEmailTemplates().then((t) => {
        setTpl(t);
        setLoaded(true);
      });
    }
  }, [authed]);

  if (!authed) {
    return <AdminLoginScreen onAuth={() => setAuthed(true)} />;
  }

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await apiSaveSystemEmailTemplates(tpl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const url = await apiUploadFile(file);
      setTpl({ ...tpl, design: { ...tpl.design, logo_url: url } });
    } finally {
      setLogoUploading(false);
    }
  };

  const previewHtml = (body: string, isCode?: boolean) => `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:14px;border:1px solid #eee;border-radius:10px;">
      ${tpl.design.logo_url ? `<img src="${tpl.design.logo_url}" alt="${tpl.design.brand_name}" style="max-height:34px;margin:0 0 8px;display:block;" />` : ''}
      <h3 style="color:${tpl.design.primary_color};margin:0 0 8px;font-size:15px;">${tpl.design.brand_name}</h3>
      <p style="color:#333;font-size:12px;line-height:1.5;margin:0 0 8px;">${body.replace('{ref}', 'ZP-1234')}</p>
      ${isCode ? `<p style="font-size:18px;font-weight:bold;letter-spacing:4px;color:${tpl.design.primary_color};text-align:center;background:${tpl.design.accent_color};border-radius:6px;padding:8px;margin:0 0 8px;">123456</p>` : ''}
      ${tpl.design.signature ? `<p style="color:#888;font-size:10px;white-space:pre-line;margin:10px 0 0;border-top:1px solid #eee;padding-top:8px;">${tpl.design.signature}</p>` : ''}
    </div>
  `;

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon name="Mail" size={20} className="text-accent" />
            <span className="font-display text-lg font-bold tracking-wide">ТЕКСТЫ ПИСЕМ</span>
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

      <main className="container max-w-3xl px-4 py-6 pb-24">
        <h1 className="font-display text-xl font-bold text-primary">Тексты и дизайн писем</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Письма отправляются автоматически при обращении «Задать вопрос», смене статуса заявки, подписи договора и за 1-2 дня до срока погашения займа.
          В тексте можно использовать <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">{'{ref}'}</code> — номер заявки будет подставлен автоматически (для писем по статусам заявки).
        </p>

        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Дизайн письма */}
            <section className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Icon name="Palette" size={14} className="text-accent" /> Дизайн письма
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Название компании</Label>
                  <Input className="h-8 text-sm" value={tpl.design.brand_name}
                    onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, brand_name: e.target.value } })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Основной цвет</Label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={tpl.design.primary_color}
                      onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, primary_color: e.target.value } })}
                      className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border" />
                    <Input className="h-8 text-sm" value={tpl.design.primary_color}
                      onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, primary_color: e.target.value } })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Цвет фона акцента</Label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={tpl.design.accent_color}
                      onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, accent_color: e.target.value } })}
                      className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border" />
                    <Input className="h-8 text-sm" value={tpl.design.accent_color}
                      onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, accent_color: e.target.value } })} />
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Логотип в шапке письма</Label>
                  <div className="flex items-center gap-2">
                    {tpl.design.logo_url && (
                      <img src={tpl.design.logo_url} alt="Логотип" className="h-8 max-w-[100px] rounded border border-border object-contain p-1" />
                    )}
                    <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-secondary ${logoUploading ? 'pointer-events-none opacity-60' : ''}`}>
                      {logoUploading ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Upload" size={13} />}
                      {tpl.design.logo_url ? 'Заменить' : 'Загрузить логотип'}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
                    </label>
                    {tpl.design.logo_url && (
                      <button type="button" onClick={() => setTpl({ ...tpl, design: { ...tpl.design, logo_url: '' } })}
                        className="text-xs text-muted-foreground hover:text-red-500">
                        Убрать
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Подпись внизу письма</Label>
                  <Textarea className="min-h-[56px] text-sm" value={tpl.design.signature || ''}
                    onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, signature: e.target.value } })} />
                </div>
              </div>
            </section>

            {/* Письмо при обращении через форму "Задать вопрос" */}
            <section className="rounded-xl border border-border bg-card p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Icon name="FileCheck" size={14} className="text-accent" /> Письмо при обращении «Задать вопрос»
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Отправляется автоматически клиенту, когда он оставляет вопрос через форму на сайте. Не связано с регистрацией займа.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Тема письма</Label>
                    <Input className="h-8 text-sm" value={tpl.register_email.subject}
                      onChange={(e) => setTpl({ ...tpl, register_email: { ...tpl.register_email, subject: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Текст письма</Label>
                    <Textarea className="min-h-[90px] text-sm" value={tpl.register_email.body}
                      onChange={(e) => setTpl({ ...tpl, register_email: { ...tpl.register_email, body: e.target.value } })} />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Предпросмотр</Label>
                  <div dangerouslySetInnerHTML={{ __html: previewHtml(tpl.register_email.body) }} />
                </div>
              </div>
            </section>

            {/* Письма при смене статуса */}
            <section className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Icon name="RefreshCw" size={14} className="text-accent" /> Письма при смене статуса заявки
              </p>
              <div className="space-y-3">
                {(Object.keys(STATUS_META) as StatusKey[]).map((key) => {
                  const meta = STATUS_META[key];
                  const value = tpl.status_emails[key] || { subject: '', body: '' };
                  return (
                    <div key={key} className="rounded-lg border border-border p-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-md ${meta.bg} ${meta.color}`}>
                          <Icon name={meta.icon} size={12} />
                        </div>
                        <p className="text-xs font-semibold text-primary">{meta.label}</p>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Тема письма</Label>
                            <Input className="h-8 text-sm" value={value.subject}
                              onChange={(e) => setTpl({
                                ...tpl,
                                status_emails: { ...tpl.status_emails, [key]: { ...value, subject: e.target.value } },
                              })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Текст письма</Label>
                            <Textarea className="min-h-[70px] text-sm" value={value.body}
                              onChange={(e) => setTpl({
                                ...tpl,
                                status_emails: { ...tpl.status_emails, [key]: { ...value, body: e.target.value } },
                              })} />
                          </div>
                        </div>
                        <div>
                          <Label className="mb-1 block text-xs text-muted-foreground">Предпросмотр</Label>
                          <div dangerouslySetInnerHTML={{ __html: previewHtml(value.body) }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Письмо-напоминание о погашении */}
            <section className="rounded-xl border border-border bg-card p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Icon name="BellRing" size={14} className="text-accent" /> Напоминание о погашении займа
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Отправляется автоматически за 1-2 дня до срока погашения займа (статус «Деньги выданы»). Доступны переменные{' '}
                <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">{'{ref}'}</code>,{' '}
                <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">{'{return_date}'}</code>,{' '}
                <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">{'{total}'}</code>.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Тема письма</Label>
                    <Input className="h-8 text-sm" value={tpl.reminder_email.subject}
                      onChange={(e) => setTpl({ ...tpl, reminder_email: { ...tpl.reminder_email, subject: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Текст письма</Label>
                    <Textarea className="min-h-[90px] text-sm" value={tpl.reminder_email.body}
                      onChange={(e) => setTpl({ ...tpl, reminder_email: { ...tpl.reminder_email, body: e.target.value } })} />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Предпросмотр</Label>
                  <div dangerouslySetInnerHTML={{ __html: previewHtml(tpl.reminder_email.body.replace('{return_date}', '25.08.2026').replace('{total}', '16 800')) }} />
                </div>
              </div>
            </section>

            {/* Письма с кодом подтверждения */}
            <section className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Icon name="ShieldCheck" size={14} className="text-accent" /> Письма с кодом подтверждения
              </p>
              <div className="space-y-3">
                {CODE_PURPOSES.map(({ key, label, icon }) => {
                  const value = tpl.code_emails[key];
                  return (
                    <div key={key} className="rounded-lg border border-border p-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <Icon name={icon} size={14} className="text-accent" />
                        <p className="text-xs font-semibold text-primary">{label}</p>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Тема письма</Label>
                            <Input className="h-8 text-sm" value={value.subject}
                              onChange={(e) => setTpl({
                                ...tpl,
                                code_emails: { ...tpl.code_emails, [key]: { ...value, subject: e.target.value } },
                              })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Вступительный текст (перед кодом)</Label>
                            <Textarea className="min-h-[60px] text-sm" value={value.intro}
                              onChange={(e) => setTpl({
                                ...tpl,
                                code_emails: { ...tpl.code_emails, [key]: { ...value, intro: e.target.value } },
                              })} />
                          </div>
                        </div>
                        <div>
                          <Label className="mb-1 block text-xs text-muted-foreground">Предпросмотр</Label>
                          <div dangerouslySetInnerHTML={{ __html: previewHtml(value.intro, true) }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {loaded && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur">
          <div className="container flex max-w-3xl items-center justify-end gap-3 px-4 py-2.5">
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-green-600">
                <Icon name="CheckCircle2" size={14} /> Сохранено
              </span>
            )}
            <Button size="sm" disabled={saving} onClick={handleSave} className="flex items-center gap-1.5">
              {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
              Сохранить изменения
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmails;