import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { apiGenerateIdentifyLink, type UserSession, type IdentifyLink } from '@/lib/api';

interface Props {
  target: UserSession | null;
  onClose: () => void;
}

const AdminIdentifyLinkModal = ({ target, onClose }: Props) => {
  const [link, setLink] = useState<IdentifyLink | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const identifyUrl = link ? `${window.location.origin}/verify/${link.token}` : null;

  const generate = async (ref: string) => {
    setGenerating(true);
    setError(null);
    setCopied(false);
    try {
      const res = await apiGenerateIdentifyLink(ref);
      setLink(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось создать ссылку');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (target) {
      setLink(null);
      setError(null);
      generate(target.ref_number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.ref_number]);

  const handleCopy = () => {
    if (!identifyUrl) return;
    navigator.clipboard.writeText(identifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">Ссылка для идентификации</DialogTitle>
        </DialogHeader>

        {target && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {target.full_name} · Заявка {target.ref_number}
            </p>
            <p className="text-xs text-muted-foreground">
              Одноразовая ссылка для загрузки фото паспорта, селфи с паспортом и согласий. Действует 40 минут, повторно заполнить нельзя.
            </p>

            {generating && (
              <div className="flex items-center justify-center py-6">
                <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {error && !generating && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {link && identifyUrl && !generating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
                  <span className="flex-1 truncate text-xs text-primary">{identifyUrl}</span>
                  <button onClick={handleCopy} className="shrink-0 text-muted-foreground hover:text-accent transition-colors">
                    <Icon name={copied ? 'Check' : 'Copy'} size={14} className={copied ? 'text-green-600' : ''} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Действует до {new Date(link.expires_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" disabled={generating} onClick={() => target && generate(target.ref_number)} className="flex-1">
                {generating ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="RefreshCw" size={13} />}
                <span className="ml-1.5">Сгенерировать новую</span>
              </Button>
              <Button size="sm" onClick={onClose} className="flex-1">Готово</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminIdentifyLinkModal;
