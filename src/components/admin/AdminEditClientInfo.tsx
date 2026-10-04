import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { type UserSession, type ScoringResult } from '@/lib/api';

const fmt = (n: number) => n.toLocaleString('ru-RU');

interface Props {
  selected: UserSession;
  scoringEnabled: boolean;
  scoringRunning: boolean;
  scoringResult: ScoringResult | null;
  onRunScoring: () => void;
  docStatuses: Record<string, string>;
  docStatusSaving: string | null;
  onDocStatus: (field: string, newStatus: string) => void;
  onSaveIds: (snils: string, inn: string) => Promise<void>;
}

const AdminEditClientInfo = ({
  selected,
  scoringEnabled,
  scoringRunning,
  scoringResult,
  onRunScoring,
  docStatuses,
  docStatusSaving,
  onDocStatus,
  onSaveIds,
}: Props) => {
  const [editingIds, setEditingIds] = useState(false);
  const [snilsVal, setSnilsVal] = useState('');
  const [innVal, setInnVal] = useState('');
  const [idsSaving, setIdsSaving] = useState(false);
  const [idsError, setIdsError] = useState('');

  const formatSnils = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 11);
    const base = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join('-');
    return d.length > 9 ? `${base} ${d.slice(9)}` : base;
  };

  const passportDigits = (selected.passport || '').replace(/\D/g, '');

  const startEditIds = () => {
    setSnilsVal(selected.snils ? formatSnils(selected.snils) : '');
    setInnVal(selected.inn || '');
    setIdsError('');
    setEditingIds(true);
  };

  const saveIds = async () => {
    const s = snilsVal.replace(/\D/g, '');
    if (s && s.length !== 11) { setIdsError('СНИЛС должен содержать 11 цифр'); return; }
    if (innVal && innVal.length !== 10 && innVal.length !== 12) { setIdsError('ИНН должен содержать 10 или 12 цифр'); return; }
    setIdsSaving(true);
    setIdsError('');
    try {
      await onSaveIds(s, innVal);
      setEditingIds(false);
    } catch (e: unknown) {
      setIdsError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setIdsSaving(false);
    }
  };

  return (
    <>
      {/* Данные клиента */}
      <div className="rounded-xl bg-secondary p-4 text-sm space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Данные клиента</p>
        {[
          { label: 'ФИО', value: selected.full_name },
          { label: 'Телефон', value: selected.phone },
          { label: 'Дата рождения', value: selected.birth_date },
          { label: 'Серия паспорта', value: passportDigits.slice(0, 4) || undefined },
          { label: 'Номер паспорта', value: passportDigits.slice(4) || undefined },
          { label: 'Кем выдан', value: selected.passport_by || undefined },
          { label: 'СНИЛС', value: selected.snils ? formatSnils(selected.snils) : undefined },
          { label: 'ИНН', value: selected.inn || undefined },
          { label: 'Адрес проживания', value: selected.address_residence },
          { label: 'Адрес регистрации', value: selected.address_registration },
          { label: 'Место работы', value: selected.work_place },
          { label: 'Рабочий телефон', value: selected.work_phone },
          { label: 'Email', value: selected.email },
          { label: 'Открытые займы/кредиты', value: selected.existing_loans_count != null ? String(selected.existing_loans_count) : undefined },
          { label: 'Сумма текущего долга', value: selected.existing_debt_amount != null ? `${fmt(selected.existing_debt_amount)} ₽` : undefined },
          { label: 'Дата заявки', value: selected.created_at?.slice(0, 10) },
        ].filter(f => f.value).map(f => (
          <div key={f.label} className="flex justify-between gap-4 border-b border-border pb-1.5 last:border-0 last:pb-0">
            <span className="text-muted-foreground shrink-0">{f.label}</span>
            <span className="font-medium text-primary text-right">{f.value}</span>
          </div>
        ))}
        {!selected.snils && !selected.inn && !editingIds && (
          <p className="text-xs text-muted-foreground">СНИЛС и ИНН не указаны</p>
        )}
        {editingIds ? (
          <div className="space-y-2 rounded-lg border border-border bg-card p-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">СНИЛС</label>
              <input value={snilsVal} onChange={(e) => setSnilsVal(formatSnils(e.target.value))} inputMode="numeric" placeholder="000-000-000 00"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">ИНН</label>
              <input value={innVal} onChange={(e) => setInnVal(e.target.value.replace(/\D/g, '').slice(0, 12))} inputMode="numeric" placeholder="12 цифр"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
            </div>
            {idsError && <p className="text-xs text-red-500">{idsError}</p>}
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" disabled={idsSaving} onClick={saveIds}>
                {idsSaving ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Сохранить'}
              </Button>
              <Button size="sm" variant="outline" className="flex-1" disabled={idsSaving} onClick={() => setEditingIds(false)}>Отмена</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="mt-1 w-full gap-1.5" onClick={startEditIds}>
            <Icon name="Pencil" size={13} /> Изменить СНИЛС и ИНН
          </Button>
        )}
      </div>

      {/* Автоскоринг */}
      {scoringEnabled && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-700">
            <Icon name="Bot" size={14} /> Автоскоринг роботом
          </p>
          <p className="text-xs text-blue-700/80">
            Проверит сумму текущего долга клиента и автоматически одобрит или отклонит заявку.
          </p>
          <Button size="sm" disabled={scoringRunning} onClick={onRunScoring}
            className="w-full bg-blue-600 text-white hover:bg-blue-700">
            {scoringRunning
              ? <span className="flex items-center gap-1.5"><Icon name="Loader2" size={14} className="animate-spin" /> Проверяем...</span>
              : <span className="flex items-center gap-1.5"><Icon name="ScanSearch" size={14} /> Запустить скоринг</span>}
          </Button>
          {scoringResult && (
            <div className={`rounded-lg border p-3 text-xs ${scoringResult.approved ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
              <p className="flex items-center gap-1.5 font-semibold">
                <Icon name={scoringResult.approved ? 'CheckCircle2' : 'XCircle'} size={14} />
                {scoringResult.approved ? 'Одобрено роботом' : 'Отклонено роботом'}
              </p>
              {scoringResult.reason && <p className="mt-1">{scoringResult.reason}</p>}
            </div>
          )}
        </div>
      )}

      {/* Документы клиента */}
      {(selected.passport_photo_url || selected.registration_photo_url || selected.income_doc_url || selected.selfie_photo_url || selected.card_photo_url || selected.snils_photo_url) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Документы клиента</p>
          {([
            { urlKey: 'passport_photo_url' as const, statusKey: 'passport_photo_status', label: 'Фото паспорта' },
            { urlKey: 'registration_photo_url' as const, statusKey: 'registration_photo_status', label: 'Фото регистрации' },
            { urlKey: 'selfie_photo_url' as const, statusKey: 'selfie_photo_status', label: 'Фото с кодом' },
            { urlKey: 'card_photo_url' as const, statusKey: 'card_photo_status', label: 'Фото банковской карты' },
            { urlKey: 'snils_photo_url' as const, statusKey: 'snils_photo_status', label: 'Фото СНИЛС' },
            { urlKey: 'income_doc_url' as const, statusKey: 'income_doc_status', label: 'Справка о доходах' },
          ]).filter(d => selected[d.urlKey]).map(({ urlKey, statusKey, label }) => {
            const st = docStatuses[statusKey] || 'pending';
            const isSaving = docStatusSaving === statusKey;
            return (
              <div key={urlKey} className={`rounded-lg border p-3 space-y-2 ${st === 'approved' ? 'border-green-300 bg-green-50' : st === 'rejected' ? 'border-red-300 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Icon name="FileImage" size={13} /> {label}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st === 'approved' ? 'bg-green-100 text-green-700' : st === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    {st === 'approved' ? '✓ Принято' : st === 'rejected' ? '✗ Отклонено' : '⏳ На проверке'}
                  </span>
                </div>
                <a href={selected[urlKey]!} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-border bg-black/5">
                  <img src={selected[urlKey]!} alt={label} className="max-h-48 w-full object-contain" />
                </a>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"
                    className={`flex-1 h-7 text-xs ${st === 'approved' ? 'border-green-500 bg-green-100 text-green-700' : 'border-green-400 text-green-700 hover:bg-green-50'}`}
                    disabled={isSaving}
                    onClick={() => onDocStatus(statusKey, st === 'approved' ? 'pending' : 'approved')}>
                    {isSaving ? <Icon name="Loader2" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />}
                    <span className="ml-1">{st === 'approved' ? 'Принято ✓' : 'Принять'}</span>
                  </Button>
                  <Button size="sm" variant="outline"
                    className={`flex-1 h-7 text-xs ${st === 'rejected' ? 'border-red-500 bg-red-100 text-red-600' : 'border-red-400 text-red-600 hover:bg-red-50'}`}
                    disabled={isSaving}
                    onClick={() => onDocStatus(statusKey, st === 'rejected' ? 'pending' : 'rejected')}>
                    {isSaving ? <Icon name="Loader2" size={12} className="animate-spin" /> : <Icon name="X" size={12} />}
                    <span className="ml-1">{st === 'rejected' ? 'Отклонено ✗' : 'Отклонить'}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default AdminEditClientInfo;