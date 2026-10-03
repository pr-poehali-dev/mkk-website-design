import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMaintenance } from '@/lib/maintenanceContext';
import type { CabinetArticle } from '@/lib/cabinetArticles';

const GRADIENTS = [
  'from-primary to-accent',
  'from-amber-400 to-yellow-300',
  'from-emerald-500 to-teal-400',
  'from-sky-500 to-indigo-500',
];

const CabinetArticles = () => {
  const { cabinetArticles } = useMaintenance();
  const [open, setOpen] = useState<CabinetArticle | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  if (cabinetArticles.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-primary">Статьи для вас</h2>
        {cabinetArticles.length > 2 && (
          <div className="flex gap-2">
            <button onClick={() => scrollBy(-1)} aria-label="Назад"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-primary transition-colors hover:bg-accent/40">
              <Icon name="ArrowLeft" size={16} />
            </button>
            <button onClick={() => scrollBy(1)} aria-label="Вперёд"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-primary transition-colors hover:bg-accent/40">
              <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}
      </div>

      <div ref={scroller} className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cabinetArticles.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setOpen(a)}
            className="group w-[calc(50%-6px)] shrink-0 snap-start text-left"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
              {a.image_url ? (
                <img src={a.image_url} alt={a.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} p-4`}>
                  <p className="text-center font-display text-base font-bold leading-tight text-white drop-shadow sm:text-lg">{a.title}</p>
                </div>
              )}
              <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Icon name="ArrowUpRight" size={15} />
              </span>
            </div>
            {a.image_url && <p className="mt-2 line-clamp-2 text-sm font-semibold text-primary">{a.title}</p>}
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => { if (!v) setOpen(null); }}>
        <DialogContent className="max-h-[90vh] max-w-md gap-0 overflow-y-auto rounded-3xl border-0 p-0 [&>button]:z-10 [&>button]:flex [&>button]:h-9 [&>button]:w-9 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-black/50 [&>button]:text-white [&>button]:opacity-100">
          {open && (
            <>
              {open.image_url && <img src={open.image_url} alt={open.title} className="w-full object-cover" />}
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-left font-display text-xl leading-tight text-primary">{open.title}</DialogTitle>
                </DialogHeader>
                {open.text && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{open.text}</p>}
                {open.link_url && (
                  <a href={open.link_url} target="_blank" rel="noopener noreferrer"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                    <Icon name="ExternalLink" size={16} /> {open.link_text || 'Подробнее'}
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CabinetArticles;
