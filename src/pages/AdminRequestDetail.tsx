import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { apiGetAll, apiUpdateRequest, type UserSession } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';
import AdminEditClientInfo from '@/components/admin/AdminEditClientInfo';
import AdminEditDocumentsPassword from '@/components/admin/AdminEditDocumentsPassword';
import AdminEditEmailForm from '@/components/admin/AdminEditEmailForm';
import AdminEditLoanForm from '@/components/admin/AdminEditLoanForm';
import AdminPaymentHistory from '@/components/admin/AdminPaymentHistory';
import AdminReceiptHistory from '@/components/admin/AdminReceiptHistory';
import { type EditForm } from '@/components/admin/adminEditTypes';
import {
  apiAdminSetPassword, apiUploadFile, apiAdminSetDocStatus, apiSendEmail,
  apiGetEmailTemplates, apiSaveEmailTemplates, apiGetSiteSettings, apiRunScoring,
  type EmailTemplate, type ScoringResult,
} from '@/lib/api';
import { useMaintenance } from '@/lib/maintenanceContext';
import { buildContractHtml } from '@/components/admin/contractHtml';

const fmt = (n: number) => n.toLocaleString('ru-RU');

const AdminRequestDetail = () => {
  const { ref } = useParams<{ ref: string }>();
  const navigate = useNavigate();
  const { companyName, companyInn, companyOgrn } = useMaintenance();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [selected, setSelected] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ status: '', amount: '', days: '', operator_comment: '', admin_notes: '', payment_bank: '', insurance_enabled: false });
  const [deleting, setDeleting] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const [docUploading, setDocUploading] = useState(false);
  const [docStatusSaving, setDocStatusSaving] = useState<string | null>(null);
  const [docStatuses, setDocStatuses] = useState<Record<string, string>>({
    passport_photo_status: 'pending', registration_photo_status: 'pending',
    income_doc_status: 'pending', selfie_photo_status: 'pending',
    card_photo_status: 'pending', snils_photo_status: 'pending',
  });
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailFileUploading, setEmailFileUploading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [saveTemplateMode, setSaveTemplateMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateSaving, setTemplateSaving] = useState(false);
  const [scoringEnabled, setScoringEnabled] = useState(false);
  const [scoringRunning, setScoringRunning] = useState(false);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);

  const load = useCallback(async () => {
    if (!ref) return;
    setLoading(true);
    try {
      const all = await apiGetAll();
      const found = all.find((r) => r.ref_number === ref) || null;
      setSelected(found);
      if (found) {
        setEditForm({
          status: found.status,
          amount: String(found.amount),
          days: String(found.days),
          operator_comment: found.operator_comment || '',
          admin_notes: found.admin_notes || '',
          payment_bank: found.payment_bank || '',
          insurance_enabled: found.insurance_enabled || false,
        });
        setDocUrls(found.doc_urls || []);
        setDocStatuses({
          passport_photo_status: found.passport_photo_status || 'pending',
          registration_photo_status: found.registration_photo_status || 'pending',
          income_doc_status: found.income_doc_status || 'pending',
          selfie_photo_status: found.selfie_photo_status || 'pending',
          card_photo_status: found.card_photo_status || 'pending',
          snils_photo_status: found.snils_photo_status || 'pending',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [ref]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  useEffect(() => {
    apiGetSiteSettings().then((s) => setScoringEnabled(s.scoring_enabled === 'true')).catch(() => {});
  }, []);

  useEffect(() => {
    if (selected?.email) {
      setTemplatesLoading(true);
      apiGetEmailTemplates().then(setTemplates).finally(() => setTemplatesLoading(false));
    }
  }, [selected?.ref_number, selected?.email]);

  if (!authed) {
    return <AdminLoginScreen onAuth={() => setAuthed(true)} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40">
        <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-secondary/40">
        <p className="text-muted-foreground">Заявка не найдена</p>
        <Link to="/admin" className="text-accent hover:underline">Назад к списку</Link>
      </div>
    );
  }

  const status = (selected.status as StatusKey) in STATUS_META ? (selected.status as StatusKey) : 'review';
  const meta = STATUS_META[status];

  const applyTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const t = templates.find((tpl) => tpl.id === id);
    if (t) {
      setEmailSubject(t.subject);
      setEmailBody(t.body);
      setEmailMsg(null);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName || !emailSubject || !emailBody) return;
    setTemplateSaving(true);
    try {
      const newTemplate: EmailTemplate = { id: Date.now().toString(), name: newTemplateName, subject: emailSubject, body: emailBody };
      const next = [...templates, newTemplate];
      await apiSaveEmailTemplates(next);
      setTemplates(next);
      setSelectedTemplateId(newTemplate.id);
      setNewTemplateName('');
      setSaveTemplateMode(false);
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const next = templates.filter((t) => t.id !== id);
    await apiSaveEmailTemplates(next);
    setTemplates(next);
    if (selectedTemplateId === id) setSelectedTemplateId('');
  };

  const handleEmailFileUpload = async (file: File) => {
    setEmailFileUploading(true);
    try {
      const url = await apiUploadFile(file, 'email-attachments');
      setEmailBody((prev) => `${prev}<p><a href="${url}" target="_blank" rel="noopener noreferrer">📎 ${file.name}</a></p>`);
    } finally {
      setEmailFileUploading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selected || !emailSubject || !emailBody) return;
    setEmailSending(true);
    setEmailMsg(null);
    try {
      await apiSendEmail({ ref_number: selected.ref_number, subject: emailSubject, message: emailBody });
      setEmailMsg({ ok: true, text: 'Письмо отправлено' });
      setEmailSubject('');
      setEmailBody('');
    } catch (e: unknown) {
      setEmailMsg({ ok: false, text: e instanceof Error ? e.message : 'Ошибка' });
    } finally {
      setEmailSending(false);
    }
  };

  const handleDocStatus = async (field: string, newStatus: string) => {
    if (!selected) return;
    setDocStatusSaving(field);
    try {
      await apiAdminSetDocStatus({ ref_number: selected.ref_number, [field]: newStatus });
      setDocStatuses((prev) => ({ ...prev, [field]: newStatus }));
      const patch: Partial<UserSession> = { [field]: newStatus };
      if (newStatus === 'rejected') {
        const urlField = field.replace('_status', '_url') as keyof UserSession;
        patch[urlField] = null as never;
      }
      setSelected((prev) => (prev ? { ...prev, ...patch } : prev));
    } finally {
      setDocStatusSaving(null);
    }
  };

  const handleRunScoring = async () => {
    if (!selected) return;
    setScoringRunning(true);
    setScoringResult(null);
    try {
      const result = await apiRunScoring(selected.ref_number);
      setScoringResult(result);
      setSelected((prev) => (prev ? { ...prev, status: result.status } : prev));
      setEditForm((prev) => ({ ...prev, status: result.status }));
    } finally {
      setScoringRunning(false);
    }
  };

  const handleSetPassword = async () => {
    if (!selected || !newPassword) return;
    setPwdSaving(true);
    setPwdMsg(null);
    try {
      await apiAdminSetPassword(selected.phone, newPassword);
      setPwdMsg({ ok: true, text: 'Пароль успешно изменён' });
      setNewPassword('');
    } catch (e: unknown) {
      setPwdMsg({ ok: false, text: e instanceof Error ? e.message : 'Ошибка' });
    } finally {
      setPwdSaving(false);
    }
  };

  const handleDocUpload = async (files: FileList | null) => {
    if (!files || !selected) return;
    setDocUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map((f) => apiUploadFile(f)));
      const newUrls = [...docUrls, ...urls];
      setDocUrls(newUrls);
      await apiUpdateRequest({ ref_number: selected.ref_number, doc_urls: newUrls });
    } finally {
      setDocUploading(false);
    }
  };

  const handleDocRemove = async (url: string) => {
    if (!selected) return;
    const newUrls = docUrls.filter((u) => u !== url);
    setDocUrls(newUrls);
    await apiUpdateRequest({ ref_number: selected.ref_number, doc_urls: newUrls });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiUpdateRequest({
        ref_number: selected.ref_number,
        status: editForm.status,
        amount: parseInt(editForm.amount),
        days: parseInt(editForm.days),
        operator_comment: editForm.operator_comment,
        admin_notes: editForm.admin_notes,
        payment_bank: editForm.payment_bank || null,
        insurance_enabled: editForm.insurance_enabled,
      });
      setSelected((prev) => prev ? {
        ...prev,
        status: editForm.status,
        amount: parseInt(editForm.amount),
        days: parseInt(editForm.days),
        operator_comment: editForm.operator_comment,
        admin_notes: editForm.admin_notes,
        insurance_enabled: editForm.insurance_enabled,
      } : prev);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`Удалить заявку ${selected.ref_number}? Это действие необратимо.`)) return;
    setDeleting(true);
    try {
      const { apiDeleteRequests } = await import('@/lib/api');
      await apiDeleteRequests([selected.ref_number]);
      navigate('/admin');
    } finally {
      setDeleting(false);
    }
  };

  const getContractInfo = () => {
    if (!selected || !editForm.amount || !editForm.days) return null;
    const amt = parseInt(editForm.amount) || 0;
    const dys = parseInt(editForm.days) || 0;
    const overpay = Math.round(amt * 0.008 * dys);
    const total = amt + overpay;
    const contractCode = `ДГ-${selected.ref_number}-${selected.created_at?.slice(0, 10).replace(/-/g, '')}`;
    const d = new Date(selected.created_at || Date.now());
    d.setDate(d.getDate() + dys);
    const returnDate = d.toLocaleDateString('ru-RU');
    const getHtml = () => buildContractHtml(selected, amt, dys, contractCode, returnDate, undefined, companyName, companyInn, companyOgrn);
    return { amt, dys, overpay, total, contractCode, returnDate, getHtml };
  };

  const contract = getContractInfo();
  const toReturn = selected.status === 'repaid' ? 0 : (contract ? contract.total : selected.amount);

  return (
    <div className="min-h-screen bg-secondary/40">
      <main className="container max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-primary">
            Заявка на займ {selected.ref_number} ({selected.full_name})
          </h1>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting
                ? <span className="flex items-center gap-1.5"><Icon name="Loader2" size={14} className="animate-spin" /> Удаление...</span>
                : <span className="flex items-center gap-1.5"><Icon name="Trash2" size={14} /> Удалить заявку</span>}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin')}>
              <Icon name="ArrowLeft" size={14} className="mr-1.5" /> Назад к списку
            </Button>
          </div>
        </div>

        {/* Шапка со статусом */}
        <div className={`mt-5 flex flex-wrap items-center gap-6 rounded-2xl border-l-4 bg-card p-5 ${meta.border}`}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Текущий статус займа</p>
            <p className={`mt-1 flex items-center gap-1.5 text-lg font-bold ${meta.color}`}>
              <Icon name={meta.icon} size={18} /> {meta.label}
            </p>
            {selected.identify_submitted_at && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                <Icon name="CheckCircle2" size={10} /> Запрос фото ок
              </span>
            )}
          </div>
          <div className="border-l border-border pl-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Сумма займа</p>
            <p className="mt-1 text-lg font-bold text-primary">{fmt(selected.amount)} ₽</p>
          </div>
          <div className="border-l border-border pl-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Срок займа</p>
            <p className="mt-1 text-lg font-bold text-primary">{selected.days} дней</p>
          </div>
          <div className="border-l border-border pl-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Сумма к возврату</p>
            <p className="mt-1 text-lg font-bold text-green-600">{fmt(toReturn)} ₽</p>
          </div>
          <div className="ml-auto border-l border-border pl-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Дата подачи заявки</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {selected.created_at ? new Date(selected.created_at).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
        </div>

        {/* Параметры анкеты и займа */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          <p className="mb-4 font-display text-lg font-bold text-primary">Параметры анкеты и займа</p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="space-y-5">
              <AdminEditClientInfo
                selected={selected}
                scoringEnabled={scoringEnabled}
                scoringRunning={scoringRunning}
                scoringResult={scoringResult}
                onRunScoring={handleRunScoring}
                docStatuses={docStatuses}
                docStatusSaving={docStatusSaving}
                onDocStatus={handleDocStatus}
              />
              <AdminEditDocumentsPassword
                selected={selected}
                docUrls={docUrls}
                docUploading={docUploading}
                onDocUpload={handleDocUpload}
                onDocRemove={handleDocRemove}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                pwdSaving={pwdSaving}
                pwdMsg={pwdMsg}
                setPwdMsg={setPwdMsg}
                onSetPassword={handleSetPassword}
              />
              <AdminEditEmailForm
                selected={selected}
                templatesLoading={templatesLoading}
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                onApplyTemplate={applyTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                emailSubject={emailSubject}
                setEmailSubject={setEmailSubject}
                emailBody={emailBody}
                setEmailBody={setEmailBody}
                setEmailMsg={setEmailMsg}
                emailFileUploading={emailFileUploading}
                onEmailFileUpload={handleEmailFileUpload}
                saveTemplateMode={saveTemplateMode}
                setSaveTemplateMode={setSaveTemplateMode}
                newTemplateName={newTemplateName}
                setNewTemplateName={setNewTemplateName}
                templateSaving={templateSaving}
                onSaveTemplate={handleSaveTemplate}
                emailSending={emailSending}
                onSendEmail={handleSendEmail}
                emailMsg={emailMsg}
              />
            </div>

            <div className="space-y-5">
              <AdminEditLoanForm
                selected={selected}
                editForm={editForm}
                setEditForm={setEditForm}
                contract={contract}
                saving={saving}
                onSave={handleSave}
                onClose={() => navigate('/admin')}
                onBlockToggled={(_ref, is_blocked) => setSelected((prev) => prev ? { ...prev, is_blocked } : prev)}
                setSaving={setSaving}
              />
            </div>
          </div>
        </div>

        {/* История платежей */}
        <div className="mt-5">
          <AdminPaymentHistory refNumber={selected.ref_number} />
        </div>

        {/* Чеки по займу */}
        <div className="mt-5">
          <AdminReceiptHistory refNumber={selected.ref_number} loanAmount={selected.amount} />
        </div>
      </main>
    </div>
  );
};

export default AdminRequestDetail;