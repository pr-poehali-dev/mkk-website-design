import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import {
  apiGetSystemEmailTemplates, apiSaveSystemEmailTemplates,
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

  const previewHtml = (body: string, isCode?: boolean) => `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:12px;">
      <h3 style="color:${tpl.design.primary_color};margin:0 0 12px;">${tpl.design.brand_name}</h3>
      <p style="color:#333;font-size:13px;line-height:1.6;margin:0 0 10px;">${body.replace('{ref}', 'ZP-1234')}</p>
      ${isCode ? `<p style="font-size:22px;font-weight:bold;letter-spacing:5px;color:${tpl.design.primary_color};text-align:center;background:${tpl.design.accent_color};border-radius:8px;padding:12px;margin:0;">123456</p>` : ''}
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

      <main className="container max-w-3xl px-4 py-8 pb-28">
        <h1 className="font-display text-2xl font-bold text-primary">Тексты и дизайн писем</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Письма отправляются автоматически при регистрации заявки, смене статуса и подписи договора.
          В тексте можно использовать <code className="rounded bg-secondary px-1 py-0.5 text-xs">{'{ref}'}</code> — номер заявки будет подставлен автоматически.
        </p>

        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Дизайн письма */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <Icon name="Palette" size={16} className="text-accent" /> Дизайн письма
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Название компании</Label>
                  <Input value={tpl.design.brand_name}
                    onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, brand_name: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Основной цвет</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={tpl.design.primary_color}
                      onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, primary_color: e.target.value } })}
                      className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border" />
                    <Input value={tpl.design.primary_color}
                      onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, primary_color: e.target.value } })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Цвет фона акцента</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={tpl.design.accent_color}
                      onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, accent_color: e.target.value } })}
                      className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border" />
                    <Input value={tpl.design.accent_color}
                      onChange={(e) => setTpl({ ...tpl, design: { ...tpl.design, accent_color: e.target.value } })} />
                  </div>
                </div>
              </div>
            </section>

            {/* Письмо при регистрации */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <Icon name="FileCheck" size={16} className="text-accent" /> Письмо при регистрации заявки
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Тема письма</Label>
                    <Input value={tpl.register_email.subject}
                      onChange={(e) => setTpl({ ...tpl, register_email: { ...tpl.register_email, subject: e.target.value } })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Текст письма</Label>
                    <Textarea className="min-h-[110px]" value={tpl.register_email.body}
                      onChange={(e) => setTpl({ ...tpl, register_email: { ...tpl.register_email, body: e.target.value } })} />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Предпросмотр</Label>
                  <div dangerouslySetInnerHTML={{ __html: previewHtml(tpl.register_email.body) }} />
                </div>
              </div>
            </section>

            {/* Письма при смене статуса */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <Icon name="RefreshCw" size={16} className="text-accent" /> Письма при смене статуса заявки
              </p>
              <div className="space-y-5">
                {(Object.keys(STATUS_META) as StatusKey[]).map((key) => {
                  const meta = STATUS_META[key];
                  const value = tpl.status_emails[key] || { subject: '', body: '' };
                  return (
                    <div key={key} className="rounded-xl border border-border p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}>
                          <Icon name={meta.icon} size={14} />
                        </div>
                        <p className="text-sm font-semibold text-primary">{meta.label}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Тема письма</Label>
                            <Input value={value.subject}
                              onChange={(e) => setTpl({
                                ...tpl,
                                status_emails: { ...tpl.status_emails, [key]: { ...value, subject: e.target.value } },
                              })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Текст письма</Label>
                            <Textarea className="min-h-[90px]" value={value.body}
                              onChange={(e) => setTpl({
                                ...tpl,
                                status_emails: { ...tpl.status_emails, [key]: { ...value, body: e.target.value } },
                              })} />
                          </div>
                        </div>
                        <div>
                          <Label className="mb-1.5 block text-xs text-muted-foreground">Предпросмотр</Label>
                          <div dangerouslySetInnerHTML={{ __html: previewHtml(value.body) }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Письма с кодом подтверждения */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <Icon name="ShieldCheck" size={16} className="text-accent" /> Письма с кодом подтверждения
              </p>
              <div className="space-y-5">
                {CODE_PURPOSES.map(({ key, label, icon }) => {
                  const value = tpl.code_emails[key];
                  return (
                    <div key={key} className="rounded-xl border border-border p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Icon name={icon} size={16} className="text-accent" />
                        <p className="text-sm font-semibold text-primary">{label}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Тема письма</Label>
                            <Input value={value.subject}
                              onChange={(e) => setTpl({
                                ...tpl,
                                code_emails: { ...tpl.code_emails, [key]: { ...value, subject: e.target.value } },
                              })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Вступительный текст (перед кодом)</Label>
                            <Textarea className="min-h-[80px]" value={value.intro}
                              onChange={(e) => setTpl({
                                ...tpl,
                                code_emails: { ...tpl.code_emails, [key]: { ...value, intro: e.target.value } },
                              })} />
                          </div>
                        </div>
                        <div>
                          <Label className="mb-1.5 block text-xs text-muted-foreground">Предпросмотр</Label>
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
          <div className="container flex max-w-3xl items-center justify-end gap-3 px-4 py-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <Icon name="CheckCircle2" size={16} /> Сохранено
              </span>
            )}
            <Button disabled={saving} onClick={handleSave} className="flex items-center gap-1.5">
              {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Save" size={16} />}
              Сохранить изменения
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmails;