import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';

const RATE = 0.008; // 0.8% в день

const Index = () => {
  const [amount, setAmount] = useState(15000);
  const [days, setDays] = useState(14);

  const { total, overpay } = useMemo(() => {
    const op = Math.round(amount * RATE * days);
    return { total: amount + op, overpay: op };
  }, [amount, days]);

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const advantages = [
    { icon: 'Clock', title: 'Решение за 5 минут', text: 'Автоматическая проверка анкеты без звонков и визитов.' },
    { icon: 'ShieldCheck', title: 'Защита данных', text: 'Шифрование уровня банков. Документы под надёжной защитой.' },
    { icon: 'Percent', title: 'Прозрачные условия', text: 'Никаких скрытых комиссий. Вы видите итоговую сумму сразу.' },
    { icon: 'CreditCard', title: 'Деньги на карту', text: 'Перевод на карту любого банка России круглосуточно.' },
  ];

  const steps = [
    { n: '01', title: 'Рассчитайте займ', text: 'Выберите сумму и срок на калькуляторе.' },
    { n: '02', title: 'Заполните анкету', text: 'Укажите данные и загрузите фото паспорта.' },
    { n: '03', title: 'Получите деньги', text: 'Средства поступят на вашу карту за минуты.' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon name="Landmark" size={20} />
            </div>
            <div className="leading-none">
              <p className="font-display text-lg font-bold tracking-wide text-primary">ЗАЙМЫ ПЛЮС</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">МКК · с 2014 года</p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#calc" className="text-muted-foreground transition-colors hover:text-primary">Калькулятор</a>
            <a href="#how" className="text-muted-foreground transition-colors hover:text-primary">Как это работает</a>
            <a href="#why" className="text-muted-foreground transition-colors hover:text-primary">Преимущества</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-secondary">
              <Link to="/login"><Icon name="User" size={16} className="mr-1" /> Войти</Link>
            </Button>

          </div>
        </div>
      </header>

      {/* Hero + Calculator */}
      <section id="calc" className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 hero-grid opacity-60" />
        <div className="container relative grid items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          {/* Left */}
          <div className="animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-accent" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Одобрение 96% заявок · работаем 24/7
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Деньги на карту
              <span className="block text-accent">за 5 минут</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-primary-foreground/75 sm:text-lg">
              Микрокредитная компания «Займы Плюс». Прозрачные условия, мгновенное решение и перевод на карту любого банка.
            </p>
            <div className="mt-7 flex flex-wrap gap-6">
              {[['от 1 000 ₽', 'минимум'], ['до 100 000 ₽', 'максимум'], ['0,8% в день', 'ставка']].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-2xl font-bold text-accent">{v}</p>
                  <p className="text-xs uppercase tracking-wider text-primary-foreground/60">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Calculator card */}
          <div className="animate-fade-up rounded-2xl border border-primary-foreground/10 bg-background p-6 text-foreground shadow-2xl sm:p-8" style={{ animationDelay: '0.15s' }}>
            <div className="mb-6 flex items-center justify-center gap-4">
              <div className="relative" style={{ perspective: '600px' }}>
                <div className="animate-spin-3d flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-amber-500 shadow-lg">
                  <span className="font-display text-2xl font-bold text-primary">₽</span>
                </div>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-primary">Калькулятор займа</h2>
                <p className="text-sm text-muted-foreground">Двигайте ползунки</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted-foreground">Сумма займа</span>
                <span className="font-display text-2xl font-bold text-primary">{fmt(amount)} ₽</span>
              </div>
              <Slider value={[amount]} min={1000} max={100000} step={1000} onValueChange={(v) => setAmount(v[0])} />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>1 000 ₽</span><span>100 000 ₽</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted-foreground">Срок</span>
                <span className="font-display text-2xl font-bold text-primary">{days} дн.</span>
              </div>
              <Slider value={[days]} min={7} max={30} step={1} onValueChange={(v) => setDays(v[0])} />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>7 дней</span><span>30 дней</span>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-secondary p-4">
              <div className="flex justify-between border-b border-border pb-2 text-sm">
                <span className="text-muted-foreground">Переплата</span>
                <span className="font-semibold text-foreground">{fmt(overpay)} ₽</span>
              </div>
              <div className="flex items-baseline justify-between pt-3">
                <span className="text-sm text-muted-foreground">К возврату</span>
                <span className="font-display text-3xl font-bold text-accent">{fmt(total)} ₽</span>
              </div>
            </div>

            <Button asChild size="lg" className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90">
              <Link to="/anketa">
                Получить {fmt(amount)} ₽
                <Icon name="ArrowRight" size={18} className="ml-1" />
              </Link>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Решение приходит за 5 минут</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Просто и быстро</p>
          <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">Как получить займ</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-xl">
              <span className="font-display text-5xl font-bold text-secondary">{s.n}</span>
              <h3 className="mt-2 font-display text-xl font-semibold text-primary">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Advantages */}
      <section id="why" className="bg-secondary/50">
        <div className="container px-4 py-16 md:py-24">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Почему мы</p>
            <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">Надёжность в каждой детали</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a) => (
              <div key={a.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon name={a.icon} size={22} />
                </div>
                <h3 className="font-display text-lg font-semibold text-primary">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 hero-grid opacity-40" />
        <div className="container relative px-4 py-16 text-center md:py-20">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Готовы оформить займ?</h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/75">Заполните анкету за 2 минуты — решение придёт мгновенно.</p>
          <Button asChild size="lg" className="mt-7 h-12 bg-accent px-8 text-base font-bold text-accent-foreground hover:bg-accent/90">
            <Link to="/anketa">Заполнить анкету <Icon name="ArrowRight" size={18} className="ml-1" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground/70">
        <div className="container border-t border-primary-foreground/10 px-4 py-10 text-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <p className="font-display text-lg font-bold tracking-wide text-primary-foreground">ЗАЙМЫ ПЛЮС</p>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/40">Служба поддержки</p>
              <a href="tel:84999610736" className="flex items-center gap-2 text-primary-foreground hover:text-accent transition-colors font-medium text-base">
                <Icon name="Phone" size={16} className="text-accent" /> 8 499 961-07-36
              </a>
              <a href="mailto:zaymy.plyus@bk.ru" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Icon name="Mail" size={16} className="text-accent" /> zaymy.plyus@bk.ru
              </a>
            </div>
            <p className="text-primary-foreground/60">© 2014–2026 ООО МКК «Займы Плюс».<br className="hidden md:block" /> Все права защищены.</p>
          </div>
          <p className="mt-6 text-xs text-primary-foreground/40">
            Деятельность регулируется ФЗ №151. Расчёты на калькуляторе носят ознакомительный характер.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;