import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import SiteFooter from '@/components/SiteFooter';
import { apiGetSiteSettings } from '@/lib/api';
import { parseSiteDocuments, type SiteDocument } from '@/lib/siteDocuments';

const Documents = () => {
  const [docs, setDocs] = useState<SiteDocument[] | null>(null);

  useEffect(() => {
    apiGetSiteSettings()
      .then((s) => setDocs(parseSiteDocuments(s.site_documents)))
      .catch(() => setDocs(parseSiteDocuments(undefined)));
  }, []);

  const groups: { name: string; items: SiteDocument[] }[] = [];
  (docs || []).filter((d) => d.visible && d.title.trim()).forEach((d) => {
    const name = d.group.trim();
    let g = groups.find((x) => x.name === name);
    if (!g) { g = { name, items: [] }; groups.push(g); }
    g.items.push(d);
  });

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Logo />
          <Button asChild variant="outline" size="sm" className="rounded-full border-border text-primary hover:bg-secondary">
            <Link to="/"><Icon name="ArrowLeft" size={16} className="mr-1" /> На главную</Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl px-4 py-8">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
          <Icon name="ChevronRight" size={14} />
          <span className="text-primary font-medium">Документы</span>
        </nav>

        <div className="rounded-3xl bg-gradient-to-br from-sky-100 via-sky-50 to-primary/10 px-6 py-8 sm:px-10">
          <h1 className="font-display text-3xl font-bold text-primary sm:text-4xl">Документы</h1>
        </div>

        {docs === null ? (
          <div className="flex justify-center py-16">
            <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.name} className="mt-8">
              {g.name && <h2 className="font-display text-2xl font-bold text-primary">{g.name}</h2>}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((d) => {
                  const inner = (
                    <>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <Icon name="FileText" size={22} />
                      </span>
                      <span className="text-sm font-medium text-primary">{d.title}</span>
                    </>
                  );
                  const cls = 'flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-shadow';
                  return d.url ? (
                    <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className={`${cls} hover:shadow-md`}>{inner}</a>
                  ) : (
                    <div key={d.id} className={`${cls} opacity-70`}>{inner}</div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default Documents;
