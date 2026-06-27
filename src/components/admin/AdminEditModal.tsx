import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { apiUpdateRequest, type UserSession } from '@/lib/api';
import { STATUS_META, type StatusKey } from '@/lib/loanStore';
import { buildContractHtml } from './contractHtml';

const BANKS = [
  { name: 'Сбербанк', icon: '🟢' },
  { name: 'Тинькофф', icon: '🟡' },
  { name: 'ВТБ', icon: '🔵' },
  { name: 'Альфа-Банк', icon: '🔴' },
  { name: 'Газпромбанк', icon: '🔷' },
  { name: 'Россельхозбанк', icon: '🟩' },
  { name: 'Почта Банк', icon: '📮' },
  { name: 'Совкомбанк', icon: '🟠' },
  { name: 'Открытие', icon: '🌐' },
  { name: 'Другой банк', icon: '🏦' },
];

const fmt = (n: number) => n.toLocaleString('ru-RU');

export type EditForm = {
  status: string;
  amount: string;
  days: string;
  operator_comment: string;
  payment_bank: string;
};

interface Props {
  selected: UserSession | null;
  editForm: EditForm;
  setEditForm: (form: EditForm) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  onClose: () => void;
  onSaved: (updated: Partial<UserSession> & { ref_number: string }) => void;
  onBlockToggled: (ref_number: string, is_blocked: boolean) => void;
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
}: Props) => {
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
      });
      onSaved({
        ref_number: selected.ref_number,
        status: editForm.status,
        amount: parseInt(editForm.amount),
        days: parseInt(editForm.days),
        operator_comment: editForm.operator_comment,
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
    const getHtml = () => buildContractHtml(selected, amt, dys, contractCode, returnDate);
    return { amt, dys, overpay, total, contractCode, returnDate, getHtml };
  };

  const contract = getContractInfo();

  return (
    <Dialog open={!!selected} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-xl text-primary">
            Заявка {selected?.ref_number}
          </DialogTitle>
        </DialogHeader>

        {selected && (
          <div className="space-y-5 overflow-y-auto flex-1 pr-1">

            {/* Данные клиента */}
            <div className="rounded-xl bg-secondary p-4 text-sm space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Данные клиента</p>
              {[
                { label: 'ФИО', value: selected.full_name },
                { label: 'Телефон', value: selected.phone },
                { label: 'Дата рождения', value: selected.birth_date },
                { label: 'Паспорт', value: selected.passport ? `${selected.passport}${selected.passport_by ? ` · ${selected.passport_by}` : ''}` : undefined },
                { label: 'Адрес проживания', value: selected.address_residence },
                { label: 'Адрес регистрации', value: selected.address_registration },
                { label: 'Место работы', value: selected.work_place },
                { label: 'Рабочий телефон', value: selected.work_phone },
                { label: 'Дата заявки', value: selected.created_at?.slice(0, 10) },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className="flex justify-between gap-4 border-b border-border pb-1.5 last:border-0 last:pb-0">
                  <span className="text-muted-foreground shrink-0">{f.label}</span>
                  <span className="font-medium text-primary text-right">{f.value}</span>
                </div>
              ))}
              {selected.income_doc_url && (
                <a href={selected.income_doc_url} target="_blank" rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 text-accent hover:underline">
                  <Icon name="FileImage" size={14} /> Фото документа
                </a>
              )}
            </div>

            {/* Статус */}
            <div className="space-y-1.5">
              <Label>Статус заявки</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_META) as StatusKey[]).map((k) => (
                    <SelectItem key={k} value={k}>{STATUS_META[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Сумма и срок */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-amount">Сумма займа (₽)</Label>
                <Input id="edit-amount" type="number" min={1000} max={500000}
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-days">Срок (дней)</Label>
                <Input id="edit-days" type="number" min={1} max={365}
                  value={editForm.days}
                  onChange={(e) => setEditForm({ ...editForm, days: e.target.value })} />
              </div>
            </div>

            {/* Расчёт займа */}
            {contract && (
              <div className="rounded-xl bg-accent/5 border border-accent/20 p-4 text-sm space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">Расчёт займа</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Сумма займа</span>
                  <span className="font-medium">{fmt(contract.amt)} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Срок</span>
                  <span className="font-medium">{contract.dys} дн.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ставка</span>
                  <span className="font-medium">0.8% / день</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Переплата</span>
                  <span className="font-medium">{fmt(contract.overpay)} ₽</span>
                </div>
                <div className="flex justify-between border-t border-accent/20 pt-2">
                  <span className="font-semibold text-primary">К возврату</span>
                  <span className="font-bold text-primary text-base">{fmt(contract.total)} ₽</span>
                </div>
              </div>
            )}

            {/* Договор займа */}
            {contract && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Договор займа</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name="FileText" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{contract.contractCode}</p>
                    <p className="text-xs text-muted-foreground">К возврату {fmt(contract.total)} ₽ · до {contract.returnDate}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5"
                    onClick={() => {
                      const blob = new Blob([contract.getHtml()], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Договор_${contract.contractCode}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>
                    <Icon name="Download" size={14} /> Скачать
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5"
                    onClick={() => {
                      const blob = new Blob([contract.getHtml()], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    }}>
                    <Icon name="Eye" size={14} /> Просмотреть
                  </Button>
                </div>
              </div>
            )}

            {/* Способ получения */}
            <div className="space-y-2">
              <Label>Способ получения займа</Label>
              {editForm.payment_bank ? (
                <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Icon name="Smartphone" size={16} className="text-accent" />
                    {BANKS.find(b => b.name === editForm.payment_bank)?.icon} {editForm.payment_bank} · СБП
                  </div>
                  <button onClick={() => setEditForm({ ...editForm, payment_bank: '' })}
                    className="text-xs text-muted-foreground hover:text-red-500">Сбросить</button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Клиент ещё не выбрал банк</p>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {BANKS.map((bank) => (
                  <button key={bank.name}
                    onClick={() => setEditForm({ ...editForm, payment_bank: bank.name })}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${editForm.payment_bank === bank.name ? 'border-accent bg-accent/10 text-primary' : 'border-border bg-card text-primary hover:bg-secondary'}`}>
                    <span>{bank.icon}</span>
                    <span>{bank.name}</span>
                    {editForm.payment_bank === bank.name && <Icon name="Check" size={12} className="ml-auto text-accent" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Комментарий оператора */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-comment">Комментарий оператора</Label>
              <Textarea id="edit-comment" rows={3}
                placeholder="Будет виден клиенту в личном кабинете..."
                value={editForm.operator_comment}
                onChange={(e) => setEditForm({ ...editForm, operator_comment: e.target.value })} />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                {saving
                  ? <span className="flex items-center gap-2"><Icon name="Loader2" size={16} className="animate-spin" /> Сохранение...</span>
                  : <span className="flex items-center gap-2"><Icon name="Save" size={16} /> Сохранить</span>
                }
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Отмена
              </Button>
            </div>

            {/* Блокировка кабинета */}
            <div className={`rounded-xl border p-4 ${selected.is_blocked ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {selected.is_blocked ? 'Кабинет заблокирован' : 'Кабинет активен'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selected.is_blocked ? 'Клиент не может войти в личный кабинет' : 'Клиент имеет доступ к личному кабинету'}
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    const newBlocked = !selected.is_blocked;
                    try {
                      await apiUpdateRequest({ ref_number: selected.ref_number, is_blocked: newBlocked });
                      onBlockToggled(selected.ref_number, newBlocked);
                    } catch (_e) {
                      // ignore
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className={selected.is_blocked ? 'border-green-400 text-green-700 hover:bg-green-100' : 'border-red-400 text-red-600 hover:bg-red-100'}>
                  <Icon name={selected.is_blocked ? 'LockOpen' : 'Lock'} size={14} className="mr-1.5" />
                  {selected.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                </Button>
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditModal;
