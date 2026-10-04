import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { apiSaveSiteSettings } from '@/lib/api';
import type { SiteDocument } from '@/lib/siteDocuments';

interface Props {
  initial: SiteDocument[];
}

const AdminDocumentsSettings = ({ initial }: Props) => {
  const [items, setItems] = useState<SiteDocument[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (id: string, patch: Partial<SiteDocument>) =>
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const move = (idx: number, dir: -1 | 1) =>
    setItems((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const add = () =>
    setItems((prev) => [...prev, { id: `d-${Date.now()}`, group: prev[prev.length - 1]?.group || 'Документы компании', title: '', url: '', visible: true }]);

  const save = async () => {
    setSaving(true);
    try {
      const clean = items.filter((d) => d.title.trim());
      await apiSaveSiteSettings({ site_documents: JSON.stringify(clean) });
      setItems(clean);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <Icon name="FileText" size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary">Документы на сайте</p>
          <p className="mb-3 text-sm text-muted-foreground">
            Страница «Документы» в меню сайта. Документы с одинаковым разделом показываются вместе. Без названия не сохраняются.
          </p>

          <div className="space-y-3">
            {items.map((d, idx) => (
              <div key={d.id} className={`rounded-xl border border-border bg-secondary/40 p-3 transition-opacity ${d.visible ? '' : 'opacity-60'}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Документ {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <label className="mr-2 flex cursor-pointer items-center gap-2 text-xs font-medium text-primary">
                      <Switch checked={d.visible} onCheckedChange={(v) => update(d.id, { visible: v })} />
                      {d.visible ? 'Показывается' : 'Скрыт'}
                    </label>
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Выше"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card disabled:opacity-30"><Icon name="ArrowUp" size={14} /></button>
                    <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} aria-label="Ниже"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card disabled:opacity-30"><Icon name="ArrowDown" size={14} /></button>
                    <button onClick={() => setItems((p) => p.filter((x) => x.id !== d.id))} aria-label="Удалить"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"><Icon name="Trash2" size={14} /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input placeholder="Раздел (например, Прочее)" value={d.group} onChange={(e) => update(d.id, { group: e.target.value })} />
                  <Input placeholder="Название документа" value={d.title} onChange={(e) => update(d.id, { title: e.target.value })} />
                  <Input placeholder="Ссылка на документ (https://...)" value={d.url} onChange={(e) => update(d.id, { url: e.target.value })} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={add}><Icon name="Plus" size={14} className="mr-1.5" /> Добавить документ</Button>
            <Button size="sm" disabled={saving} onClick={save}>
              {saving ? <Icon name="Loader2" size={14} className="mr-1.5 animate-spin" /> : saved ? <Icon name="Check" size={14} className="mr-1.5" /> : <Icon name="Save" size={14} className="mr-1.5" />}
              {saved ? 'Сохранено' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDocumentsSettings;
