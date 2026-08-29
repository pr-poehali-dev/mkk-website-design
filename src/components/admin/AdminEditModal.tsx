import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  apiUpdateRequest, apiAdminSetPassword, apiUploadFile, apiAdminSetDocStatus, apiSendEmail,
  apiGetEmailTemplates, apiSaveEmailTemplates, apiGetSiteSettings, apiRunScoring,
  type UserSession, type EmailTemplate, type ScoringResult,
} from '@/lib/api';
import { useMaintenance } from '@/lib/maintenanceContext';
import { buildContractHtml } from './contractHtml';
import { useState, useEffect } from 'react';
import AdminEditClientInfo from './AdminEditClientInfo';
import AdminEditDocumentsPassword from './AdminEditDocumentsPassword';
import AdminEditEmailForm from './AdminEditEmailForm';
import AdminEditLoanForm from './AdminEditLoanForm';
import { type EditForm } from './adminEditTypes';

export type { EditForm };

interface Props {
  selected: UserSession | null;
  editForm: EditForm;
  setEditForm: (form: EditForm) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  onClose: () => void;
  onSaved: (updated: Partial<UserSession> & { ref_number: string }) => void;
  onBlockToggled: (ref_number: string, is_blocked: boolean) => void;
  onDocStatusChanged?: (ref_number: string, patch: Partial<UserSession>) => void;
}

const AdminEditModal = ({
  selected,
  editForm,
  setEditForm,
  saving,
  setSaving,
  onClose,
  onSaved,
  onBlockToggled,
  onDocStatusChanged,
}: Props) => {
  const { companyName, companyInn, companyOgrn } = useMaintenance();
  const [newPassword, setNewPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [docUrls, setDocUrls] = useState<string[]>(selected?.doc_urls || []);
  const [docUploading, setDocUploading] = useState(false);
  const [docStatusSaving, setDocStatusSaving] = useState<string | null>(null);
  const [docStatuses, setDocStatuses] = useState<Record<string, string>>({
    passport_photo_status: selected?.passport_photo_status || 'pending',
    registration_photo_status: selected?.registration_photo_status || 'pending',
    income_doc_status: selected?.income_doc_status || 'pending',
    selfie_photo_status: selected?.selfie_photo_status || 'pending',
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

  useEffect(() => {
    apiGetSiteSettings().then((s) => setScoringEnabled(s.scoring_enabled === 'true')).catch(() => {});
  }, []);

  useEffect(() => {
    setScoringResult(null);
  }, [selected?.ref_number]);

  useEffect(() => {
    if (selected) {
      setDocStatuses({
        passport_photo_status: selected.passport_photo_status || 'pending',
        registration_photo_status: selected.registration_photo_status || 'pending',
        income_doc_status: selected.income_doc_status || 'pending',
        selfie_photo_status: selected.selfie_photo_status || 'pending',
      });
    }
  }, [selected?.passport_photo_status, selected?.registration_photo_status, selected?.income_doc_status, selected?.selfie_photo_status]);

  useEffect(() => {
    setEmailSubject('');
    setEmailBody('');
    setEmailMsg(null);
    setSelectedTemplateId('');
    setSaveTemplateMode(false);
    setNewTemplateName('');
  }, [selected?.ref_number]);

  useEffect(() => {
    if (selected?.email) {
      setTemplatesLoading(true);
      apiGetEmailTemplates().then(setTemplates).finally(() => setTemplatesLoading(false));
    }
  }, [selected?.ref_number]);

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
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        name: newTemplateName,
        subject: emailSubject,
        body: emailBody,
      };
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
      setDocStatuses(prev => ({ ...prev, [field]: newStatus }));
      const patch: Partial<UserSession> = { [field]: newStatus };
      if (newStatus === 'rejected') {
        const urlField = field.replace('_status', '_url') as keyof UserSession;
        patch[urlField] = null as never;
      }
      onDocStatusChanged?.(selected.ref_number, patch);
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
      const patch: Partial<UserSession> = { status: result.status };
      onDocStatusChanged?.(selected.ref_number, patch);
      setEditForm({ ...editForm, status: result.status });
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
      const urls = await Promise.all(Array.from(files).map(f => apiUploadFile(f)));
      const newUrls = [...docUrls, ...urls];
      setDocUrls(newUrls);
      await apiUpdateRequest({ ref_number: selected.ref_number, doc_urls: newUrls });
    } finally {
      setDocUploading(false);
    }
  };

  const handleDocRemove = async (url: string) => {
    if (!selected) return;
    const newUrls = docUrls.filter(u => u !== url);
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
        payment_bank: editForm.payment_bank || null,
        insurance_enabled: editForm.insurance_enabled,
      });
      onSaved({
        ref_number: selected.ref_number,
        status: editForm.status,
        amount: parseInt(editForm.amount),
        days: parseInt(editForm.days),
        operator_comment: editForm.operator_comment,
        insurance_enabled: editForm.insurance_enabled,
      });
      onClose();
    } catch (_e) {
      // ignore
    } finally {
      setSaving(false);
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

  return (
    <Dialog open={!!selected} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col rounded-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-xl text-primary">
            Заявка {selected?.ref_number}
          </DialogTitle>
        </DialogHeader>

        {selected && (
          <div className="space-y-5 overflow-y-auto flex-1 pr-1">

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

            <AdminEditLoanForm
              selected={selected}
              editForm={editForm}
              setEditForm={setEditForm}
              contract={contract}
              saving={saving}
              onSave={handleSave}
              onClose={onClose}
              onBlockToggled={onBlockToggled}
              setSaving={setSaving}
            />

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditModal;
