import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { apiSubmitSupportRequest } from '@/lib/api';
import { useSupportModal } from '@/lib/supportModalContext';
import { formatPhone } from '@/lib/phone';

const SupportModal = () => {
  const { isOpen, closeModal, prefill } = useSupportModal();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(prefill.name || '');
      setPhone(prefill.phone || '');
      setEmail(prefill.email || '');
    }
  }, [isOpen, prefill]);

  const reset = () => {
    setName(''); setPhone(''); setEmail(''); setMessage(''); setError(''); setSent(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeModal();
      setTimeout(reset, 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) {
      setError('Заполните имя, телефон и сообщение');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiSubmitSupportRequest({ name, phone, email: email || undefined, message });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        {sent ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Icon name="CheckCircle2" size={30} className="text-green-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-primary">Ваш запрос принят</h2>
            <p className="mt-2 text-sm text-muted-foreground">Ожидайте ответа службы поддержки{email ? ' на указанную почту' : ''}.</p>
            <Button className="mt-5 w-full" onClick={() => handleOpenChange(false)}>Закрыть</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display text-xl text-primary">
                <Icon name="MessageCircleQuestion" size={20} className="text-accent" /> Задать вопрос
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Опишите ваш вопрос — мы ответим на почту или свяжемся по телефону.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="support-name">Имя *</Label>
                <Input id="support-name" placeholder="Иван Иванов" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-phone">Телефон *</Label>
                <Input id="support-phone" type="tel" placeholder="+7 (___) ___-__-__" value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  onFocus={() => { if (!phone) setPhone('+7 '); }} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-email">Электронная почта</Label>
                <Input id="support-email" type="email" placeholder="example@mail.ru" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-message">Сообщение *</Label>
                <Textarea id="support-message" placeholder="Опишите ваш вопрос" className="min-h-[100px]"
                  value={message} onChange={(e) => setMessage(e.target.value)} required />
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-red-500">
                  <Icon name="AlertCircle" size={14} className="shrink-0" /> {error}
                </p>
              )}
              <Button type="submit" size="lg" disabled={loading} className="h-11 w-full">
                {loading
                  ? <span className="flex items-center gap-2"><Icon name="Loader2" size={16} className="animate-spin" /> Отправляем...</span>
                  : <span className="flex items-center gap-2">Отправить <Icon name="Send" size={16} /></span>}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;