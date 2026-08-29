import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { apiGetNews, type NewsItem } from '@/lib/api';
import { useMaintenance } from '@/lib/maintenanceContext';

const PAGE_SIZE = 5;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const News = () => {
  const { companyName } = useMaintenance();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    apiGetNews().then(setItems).finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Header */}
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
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
          <Icon name="ChevronRight" size={14} />
          <span className="text-primary font-medium">Новости и акции</span>
        </nav>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 via-sky-300 to-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
          <div className="absolute inset-0 hero-grid opacity-20" />
          <div className="relative">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Новости и акции</h1>
            <p className="mt-2 max-w-md text-sm text-primary-foreground/90 sm:text-base">
              Будьте в курсе новостей компании и узнавайте первыми о новых акциях
            </p>
          </div>
        </div>

        {/* Список новостей */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            <Icon name="Newspaper" size={32} className="mx-auto mb-3 opacity-50" />
            Новостей пока нет
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {pageItems.map((n) => (
              <div key={n.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                {n.image_url && (
                  <img src={n.image_url} alt={n.title} className="mb-4 h-40 w-full rounded-xl object-cover" />
                )}
                <Link to={`/news/${n.id}`}>
                  <h2 className="font-display text-lg font-bold text-primary hover:text-accent transition-colors sm:text-xl">{n.title}</h2>
                </Link>
                {n.excerpt && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{n.excerpt}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon name="Calendar" size={14} /> {fmtDate(n.published_at)}
                  </span>
                  <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to={`/news/${n.id}`}>Читать</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="ChevronLeft" size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-primary hover:bg-secondary'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="ChevronRight" size={16} />
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="rounded-t-2xl bg-primary text-primary-foreground/70">
        <div className="container border-t border-primary-foreground/10 px-4 py-10 text-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <p className="font-display text-lg font-bold tracking-wide text-primary-foreground text-center">ЧАСТНЫЕ ЗАЙМЫ ПЛЮС</p>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/40">Служба поддержки</p>
              <a href="tel:84999610736" className="flex items-center gap-2 text-primary-foreground hover:text-accent transition-colors font-medium text-base">
                <Icon name="Phone" size={16} className="text-accent" /> 8 499 961-07-36
              </a>
              <a href="mailto:zaymy.plyus@bk.ru" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Icon name="Mail" size={16} className="text-accent" /> zaymy.plyus@bk.ru
              </a>
            </div>
            <p className="text-primary-foreground/60 text-center">© 2026 {companyName}. Все права защищены.</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/appeal"
              className="text-xs text-primary-foreground/50 hover:text-accent underline underline-offset-2 transition-colors">
              Задать вопрос
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default News;