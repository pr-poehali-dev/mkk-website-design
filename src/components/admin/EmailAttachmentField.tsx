import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { apiUploadFile } from '@/lib/api';

interface Props {
  url?: string;
  name?: string;
  onChange: (url: string, name: string) => void;
  onRemove: () => void;
}

const EmailAttachmentField = ({ url, name, onChange, onRemove }: Props) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploadedUrl = await apiUploadFile(file, 'email-attachments');
      onChange(uploadedUrl, file.name);
    } finally {
      setUploading(false);
    }
  };

  if (url) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Icon name="Paperclip" size={12} className="text-accent" />
        <span className="truncate text-muted-foreground">{name || 'Файл прикреплён'}</span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-red-500">
          <Icon name="X" size={12} />
        </button>
      </div>
    );
  }

  return (
    <label className={`flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
      {uploading ? <Icon name="Loader2" size={12} className="animate-spin" /> : <Icon name="Paperclip" size={12} />}
      Прикрепить файл к письму
      <input type="file" className="hidden" disabled={uploading}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
    </label>
  );
};

export default EmailAttachmentField;
