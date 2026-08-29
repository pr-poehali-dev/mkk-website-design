import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { apiSubmitSupportRequest, apiUploadFile } from '@/lib/api';
import { getSession } from '@/lib/api';
import { useMaintenance } from '@/lib/maintenanceContext';
import SocialLinks from '@/components/SocialLinks';

const HERO_IMG = 'https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/files/affeadbd-d565-4434-9e7e-31d8281c0679.jpg';
const MAX_FILES = 10;

const Appeal = () => {
  const { companyName, companyPhone, companyEmail } = useMaintenance();
  const nav = useNavigate();
  const session = getSession();

  const [fullName, setFullName] = useState(session?.full_name || '');
  const [email, setEmail] = useState(session?.email || '');
  const [refNumber, setRefNumber] = useState(session?.ref_number || '');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleFilesAdd = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, MAX_FILES);
    setFiles(next);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setError('Заполните ФИО, email и сообщение');
      return;
    }
    setError('');
    setLoading(true);
    try {
      let file_urls: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        file_urls = await Promise.all(files.map((f) => apiUploadFile(f, 'appeals')));
        setUploading(false);
      }
      await apiSubmitSupportRequest({
        name: fullName.trim(),
        phone: session?.phone,
        email: email.trim(),
        message: message.trim(),
        ref_number: refNumber.trim() || undefined,
        file_urls,
      });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить обращение');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/30 ring-1 ring-white/10">
              <Icon name="Landmark" size={19} />
            </div>
            <div className="leading-none">
              <p className="font-display text-lg font-bold tracking-wide text-primary">ЗАЙМЫ ПЛЮС</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Займы онлайн 24/7</p>
            </div>
          </Link>
          <Button asChild variant="outline" size="sm" className="rounded-full border-border text-primary hover:bg-secondary">
            <Link to="/"><Icon name="ArrowLeft" size={16} className="mr-1" /> На главную</Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
          <Icon name="ChevronRight" size={14} />
          <span className="text-primary font-medium">Подать обращение</span>
        </nav>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-sky-50 to-primary/10 px-6 py-8 sm:px-10 sm:py-10">
          <div className="relative flex items-center justify-between gap-6">
            <div className="max-w-md">
              <h1 className="font-display text-3xl font-bold text-primary sm:text-4xl">Приёмная по правам клиента</h1>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Защита прав клиентов — наш приоритет! Благодаря вашим обращениям мы выявляем и реагируем на мошеннические случаи, обеспечивая безопасность и уверенность при взаимодействии с нашей компанией
              </p>
            </div>
            <img src={HERO_IMG} alt="Обращение в поддержку" className="hidden h-32 w-32 shrink-0 object-contain sm:block sm:h-40 sm:w-40" />
          </div>
        </div>

        {/* Как отправить обращение */}
        <div className="mt-8 rounded-3xl bg-secondary p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-primary sm:text-2xl">Как отправить обращение</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Для направления обращения вы можете использовать <span className="font-semibold text-primary">форму ниже или один из следующих способов:</span>
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-card p-5">
              <p className="text-sm text-muted-foreground">Обращение на электронную почту общества</p>
              <a href={`mailto:${companyEmail}`} className="mt-1 block font-semibold text-primary hover:text-accent transition-colors">
                {companyEmail}
              </a>
            </div>
            <div className="rounded-2xl bg-card p-5">
              <p className="text-sm text-muted-foreground">Письменное обращение на почтовый адрес</p>
              <p className="mt-1 font-semibold text-red-700">Сервис не доступен </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-card p-5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon name="AlertCircle" size={14} />
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p>Максимальный срок рассмотрения вашего обращения <span className="font-semibold text-primary">12 рабочих дней с даты его регистрации</span>. Для некоторых типов обращений предусмотрен более короткий срок рассмотрения.</p>
              <p className="mt-2">Ответ на обращение будет направлен указанную электронную почту или почтовый адрес</p>
            </div>
          </div>
        </div>

        {/* Форма */}
        <div className="mt-8 rounded-3xl bg-secondary p-6 sm:p-8">
          {sent ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Icon name="CheckCircle2" size={30} className="text-green-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-primary">Ваше обращение принято</h2>
              <p className="mt-2 text-sm text-muted-foreground">Мы ответим вам на указанную электронную почту в течение 12 рабочих дней.</p>
              <Button className="mt-5" onClick={() => nav('/')}>На главную</Button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-primary sm:text-2xl">Оставьте ваше обращение</h2>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="Фамилия, имя, отчество*"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 rounded-xl bg-card"
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Электронная почта*"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl bg-card"
                    required
                  />
                </div>
                <Input
                  placeholder="№ договора (при наличии)"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="h-12 rounded-xl bg-card"
                />
                <Textarea
                  placeholder="Сообщение*"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[140px] rounded-xl bg-card"
                  required
                />

                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-card px-4 py-3.5 hover:bg-card/70 transition-colors">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon name="Plus" size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">Добавить файл</p>
                    <p className="text-xs text-muted-foreground">Максимум {MAX_FILES} файлов (формат *.png, *.jpg, *.jpeg)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesAdd(e.target.files)}
                  />
                </label>

                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs text-primary">
                        <Icon name="Paperclip" size={13} className="text-muted-foreground" />
                        <span className="max-w-[140px] truncate">{f.name}</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-red-600">
                          <Icon name="X" size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <p className="flex items-center gap-1.5 text-sm text-red-500">
                    <Icon name="AlertCircle" size={14} className="shrink-0" /> {error}
                  </p>
                )}

                <div className="flex flex-col items-start gap-3 pt-1 sm:flex-row sm:items-center">
                  <Button type="submit" size="lg" disabled={loading} className="h-12 w-full rounded-xl px-8 sm:w-auto">
                    {loading
                      ? <span className="flex items-center gap-2"><Icon name="Loader2" size={16} className="animate-spin" /> {uploading ? 'Загрузка файлов...' : 'Отправляем...'}</span>
                      : 'Отправить'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Нажимая на кнопку, вы соглашаетесь на <button type="button" className="text-accent underline underline-offset-2 hover:text-accent/80">обработку персональных данных</button>
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-10 rounded-t-2xl bg-primary text-primary-foreground/70">
        <div className="container border-t border-primary-foreground/10 px-4 py-10 text-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <p className="font-display text-lg font-bold tracking-wide text-primary-foreground text-center">ЧАСТНЫЕ ЗАЙМЫ ПЛЮС</p>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/40">Служба поддержки</p>
              <a href={`tel:${companyPhone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-primary-foreground hover:text-accent transition-colors font-medium text-base">
                <Icon name="Phone" size={16} className="text-accent" /> {companyPhone}
              </a>
              <a href={`mailto:${companyEmail}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                <Icon name="Mail" size={16} className="text-accent" /> {companyEmail}
              </a>
              <SocialLinks className="mt-1" />
            </div>
            <p className="text-primary-foreground/60 text-center">© 2026 {companyName}. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Appeal;