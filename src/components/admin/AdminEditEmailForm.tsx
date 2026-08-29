import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { type UserSession, type EmailTemplate } from '@/lib/api';

interface Props {
  selected: UserSession;
  templatesLoading: boolean;
  templates: EmailTemplate[];
  selectedTemplateId: string;
  onApplyTemplate: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
  emailSubject: string;
  setEmailSubject: (v: string) => void;
  emailBody: string;
  setEmailBody: (v: string) => void;
  setEmailMsg: (v: { ok: boolean; text: string } | null) => void;
  emailFileUploading: boolean;
  onEmailFileUpload: (file: File) => void;
  saveTemplateMode: boolean;
  setSaveTemplateMode: (v: boolean) => void;
  newTemplateName: string;
  setNewTemplateName: (v: string) => void;
  templateSaving: boolean;
  onSaveTemplate: () => void;
  emailSending: boolean;
  onSendEmail: () => void;
  emailMsg: { ok: boolean; text: string } | null;
}

const AdminEditEmailForm = ({
  selected,
  templatesLoading,
  templates,
  selectedTemplateId,
  onApplyTemplate,
  onDeleteTemplate,
  emailSubject,
  setEmailSubject,
  emailBody,
  setEmailBody,
  setEmailMsg,
  emailFileUploading,
  onEmailFileUpload,
  saveTemplateMode,
  setSaveTemplateMode,
  newTemplateName,
  setNewTemplateName,
  templateSaving,
  onSaveTemplate,
  emailSending,
  onSendEmail,
  emailMsg,
}: Props) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Написать клиенту</p>
      {!selected.email ? (
        <p className="text-xs text-muted-foreground">У клиента не указан email — отправка недоступна.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Письмо будет отправлено на {selected.email}</p>

          {!templatesLoading && templates.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedTemplateId} onValueChange={onApplyTemplate}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Выбрать шаблон..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateId && (
                <Button size="sm" variant="outline" className="shrink-0 text-red-500 hover:bg-red-50"
                  onClick={() => onDeleteTemplate(selectedTemplateId)}>
                  <Icon name="Trash2" size={14} />
                </Button>
              )}
            </div>
          )}

          <Input
            placeholder="Тема письма"
            value={emailSubject}
            onChange={(e) => { setEmailSubject(e.target.value); setEmailMsg(null); }}
          />
          <RichTextEditor
            value={emailBody}
            onChange={(html) => { setEmailBody(html); setEmailMsg(null); }}
            placeholder="Текст письма..."
          />
          <label className={`flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors ${emailFileUploading ? 'pointer-events-none text-muted-foreground' : 'text-primary hover:bg-secondary'}`}>
            {emailFileUploading
              ? <><Icon name="Loader2" size={13} className="animate-spin" /> Загрузка...</>
              : <><Icon name="Paperclip" size={13} /> Прикрепить файл</>}
            <input type="file" className="hidden" disabled={emailFileUploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onEmailFileUpload(f); e.target.value = ''; }} />
          </label>

          {saveTemplateMode ? (
            <div className="flex gap-2">
              <Input
                placeholder="Название шаблона"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" variant="outline" disabled={templateSaving || !newTemplateName} onClick={onSaveTemplate}>
                {templateSaving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setSaveTemplateMode(false); setNewTemplateName(''); }}>
                <Icon name="X" size={14} />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" disabled={!emailSubject || !emailBody}
              onClick={() => setSaveTemplateMode(true)} className="flex items-center gap-1.5">
              <Icon name="BookmarkPlus" size={14} /> Сохранить как шаблон
            </Button>
          )}

          <Button size="sm" disabled={emailSending || !emailSubject || !emailBody} onClick={onSendEmail} className="flex items-center gap-1.5">
            {emailSending ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
            Отправить письмо
          </Button>
          {emailMsg && (
            <p className={`text-xs ${emailMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{emailMsg.text}</p>
          )}
        </>
      )}
    </div>
  );
};

export default AdminEditEmailForm;
