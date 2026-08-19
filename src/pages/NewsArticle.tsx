import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { apiGetNewsItem, type NewsItem } from '@/lib/api';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const NewsArticle = () => {
  const { id } = useParams();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiGetNewsItem(id)
      .then(setItem)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/30 ring-1 ring-white/10">
              <Icon name="Landmark" size={19} />
            </div>
            <div className="leading-none">
              <p className="font-display text-lg font-bold tracking-wide text-primary">ЗАЙМЫ ПЛЮС</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Займы онлайн 24/7</p>
            </div>
          </Link>
          <Button asChild variant="outline" size="sm" className="rounded-full border-border text-primary hover:bg-secondary">
            <Link to="/"><Icon name="ArrowLeft" size={16} className="mr-1" /> На главную</Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : notFound || !item ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            <Icon name="FileQuestion" size={32} className="mx-auto mb-3 opacity-50" />
            Новость не найдена
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link to="/news">Ко всем новостям</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
              <Icon name="ChevronRight" size={14} />
              <Link to="/news" className="hover:text-primary transition-colors">Новости и акции</Link>
              <Icon name="ChevronRight" size={14} />
              <span className="text-primary font-medium truncate">{item.title}</span>
            </nav>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 via-sky-300 to-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
              <div className="absolute inset-0 hero-grid opacity-20" />
              <div className="relative">
                <h1 className="font-display text-2xl font-bold leading-tight sm:text-4xl">{item.title}</h1>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-primary-foreground/90">
                  <Icon name="Calendar" size={14} /> {fmtDate(item.published_at)}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="mb-6 w-full rounded-xl object-cover" />
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-base">
                {item.content}
              </div>
            </div>

            <div className="mt-6">
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/news"><Icon name="ArrowLeft" size={16} className="mr-1.5" /> Назад</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default NewsArticle;
