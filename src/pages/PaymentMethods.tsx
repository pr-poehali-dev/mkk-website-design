import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useMaintenance } from '@/lib/maintenanceContext';

const HERO_IMG = 'https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/files/9f0e7a2b-03ec-4a7f-a33a-840b8a8482eb.jpg';
const INSTANT_IMG = 'https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/files/8a82cfa3-2030-49ad-8529-b59fa37dff22.jpg';
const CARD_IMG = 'https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/files/115372c3-a04e-43cb-a70d-0fe7697611a6.jpg';
const REQUISITES_IMG = 'https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/files/ef4fb6e5-0536-424a-a437-88dd4a0d8e12.jpg';

const PaymentMethods = () => {
  const { companyName } = useMaintenance();
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
          <span className="text-primary font-medium">Как погасить заём</span>
        </nav>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-sky-50 to-primary/10 px-6 py-8 sm:px-10 sm:py-10">
          <div className="relative flex items-center justify-between gap-6">
            <div className="max-w-md">
              <h1 className="font-display text-3xl font-bold text-primary sm:text-4xl">Как погасить заём</h1>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Мы стремимся сделать погашение займа максимально удобным, предлагая простые и быстрые способы оплаты
              </p>
            </div>
            <img src={HERO_IMG} alt="Кошелёк с монетами" className="hidden h-32 w-32 shrink-0 object-contain sm:block sm:h-40 sm:w-40" />
          </div>
        </div>

        {/* Способы оплаты */}
        <h2 className="mt-10 font-display text-2xl font-bold text-primary">Три способа погашения займа</h2>

        <div className="mt-6 space-y-5">
          {/* Моментальное погашение */}
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:justify-between">
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold text-primary">Моментальное погашение</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Погасите задолженность без входа в личный кабинет. Нужны только телефон и дата рождения — логин и пароль не потребуются.
              </p>
              <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/login">Оплатить сейчас</Link>
              </Button>
            </div>
            <img src={INSTANT_IMG} alt="Мгновенная оплата" className="h-24 w-24 shrink-0 object-contain sm:h-28 sm:w-28" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Банковская карта */}
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center sm:items-start sm:text-left">
              <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-primary">Банковская карта</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Зайдите в личный кабинет, выберите «Погасить заём», введите сумму и оплатите картой — после зачисления средств заём будет погашен.
                  </p>
                </div>
                <img src={CARD_IMG} alt="Банковские карты" className="h-20 w-20 shrink-0 object-contain" />
              </div>
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
                <Link to="/cabinet">Перейти в ЛК</Link>
              </Button>
            </div>

            {/* Перевод по реквизитам */}
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center sm:items-start sm:text-left">
              <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-primary">Перевод по реквизитам</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Оплатите через банковское приложение вашего банка или посетите банковское отделение.
                  </p>
                </div>
                <img src={REQUISITES_IMG} alt="Реквизиты для перевода" className="h-20 w-20 shrink-0 object-contain" />
              </div>
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
                <Link to="/appeal">Открыть реквизиты</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <Icon name="ShieldCheck" size={20} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-sm text-muted-foreground">
            Если у вас возникли трудности с погашением — свяжитесь с нами заранее, мы предложим удобный вариант: пролонгацию или реструктуризацию долга.
          </p>
        </div>
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

export default PaymentMethods;