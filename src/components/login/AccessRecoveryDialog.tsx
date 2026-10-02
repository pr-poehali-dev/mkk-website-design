import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import CameraCapture from '@/components/anketa/CameraCapture';
import { apiSubmitAccessRequest, apiUploadFile } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatPassport = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  return d.length > 4 ? `${d.slice(0, 4)} ${d.slice(4)}` : d;
};

const formatSnils = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  let r = d.slice(0, 3);
  if (d.length > 3) r += '-' + d.slice(3, 6);
  if (d.length > 6) r += '-' + d.slice(6, 9);
  if (d.length > 9) r += ' ' + d.slice(9, 11);
  return r;
};

const AccessRecoveryDialog = ({ open, onOpenChange }: Props) => {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [password, setPassword] = useState('');
  const [passport, setPassport] = useState('');
  const [snils, setSnils] = useState('');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSelfie = (file: File) => {
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passport.replace(/\D/g, '').length !== 10) { setError('Введите серию и номер паспорта полностью (10 цифр)'); return; }
    if (snils.replace(/\D/g, '').length !== 11) { setError('Введите СНИЛС полностью (11 цифр)'); return; }
    if (password.length < 4) { setError('Пароль должен быть не менее 4 символов'); return; }
    if (!selfieFile) { setError('Сделайте селфи с паспортом'); return; }
    setLoading(true);
    setError('');
    try {
      const selfie_url = await apiUploadFile(selfieFile);
      await apiSubmitAccessRequest({
        full_name: [lastName, firstName, middleName].map((s) => s.trim()).filter(Boolean).join(' '),
        new_password: password,
        passport,
        snils,
        selfie_url,
      });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v && done) {
      setDone(false);
      setLastName(''); setFirstName(''); setMiddleName(''); setPassword('');
      setPassport(''); setSnils(''); setSelfieFile(null); setSelfiePreview(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">Сменить пароль</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Icon name="MailCheck" size={28} className="text-green-600" />
            </div>
            <p className="font-display text-lg font-bold text-primary">Заявка отправлена</p>
            <p className="text-sm text-muted-foreground">
              Мы проверим данные. На вашу почту придёт уведомление о том, что номер телефона будет изменён.
            </p>
            <Button onClick={() => handleOpenChange(false)} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Понятно
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ar-last">Фамилия</Label>
              <Input id="ar-last" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-first">Имя</Label>
              <Input id="ar-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-middle">Отчество</Label>
              <Input id="ar-middle" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-pass">Новый пароль</Label>
              <Input id="ar-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-passport">Серия и номер паспорта</Label>
              <Input id="ar-passport" inputMode="numeric" placeholder="0000 000000" value={passport}
                onChange={(e) => setPassport(formatPassport(e.target.value))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-snils">СНИЛС</Label>
              <Input id="ar-snils" inputMode="numeric" placeholder="000-000-000 00" value={snils}
                onChange={(e) => setSnils(formatSnils(e.target.value))} required />
            </div>

            <CameraCapture
              label="Селфи с паспортом у лица"
              hint="Держите открытый паспорт рядом с лицом"
              preview={selfiePreview}
              onCapture={handleSelfie}
              aspect="square"
            />

            {error && (
              <p className="flex items-center gap-1.5 text-sm text-red-600">
                <Icon name="AlertCircle" size={15} /> {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={loading}
              className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
              {loading
                ? <span className="flex items-center gap-2"><Icon name="Loader2" size={18} className="animate-spin" /> Отправка...</span>
                : 'Отправить заявку'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AccessRecoveryDialog;
