import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { type UserSession } from '@/lib/api';

interface Props {
  selected: UserSession;
  docUrls: string[];
  docUploading: boolean;
  onDocUpload: (files: FileList | null) => void;
  onDocRemove: (url: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  pwdSaving: boolean;
  pwdMsg: { ok: boolean; text: string } | null;
  setPwdMsg: (v: { ok: boolean; text: string } | null) => void;
  onSetPassword: () => void;
}

const AdminEditDocumentsPassword = ({
  selected,
  docUrls,
  docUploading,
  onDocUpload,
  onDocRemove,
  newPassword,
  setNewPassword,
  pwdSaving,
  pwdMsg,
  setPwdMsg,
  onSetPassword,
}: Props) => {
  return (
    <>
      {/* Документы — загрузка администратором */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Документы заявки</p>
        {docUrls.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {docUrls.map((url, i) => (
              <div key={url} className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-accent hover:underline text-xs truncate">
                  <Icon name="FileImage" size={13} /> Документ {i + 1}
                </a>
                <button onClick={() => onDocRemove(url)} className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors">
                  <Icon name="X" size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors ${docUploading ? 'pointer-events-none opacity-50' : ''}`}>
          {docUploading
            ? <><Icon name="Loader2" size={16} className="animate-spin" /> Загрузка...</>
            : <><Icon name="Upload" size={16} /> Добавить документы</>}
          <input type="file" multiple accept="image/*,application/pdf" className="hidden"
            onChange={e => onDocUpload(e.target.files)} />
        </label>
      </div>

      {/* Пароль клиента */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Пароль клиента</p>
        {selected.password_plain && (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <span className="text-xs text-muted-foreground">Текущий:</span>
            <span className="font-mono text-sm font-semibold text-primary">{selected.password_plain}</span>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setPwdMsg(null); }}
            className="flex-1"
          />
          <Button size="sm" variant="outline" disabled={pwdSaving || !newPassword} onClick={onSetPassword}>
            {pwdSaving
              ? <Icon name="Loader2" size={14} className="animate-spin" />
              : <Icon name="KeyRound" size={14} />}
            <span className="ml-1.5">Изменить</span>
          </Button>
        </div>
        {pwdMsg && (
          <p className={`text-xs ${pwdMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{pwdMsg.text}</p>
        )}
      </div>
    </>
  );
};

export default AdminEditDocumentsPassword;
