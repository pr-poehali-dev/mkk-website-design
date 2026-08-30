import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import CameraCapture from '@/components/anketa/CameraCapture';
import { apiGetIdentifyByToken, apiSubmitIdentify, apiUploadFile, type IdentifyState } from '@/lib/api';
import { useMaintenance } from '@/lib/maintenanceContext';
import { buildPersonalDataConsentHtml, buildDataTransferConsentHtml } from '@/components/admin/documentTemplates';

const CHECK_SECONDS = 40;

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
    <div className="animate-fade-up w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-xl sm:p-10">
      {children}
    </div>
  </div>
);

const Identify = () => {
  const { token } = useParams<{ token: string }>();
  const { companyName } = useMaintenance();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IdentifyState | null>(null);
  const [loadError, setLoadError] = useState('');

  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportChecking, setPassportChecking] = useState(false);
  const [passportChecked, setPassportChecked] = useState(false);
  const [passportSecondsLeft, setPassportSecondsLeft] = useState(0);

  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfieChecking, setSelfieChecking] = useState(false);
  const [selfieChecked, setSelfieChecked] = useState(false);
  const [selfieSecondsLeft, setSelfieSecondsLeft] = useState(0);

  const [consentPd, setConsentPd] = useState(false);
  const [consentTransfer, setConsentTransfer] = useState(false);
  const [consentContract, setConsentContract] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const MAX_FILE_MB = 5;
  const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await apiGetIdentifyByToken(token);
      setData(res);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Ссылка не найдена');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const runFileCheck = (
    setChecking: (v: boolean) => void,
    setChecked: (v: boolean) => void,
    setSecondsLeft: (v: number | ((s: number) => number)) => void,
  ) => {
    setChecked(false);
    setChecking(true);
    setSecondsLeft(CHECK_SECONDS);
    const timer = setInterval(() => {
      setSecondsLeft((s: number) => {
        if (s <= 1) {
          clearInterval(timer);
          setChecking(false);
          setChecked(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handlePassportPhoto = (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setSubmitError(`Фото паспорта слишком большое. Максимум ${MAX_FILE_MB} МБ.`);
      return;
    }
    setSubmitError('');
    setPassportFile(file);
    setPassportPhoto(URL.createObjectURL(file));
    runFileCheck(setPassportChecking, setPassportChecked, setPassportSecondsLeft);
  };

  const handleSelfiePhoto = (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setSubmitError(`Фото слишком большое. Максимум ${MAX_FILE_MB} МБ.`);
      return;
    }
    setSubmitError('');
    setSelfieFile(file);
    setSelfiePhoto(URL.createObjectURL(file));
    runFileCheck(setSelfieChecking, setSelfieChecked, setSelfieSecondsLeft);
  };

  const previewDoc = (build: (c: { full_name?: string }, companyName?: string) => string, fullName: string) => {
    const html = build({ full_name: fullName }, companyName);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const canSubmit = passportFile && selfieFile && !passportChecking && !selfieChecking && consentPd && consentTransfer && consentContract;

  const handleSubmit = async () => {
    if (!token || !passportFile || !selfieFile) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const passport_photo_url = await apiUploadFile(passportFile);
      const selfie_photo_url = await apiUploadFile(selfieFile);
      await apiSubmitIdentify({
        token,
        passport_photo_url,
        selfie_photo_url,
        consent_pd: consentPd,
        consent_transfer: consentTransfer,
        consent_contract: consentContract,
      });
      setSubmitted(true);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Не удалось отправить данные');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <Icon name="Loader2" size={32} className="mx-auto animate-spin text-muted-foreground" />
      </Shell>
    );
  }

  if (loadError || !data) {
    return (
      <Shell>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <Icon name="AlertTriangle" size={28} className="text-red-600" />
        </div>
        <h1 className="font-display text-xl font-bold text-primary">Ссылка недоступна</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loadError || 'Проверьте правильность ссылки или запросите новую у оператора.'}</p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/">На главную</Link>
        </Button>
      </Shell>
    );
  }

  if (data.state === 'expired') {
    return (
      <Shell>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
          <Icon name="Clock" size={28} className="text-orange-600" />
        </div>
        <h1 className="font-display text-xl font-bold text-primary">Срок ссылки истёк</h1>
        <p className="mt-2 text-sm text-muted-foreground">Эта ссылка действовала ограниченное время и больше не активна. Попросите оператора отправить новую ссылку.</p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/">На главную</Link>
        </Button>
      </Shell>
    );
  }

  if (data.state === 'submitted' || submitted) {
    const statusLabel = data.state === 'submitted' ? data.status_label : 'На проверке';
    const passportStatus = data.state === 'submitted' ? data.passport_photo_status : 'pending';
    const selfieStatus = data.state === 'submitted' ? data.selfie_photo_status : 'pending';
    const statusIcon = (st: string | null) => st === 'approved' ? 'CheckCircle2' : st === 'rejected' ? 'XCircle' : 'Clock';
    const statusColor = (st: string | null) => st === 'approved' ? 'text-green-600' : st === 'rejected' ? 'text-red-600' : 'text-orange-500';
    const statusText = (st: string | null) => st === 'approved' ? 'Принято' : st === 'rejected' ? 'Отклонено' : 'На проверке';
    return (
      <Shell>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Icon name="ShieldCheck" size={28} className="text-blue-600" />
        </div>
        <h1 className="font-display text-xl font-bold text-primary">Документы уже отправлены</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Эта ссылка была использована ранее. Повторная отправка данных по ней невозможна.
        </p>
        <div className="mt-5 space-y-2 rounded-xl bg-secondary p-4 text-left text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Фото паспорта</span>
            <span className={`flex items-center gap-1.5 font-medium ${statusColor(passportStatus)}`}>
              <Icon name={statusIcon(passportStatus)} size={14} /> {statusText(passportStatus)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Селфи с паспортом</span>
            <span className={`flex items-center gap-1.5 font-medium ${statusColor(selfieStatus)}`}>
              <Icon name={statusIcon(selfieStatus)} size={14} /> {statusText(selfieStatus)}
            </span>
          </div>
          {data.state === 'submitted' && (
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Статус заявки</span>
              <span className="font-semibold text-primary">{statusLabel}</span>
            </div>
          )}
        </div>
        <Button asChild variant="secondary" className="mt-6 w-full">
          <Link to="/login">Личный кабинет</Link>
        </Button>
      </Shell>
    );
  }

  // state === 'valid'
  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon name="Landmark" size={20} />
            </div>
            <span className="font-display text-lg font-bold tracking-wide text-primary">{companyName}</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-xl px-4 py-10">
        <div className="animate-fade-up rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Icon name="ShieldCheck" size={22} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-primary">Идентификация клиента</h1>
              <p className="text-sm text-muted-foreground">
                {data.full_name ? `${data.full_name} · ` : ''}Заявка {data.ref_number}
              </p>
            </div>
          </div>

          <p className="mb-6 rounded-lg bg-orange-50 p-3 text-xs text-orange-700 flex items-center gap-2">
            <Icon name="Clock" size={14} className="shrink-0" /> Ссылка одноразовая и действует ограниченное время. После отправки повторно воспользоваться ей нельзя.
          </p>

          {submitError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <p className="flex items-center gap-2"><Icon name="AlertCircle" size={16} className="shrink-0" /> {submitError}</p>
            </div>
          )}

          <div className="space-y-6">
            <CameraCapture
              label="Фото паспорта (разворот с фото)"
              hint="Наведите камеру на разворот с фотографией"
              preview={passportPhoto}
              onCapture={handlePassportPhoto}
              checking={passportChecking}
              checked={passportChecked}
              secondsLeft={passportSecondsLeft}
              totalSeconds={CHECK_SECONDS}
            />

            <CameraCapture
              label="Селфи с паспортом у лица"
              hint="Держите открытый паспорт рядом с лицом"
              preview={selfiePhoto}
              onCapture={handleSelfiePhoto}
              aspect="square"
              checking={selfieChecking}
              checked={selfieChecked}
              secondsLeft={selfieSecondsLeft}
              totalSeconds={CHECK_SECONDS}
            />

            {(passportChecking || selfieChecking) && (
              <p className="flex items-center gap-1.5 text-center text-xs text-blue-600">
                <Icon name="Loader2" size={13} className="shrink-0 animate-spin" /> Дождитесь окончания проверки фото
              </p>
            )}

            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Согласия</p>

              <label className="flex items-start gap-2.5 text-sm">
                <Checkbox checked={consentPd} onCheckedChange={(v) => setConsentPd(!!v)} className="mt-0.5" />
                <span>
                  Даю согласие на{' '}
                  <button type="button" onClick={() => previewDoc(buildPersonalDataConsentHtml, data.full_name)} className="text-accent hover:underline">
                    обработку персональных данных
                  </button>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-sm">
                <Checkbox checked={consentTransfer} onCheckedChange={(v) => setConsentTransfer(!!v)} className="mt-0.5" />
                <span>
                  Даю согласие на{' '}
                  <button type="button" onClick={() => previewDoc(buildDataTransferConsentHtml, data.full_name)} className="text-accent hover:underline">
                    передачу персональных данных третьим лицам
                  </button>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-sm">
                <Checkbox checked={consentContract} onCheckedChange={(v) => setConsentContract(!!v)} className="mt-0.5" />
                <span>Согласен(на) с условиями договора займа</span>
              </label>
            </div>

            <Button
              size="lg"
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
              className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Icon name="Loader2" size={18} className="animate-spin" /> Отправляем...
                </span>
              ) : (
                <span className="flex items-center gap-2">Отправить на проверку <Icon name="Send" size={18} /></span>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Identify;
