import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { apiSaveSiteSettings, apiUploadFile } from '@/lib/api';
import type { CabinetArticle } from '@/lib/cabinetArticles';

interface Props {
  initial: CabinetArticle[];
}

const AdminArticlesSettings = ({ initial }: Props) => {
  const [items, setItems] = useState<CabinetArticle[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<CabinetArticle>) =>
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const move = (idx: number, dir: -1 | 1) =>
    setItems((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const add = () =>
    setItems((prev) => [...prev, { id: `a-${Date.now()}`, title: '', image_url: '', text: '', link_url: '', link_text: '' }]);

  const upload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const url = await apiUploadFile(file, 'articles');
      update(id, { image_url: url });
    } finally {
      setUploadingId(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const clean = items.filter((a) => a.title.trim());
      await apiSaveSiteSettings({ cabinet_articles: JSON.stringify(clean) });
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
          <Icon name="Newspaper" size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary">Статьи в личном кабинете</p>
          <p className="mb-3 text-sm text-muted-foreground">
            Карточки «Статьи для вас». По нажатию клиент видит окно с картинкой и текстом. Статьи без названия не сохраняются.
          </p>

          <div className="space-y-3">
            {items.map((a, idx) => (
              <div key={a.id} className="rounded-xl border border-border bg-secondary/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Статья {idx + 1}</span>
                  <div className="flex gap-1">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Выше"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card disabled:opacity-30"><Icon name="ArrowUp" size={14} /></button>
                    <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} aria-label="Ниже"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card disabled:opacity-30"><Icon name="ArrowDown" size={14} /></button>
                    <button onClick={() => setItems((p) => p.filter((x) => x.id !== a.id))} aria-label="Удалить"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"><Icon name="Trash2" size={14} /></button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="sm:w-40 sm:shrink-0">
                    <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-card">
                      {a.image_url
                        ? <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Icon name="Image" size={24} /></div>}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <label className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-medium ${uploadingId === a.id ? 'pointer-events-none opacity-60' : 'text-primary hover:bg-secondary'}`}>
                        {uploadingId === a.id ? <Icon name="Loader2" size={12} className="animate-spin" /> : <Icon name="Upload" size={12} />}
                        {a.image_url ? 'Заменить' : 'Картинка'}
                        <input type="file" accept="image/*" className="hidden" disabled={uploadingId === a.id}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(a.id, f); e.target.value = ''; }} />
                      </label>
                      {a.image_url && (
                        <button onClick={() => update(a.id, { image_url: '' })} aria-label="Убрать картинку"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-red-500"><Icon name="X" size={13} /></button>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <Input placeholder="Название статьи" value={a.title} onChange={(e) => update(a.id, { title: e.target.value })} />
                    <Textarea placeholder="Текст статьи (отображается в окне)" className="min-h-[90px]" value={a.text} onChange={(e) => update(a.id, { text: e.target.value })} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input placeholder="Ссылка кнопки (необязательно)" value={a.link_url} onChange={(e) => update(a.id, { link_url: e.target.value })} />
                      <Input placeholder="Текст кнопки" value={a.link_text} onChange={(e) => update(a.id, { link_text: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={add}><Icon name="Plus" size={14} className="mr-1.5" /> Добавить статью</Button>
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

export default AdminArticlesSettings;
