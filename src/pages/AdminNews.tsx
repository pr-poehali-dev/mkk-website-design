import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import {
  apiGetAllNewsAdmin, apiCreateNews, apiUpdateNews, apiDeleteNews, apiUploadFile, type NewsItem,
} from '@/lib/api';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

interface FormState {
  id: number | null;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  published_at: string;
  is_published: boolean;
}

const EMPTY_FORM: FormState = {
  id: null, title: '', excerpt: '', content: '', image_url: '',
  published_at: new Date().toISOString().slice(0, 10), is_published: true,
};

const AdminNews = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await apiGetAllNewsAdmin();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchAll();
  }, [authed]);

  if (!authed) {
    return <AdminLoginScreen onAuth={() => setAuthed(true)} />;
  }

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (n: NewsItem) => {
    setForm({
      id: n.id,
      title: n.title,
      excerpt: n.excerpt || '',
      content: n.content,
      image_url: n.image_url || '',
      published_at: n.published_at,
      is_published: n.is_published,
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await apiUploadFile(file, 'news');
      setForm((f) => ({ ...f, image_url: url }));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      if (form.id) {
        await apiUpdateNews({
          id: form.id, title: form.title, excerpt: form.excerpt, content: form.content,
          image_url: form.image_url, published_at: form.published_at, is_published: form.is_published,
        });
      } else {
        await apiCreateNews({
          title: form.title, excerpt: form.excerpt, content: form.content,
          image_url: form.image_url, published_at: form.published_at, is_published: form.is_published,
        });
      }
      setModalOpen(false);
      await fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить новость?')) return;
    setDeletingId(id);
    try {
      await apiDeleteNews(id);
      await fetchAll();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon name="Newspaper" size={20} className="text-accent" />
            <span className="font-display text-lg font-bold tracking-wide">НОВОСТИ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="ArrowLeft" size={16} /> К заявкам
            </Link>
            <button onClick={() => { sessionStorage.removeItem('zaimy_admin'); setAuthed(false); }}
              className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="LogOut" size={16} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-primary">Новости и акции</h1>
          <Button onClick={openCreate} className="flex items-center gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
            <Icon name="Plus" size={16} /> Добавить
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <Icon name="Newspaper" size={32} className="mx-auto mb-3 opacity-50" />
            Новостей пока нет
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {items.map((n) => (
              <div key={n.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4">
                {n.image_url ? (
                  <img src={n.image_url} alt={n.title} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon name="Image" size={22} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-primary">{n.title}</p>
                    {!n.is_published && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">Черновик</span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon name="Calendar" size={12} /> {fmtDate(n.published_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => openEdit(n)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary">
                    <Icon name="Pencil" size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    disabled={deletingId === n.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  >
                    {deletingId === n.id ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Trash2" size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">{form.id ? 'Редактировать новость' : 'Новая новость'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Изображение</Label>
              {form.image_url && (
                <img src={form.image_url} alt="" className="h-32 w-full rounded-xl object-cover" />
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground hover:bg-secondary">
                {uploading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Upload" size={16} />}
                {uploading ? 'Загрузка...' : 'Загрузить фото'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <Label>Заголовок</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Заголовок новости" />
            </div>

            <div className="space-y-1.5">
              <Label>Краткое описание</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Отображается в списке новостей" className="min-h-[70px]" />
            </div>

            <div className="space-y-1.5">
              <Label>Текст новости</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Полный текст новости" className="min-h-[160px]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Дата публикации</Label>
                <Input type="date" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Статус</Label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_published: !form.is_published })}
                  className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors ${form.is_published ? 'border-green-300 bg-green-50 text-green-700' : 'border-border bg-secondary text-muted-foreground'}`}
                >
                  <Icon name={form.is_published ? 'Eye' : 'EyeOff'} size={14} />
                  {form.is_published ? 'Опубликовано' : 'Черновик'}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
              <Button
                disabled={saving || !form.title.trim() || !form.content.trim()}
                onClick={handleSave}
                className="flex items-center gap-1.5"
              >
                {saving && <Icon name="Loader2" size={14} className="animate-spin" />} Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNews;
