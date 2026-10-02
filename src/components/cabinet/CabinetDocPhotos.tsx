import Icon from '@/components/ui/icon';
import type { UserSession } from '@/lib/api';

type PhotoField = 'passport_photo_url' | 'registration_photo_url' | 'income_doc_url' | 'selfie_photo_url' | 'card_photo_url' | 'snils_photo_url';
type StatusField = 'passport_photo_status' | 'registration_photo_status' | 'income_doc_status' | 'selfie_photo_status' | 'card_photo_status' | 'snils_photo_status';

const DOCS: { field: PhotoField; statusField: StatusField; label: string; hint: string; icon: string; uploadable: boolean }[] = [
  { field: 'passport_photo_url', statusField: 'passport_photo_status', label: 'Фото паспорта', hint: 'Разворот с фотографией', icon: 'BookUser', uploadable: true },
  { field: 'registration_photo_url', statusField: 'registration_photo_status', label: 'Фото регистрации', hint: 'Страница с пропиской', icon: 'Home', uploadable: true },
  { field: 'selfie_photo_url', statusField: 'selfie_photo_status', label: 'Фото с кодом', hint: 'Селфи с кодом на бумаге', icon: 'ScanFace', uploadable: false },
  { field: 'card_photo_url', statusField: 'card_photo_status', label: 'Фото банковской карты', hint: 'Лицевая сторона карты', icon: 'CreditCard', uploadable: true },
  { field: 'snils_photo_url', statusField: 'snils_photo_status', label: 'Фото СНИЛС', hint: 'СНИЛС полностью', icon: 'IdCard', uploadable: true },
  { field: 'income_doc_url', statusField: 'income_doc_status', label: 'Справка о доходах', hint: 'С места работы', icon: 'FileText', uploadable: true },
];

interface Props {
  user: UserSession;
  docUploading: string | null;
  docSaved: string | null;
  onUpload: (file: File, field: PhotoField) => void;
}

const CabinetDocPhotos = ({ user, docUploading, docSaved, onUpload }: Props) => {
  const items = DOCS.filter(({ field, uploadable }) => uploadable || user[field]);
  const uploadedCount = items.filter(({ field }) => user[field]).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Фото документов</p>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {uploadedCount} из {items.length}
        </span>
      </div>
      <div className="space-y-3">
        {items.map(({ field, statusField, label, hint, icon, uploadable }) => {
          const url = user[field];
          const docStatus = user[statusField];
          const isLoading = docUploading === field;
          const isSaved = docSaved === field;
          const isApproved = !!url && docStatus === 'approved';
          const isRejected = docStatus === 'rejected';
          const isPending = !!url && !isApproved && !isRejected;
          const canReplace = uploadable;

          const tone = isApproved
            ? { ring: 'border-green-300', badge: 'bg-green-100 text-green-700', iconBox: 'bg-green-100 text-green-600', text: 'Принято', badgeIcon: 'BadgeCheck' }
            : isRejected
              ? { ring: 'border-red-300', badge: 'bg-red-100 text-red-600', iconBox: 'bg-red-100 text-red-500', text: uploadable ? 'Отклонено — загрузите снова' : 'Отклонено', badgeIcon: 'XCircle' }
              : isPending
                ? { ring: 'border-orange-300', badge: 'bg-orange-100 text-orange-600', iconBox: 'bg-orange-100 text-orange-500', text: 'На проверке', badgeIcon: 'Clock' }
                : { ring: 'border-border', badge: '', iconBox: 'bg-primary/10 text-primary', text: '', badgeIcon: '' };

          return (
            <div key={field} className={`overflow-hidden rounded-2xl border bg-card shadow-sm ${tone.ring}`}>
              <div className="flex items-center gap-3 p-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.iconBox}`}>
                  <Icon name={icon} size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary">{label}</p>
                  <p className="text-xs text-muted-foreground">{url ? 'Файл загружен' : hint}</p>
                </div>
                {tone.text && (
                  <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${tone.badge}`}>
                    <Icon name={tone.badgeIcon} size={12} /> {isRejected ? 'Отклонено' : tone.text}
                  </span>
                )}
              </div>

              {isRejected && uploadable && (
                <p className="px-3 pb-2 text-xs font-medium text-red-500">Загрузите новый файл</p>
              )}

              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="group relative mx-3 mb-3 block overflow-hidden rounded-xl border border-border bg-secondary/60">
                  <img src={url} alt={label} className="max-h-44 w-full object-contain" />
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <Icon name="Maximize2" size={11} /> Открыть
                  </span>
                </a>
              )}

              {canReplace && (
                <label className={`flex cursor-pointer items-center justify-center gap-2 border-t border-border px-3 py-2.5 text-xs font-medium transition-colors ${isLoading ? 'pointer-events-none bg-secondary text-muted-foreground' : 'text-accent hover:bg-accent/5'}`}>
                  {isLoading
                    ? <><Icon name="Loader2" size={14} className="animate-spin" /> Загрузка...</>
                    : isSaved
                      ? <><Icon name="Check" size={14} className="text-green-600" /> <span className="text-green-600">Отправлено на проверку</span></>
                      : <><Icon name="Upload" size={14} /> {url ? 'Заменить файл' : 'Загрузить'}</>}
                  <input type="file" accept="image/*,application/pdf" className="hidden"
                    disabled={isLoading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f, field); e.target.value = ''; }} />
                </label>
              )}

            </div>
          );
        })}

        {user.doc_urls && user.doc_urls.length > 0 && (
          <div className="pt-1">
            <p className="mb-1.5 text-xs text-muted-foreground">Документы от оператора:</p>
            {user.doc_urls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                className="mb-1 flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-accent hover:underline">
                <Icon name="FileImage" size={13} /> Документ {i + 1}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CabinetDocPhotos;
