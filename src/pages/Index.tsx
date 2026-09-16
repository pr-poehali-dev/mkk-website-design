import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import { useMaintenance } from '@/lib/maintenanceContext';
import SocialLinks from '@/components/SocialLinks';

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="group">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-secondary/50"
      >
        <span className="font-medium text-primary">{q}</span>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={18} className="shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</div>
      )}
    </div>
  );
};

const RATE = 0.008; // 0.8% в день

const Index = () => {
  const { maintenance, companyName, companyInn, companyOgrn, companyPhone, companyEmail } = useMaintenance();
  const [amount, setAmount] = useState(15000);
  const [days, setDays] = useState(14);
  const [modal, setModal] = useState<'privacy' | 'about' | null>(null);

  const { total, overpay } = useMemo(() => {
    const op = Math.round(amount * RATE * days);
    return { total: amount + op, overpay: op };
  }, [amount, days]);

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const [arrivalTime, setArrivalTime] = useState('');
  useEffect(() => {
    const update = () => {
      const d = new Date(Date.now() + 15 * 60 * 1000);
      setArrivalTime(d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  const advantages = [
    { icon: 'Clock', title: 'Решение за 5 минут', text: 'Автоматическая проверка анкеты без звонков и визитов.' },
    { icon: 'ShieldCheck', title: 'Защита данных', text: 'Шифрование уровня банков. Документы под надёжной защитой.' },
    { icon: 'Percent', title: 'Прозрачные условия', text: 'Никаких скрытых комиссий. Вы видите итоговую сумму сразу.' },
    { icon: 'CreditCard', title: 'Деньги на карту', text: 'Перевод на карту любого банка России круглосуточно.' },
  ];

  const faqs = [
    { q: 'Какова максимальная сумма займа?', a: 'Мы выдаём займы от 1 000 до 100 000 ₽. Первый займ — до 30 000 ₽, повторным клиентам доступна полная сумма.' },
    { q: 'Как быстро придут деньги?', a: 'Средства поступают на карту в течение 5–15 минут после одобрения. Переводы работают круглосуточно, включая праздники.' },
    { q: 'Какие документы нужны для займа?', a: 'Достаточно паспорта гражданина РФ. Справки о доходах, поручители и залог не требуются.' },
    { q: 'Какая процентная ставка?', a: 'Ставка составляет 0,8% в день. Итоговая сумма к возврату всегда отображается в калькуляторе до подачи заявки — никаких скрытых комиссий.' },
    { q: 'Можно ли погасить займ досрочно?', a: 'Да, досрочное погашение возможно в любой день. Проценты начисляются только за фактический срок пользования деньгами.' },
    { q: 'Что делать, если не могу вовремя оплатить?', a: 'Свяжитесь с нами заранее — оператор предложит удобный вариант: пролонгацию или реструктуризацию долга. Не ждите до последнего.' },
  ];

  const steps = [
    { n: '01', time: '~7 минут', title: 'Заполните короткую анкету', text: 'Укажите основные данные, чтобы мы смогли быстро обработать вашу заявку.' },
    { n: '02', time: '~2 минуты', title: 'Получите решение по заявке', text: 'Мы проверим информацию и сообщим результат в кратчайшие сроки.' },
    { n: '03', time: '~1 минута', title: 'Способ получения денег на ваш выбор', text: 'После одобрения выберите удобный способ получения, и деньги поступят максимально быстро.' },
  ];

  const plans = [
    {
      icon: 'Sparkles', name: 'Старт без переплаты', amount: 'до 30 000 ₽', term: 'до 31 дня',
      note: 'для новых клиентов', highlighted: true, badge: 'Отличный выбор 🔥',
    },
    {
      icon: 'ShoppingBag', name: 'На покупки', amount: 'до 50 000 ₽', term: 'до 30 дней',
      note: 'для проверенных клиентов', highlighted: false,
    },
    {
      icon: 'Wallet', name: 'До зарплаты', amount: 'до 100 000 ₽', term: 'до 30 дней',
      note: 'для постоянных клиентов', highlighted: false,
    },
  ];

  const reviews = [
    { name: 'Марина К.', city: 'Казань', rating: 5, text: 'Оформила займ за 10 минут, деньги пришли почти сразу. Никаких скрытых комиссий, всё как в калькуляторе.' },
    { name: 'Дмитрий С.', city: 'Новосибирск', rating: 5, text: 'Пользуюсь уже третий раз. Одобряют быстро, служба поддержки всегда на связи и всё объясняет понятно.' },
    { name: 'Елена В.', city: 'Краснодар', rating: 4, text: 'Понравилось, что можно погасить займ досрочно без переплат. Условия прозрачные, сюрпризов не было.' },
    { name: 'Игорь П.', city: 'Екатеринбург', rating: 5, text: 'Нужны были деньги срочно на ремонт машины — заявку одобрили за 5 минут, перевод пришёл на карту Сбербанка.' },
    { name: 'Анна Т.', city: 'Ростов-на-Дону', rating: 5, text: 'Первый раз брала микрозайм и переживала, но всё прошло гладко. Никто не звонил с угрозами, всё по договору.' },
    { name: 'Сергей М.', city: 'Самара', rating: 4, text: 'Удобное приложение и личный кабинет — видно все платежи и остаток долга. Рекомендую тем, кто ценит прозрачность.' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/30 ring-1 ring-white/10">
              <Icon name="Landmark" size={19} />
            </div>
            <div className="leading-none">
              <p className="font-display text-lg font-bold tracking-wide text-primary">ЗП </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Займы онлайн 24/7</p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#calc" className="text-muted-foreground transition-colors hover:text-primary">Калькулятор</a>
            <a href="#how" className="text-muted-foreground transition-colors hover:text-primary">Как это работает</a>
            <a href="#tariffs" className="text-muted-foreground transition-colors hover:text-primary">Тарифы</a>
            <a href="#why" className="text-muted-foreground transition-colors hover:text-primary">Преимущества</a>
            <a href="#faq" className="text-muted-foreground transition-colors hover:text-primary">FAQ</a>
            <Link to="/news" className="text-muted-foreground transition-colors hover:text-primary">Новости</Link>
            <Link to="/payment" className="text-muted-foreground transition-colors hover:text-primary">Способы оплаты</Link>
            <Link to="/appeal" className="text-muted-foreground transition-colors hover:text-primary">Задать вопрос</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90 sm:inline-flex">
              <a href="#calc"><Icon name="Zap" size={15} className="mr-1" /> Оформить займ</a>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full border-border text-primary hover:bg-secondary">
              <Link to="/login"><Icon name="User" size={16} className="mr-1" /> Войти</Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <button className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl border border-border text-primary hover:bg-secondary md:hidden">
                  <Icon name="Menu" size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 rounded-l-2xl bg-background">
                <div className="mt-8 flex flex-col gap-1">
                  <a href="#calc" className="rounded-xl px-4 py-3 text-base font-medium text-primary hover:bg-secondary">Калькулятор</a>
                  <a href="#how" className="rounded-xl px-4 py-3 text-base font-medium text-primary hover:bg-secondary">Как это работает</a>
                  <a href="#tariffs" className="rounded-xl px-4 py-3 text-base font-medium text-primary hover:bg-secondary">Тарифы</a>
                  <a href="#why" className="rounded-xl px-4 py-3 text-base font-medium text-primary hover:bg-secondary">Преимущества</a>
                  <a href="#faq" className="rounded-xl px-4 py-3 text-base font-medium text-primary hover:bg-secondary">FAQ</a>
                  <Link to="/news" className="rounded-xl px-4 py-3 text-base font-medium text-primary hover:bg-secondary">Новости</Link>
                  <Link to="/payment" className="rounded-xl px-4 py-3 text-base font-medium text-primary hover:bg-secondary">Способы оплаты</Link>
                  <Link to="/appeal" className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-base font-medium text-primary hover:bg-secondary">
                    <Icon name="MessageCircleQuestion" size={18} className="text-accent" /> Задать вопрос
                  </Link>
                  <Link to="/login" className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    <Icon name="User" size={16} /> Войти в кабинет
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero + Calculator */}
      <section id="calc" className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 hero-grid opacity-60" />
        <div className="container relative grid items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          {/* Left */}
          <div className="animate-fade-up relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-xs font-medium"><span className="animate-flame">🔥</span> Одобрение 96% заявок · работаем 24/7</div>
            <h1 className="font-display font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl text-3xl md:pr-28 lg:pr-36">
              Оформите заявку онлайн и получите{' '}
              <span className="inline-block rounded-full bg-accent px-4 py-1 text-primary">до 30 000 ₽</span>{' '}
              на любые цели
            </h1>
            <img
              src="/assets/hero-person-phone.png"
              alt="Человек с телефоном"
              className="pointer-events-none hidden md:absolute md:right-0 md:top-1/2 md:block md:h-56 md:w-auto md:-translate-y-1/2 md:object-contain lg:h-64"
            />
          </div>

          {/* Right — Calculator card */}
          <div className="animate-fade-up overflow-hidden rounded-2xl border border-primary-foreground/10 bg-background text-foreground shadow-2xl" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2.5 border-b border-border bg-secondary/60 px-6 py-3.5 sm:px-8">
              <Icon name="AlarmClock" size={18} className="shrink-0 text-accent" />
              <p className="text-sm font-medium text-primary">
                Деньги у вас уже в <span className="font-display font-bold text-accent">{arrivalTime}</span>
              </p>
            </div>

            <div className="p-6 sm:p-8">
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

            {maintenance ? (
              <Button size="lg" disabled className="h-12 w-full text-base font-bold cursor-not-allowed opacity-60">
                <Icon name="Construction" size={18} className="mr-2" />
                Временно недоступно
              </Button>
            ) : (
              <Button asChild size="lg" className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90">
                <Link to="/anketa">
                  Получить {fmt(amount)} ₽
                  <Icon name="ArrowRight" size={18} className="ml-1" />
                </Link>
              </Button>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {maintenance ? 'Приём заявок временно приостановлен' : 'Решение приходит за 5 минут'}
            </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container px-4 py-16 md:py-24">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
            <span className="relative inline-block">
              <span className="absolute inset-x-0 bottom-1 h-3 -rotate-1 rounded bg-accent/30" />
              <span className="relative">3 простых шага</span>
            </span>
            <br />
            для получения займа
          </h2>
        </div>
        <div className="space-y-5">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl bg-secondary/60 p-7 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground">{s.n}</span>
                <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">{s.time}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-primary sm:text-2xl">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tariffs */}
      <section id="tariffs" className="container px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Тарифы</p>
          <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
            Выберите тариф{' '}
            <span className="relative inline-block">
              <span className="absolute inset-x-0 bottom-1 h-3 -rotate-1 rounded bg-accent/30" />
              <span className="relative">под ваши цели</span>
            </span>
          </h2>
        </div>

        <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-4 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative w-[85%] shrink-0 snap-center rounded-3xl border bg-card p-6 sm:w-auto ${
                p.highlighted ? 'border-2 border-accent shadow-xl' : 'border-border'
              }`}
            >
              {p.badge && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold text-accent">
                  {p.badge}
                </span>
              )}
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon name={p.icon} size={22} />
                </div>
                <h3 className="font-display text-lg font-semibold text-primary">{p.name}</h3>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3.5">
                  <span className="text-sm text-muted-foreground">Сумма займа</span>
                  <span className="font-display text-lg font-bold text-primary">{p.amount}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3.5">
                  <span className="text-sm text-muted-foreground">Срок</span>
                  <span className="font-display text-lg font-bold text-primary">{p.term}</span>
                </div>
              </div>

              {maintenance ? (
                <Button disabled className="mt-6 h-12 w-full cursor-not-allowed rounded-full text-base font-bold opacity-60">
                  Временно недоступно
                </Button>
              ) : (
                <Button
                  asChild
                  className={`mt-6 h-12 w-full rounded-full text-base font-bold ${
                    p.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-primary hover:bg-secondary/80'
                  }`}
                >
                  <Link to="/anketa">Получить {p.highlighted ? 'бесплатно' : 'деньги'}</Link>
                </Button>
              )}
              <p className="mt-3 text-center text-xs text-muted-foreground">{p.note}</p>
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

      {/* Reviews */}
      <section id="reviews" className="container px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Отзывы</p>
          <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">Что говорят наши клиенты</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {r.name.split(' ').map((w) => w[0]).join('')}
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-primary">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.city}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon
                    key={i}
                    name="Star"
                    size={15}
                    className={i < r.rating ? 'fill-accent text-accent' : 'text-border'}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Часто спрашивают</p>
          <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">Вопросы и ответы</h2>
        </div>
        <div className="mx-auto max-w-2xl divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-4 mb-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-secondary to-secondary/40 md:mx-auto md:max-w-5xl">
        <div className="absolute inset-0 hero-grid opacity-40" />

        {/* Плавающие звёзды-декор */}
        <Icon name="Sparkle" size={56} className="animate-float-coin pointer-events-none absolute right-[10%] top-[6%] fill-primary text-primary opacity-80 md:right-[16%] md:top-[8%]" />
        <Icon name="Sparkle" size={40} className="animate-float-coin-2 pointer-events-none absolute bottom-[8%] left-[8%] fill-accent text-accent opacity-90 md:left-[12%]" />

        <div className="container relative grid gap-6 px-6 pb-0 pt-14 md:grid-cols-2 md:items-center md:gap-6 md:pb-10 md:pt-16">
          {/* Текст */}
          <div className="text-center md:text-left">
            <h2 className="font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
              Первый займ до 30 000 ₽<br />
              — <span className="relative inline-block">
                <span className="absolute inset-x-0 bottom-1 h-3 -rotate-1 rounded bg-accent/40" />
                <span className="relative">без переплаты</span>
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-muted-foreground md:mx-0">
              На важные покупки, срочные расходы и другие необходимые траты
            </p>
            {maintenance ? (
              <Button size="lg" disabled className="mt-7 h-14 w-full rounded-full px-8 text-base font-bold cursor-not-allowed opacity-60 md:w-auto">
                <Icon name="Construction" size={18} className="mr-2" />
                Временно недоступно
              </Button>
            ) : (
              <Button asChild size="lg" className="mt-7 h-14 w-full rounded-full bg-primary px-10 text-base font-bold text-primary-foreground hover:bg-primary/90 md:w-auto">
                <Link to="/anketa">Получить деньги</Link>
              </Button>
            )}
          </div>

          {/* Иллюстрация */}
          <div className="relative mx-auto mt-4 w-full max-w-[240px] pt-6 sm:max-w-xs md:max-w-sm md:pt-0">
            <img
              src="/assets/hero-person-savings.png"
              alt="Девушка с телефоном оформляет займ"
              className="pointer-events-none relative z-10 mx-auto h-auto w-full max-w-[260px] object-contain md:max-w-full"
            />

            <div className="absolute -right-2 top-0 z-20 w-[68%] rounded-2xl bg-card p-3 shadow-lg sm:-right-4">
              <div className="flex items-center gap-2 text-xs font-medium text-primary sm:text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Icon name="Check" size={12} />
                </span>
                Оплатить счета
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-primary sm:text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Icon name="Check" size={12} />
                </span>
                Купить продукты
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-primary sm:text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Icon name="Check" size={12} />
                </span>
                Заказать подарок
              </div>
            </div>

            <div className="absolute bottom-[6%] -left-2 z-20 flex items-center gap-2 rounded-2xl bg-card px-3 py-2.5 shadow-lg sm:-left-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Icon name="Sparkles" size={18} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Зачисление от <span className="font-semibold text-primary">ЗП</span></p>
                <p className="font-display text-base font-bold text-primary">+30 000 ₽</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="rounded-t-2xl bg-primary text-primary-foreground/70">
        <div className="container border-t border-primary-foreground/10 px-4 py-10 text-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <p className="font-display text-lg font-bold tracking-wide text-primary-foreground text-center">ЧАСТНЫЕ ЗАЙМЫ ПЛЮС</p>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/40">Служба поддержки</p>
              <a href={`tel:${companyPhone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-primary-foreground hover:text-accent transition-colors font-medium text-base">
                <Icon name="Phone" size={16} className="text-accent" /> {companyPhone}
              </a>
              <a href={`mailto:${companyEmail}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                <Icon name="Mail" size={16} className="text-accent" /> {companyEmail}
              </a>
              <SocialLinks className="mt-1" />
            </div>
            <p className="text-primary-foreground/60 text-center">© 2026 {companyName}. Все права защищены.</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => setModal('privacy')}
              className="text-xs text-primary-foreground/50 hover:text-accent underline underline-offset-2 transition-colors">
              Политика конфиденциальности
            </button>
            <span className="text-primary-foreground/20 text-xs">·</span>
            <button onClick={() => setModal('about')}
              className="text-xs text-primary-foreground/50 hover:text-accent underline underline-offset-2 transition-colors">
              О компании
            </button>
            <span className="text-primary-foreground/20 text-xs">·</span>
            <Link to="/news"
              className="text-xs text-primary-foreground/50 hover:text-accent underline underline-offset-2 transition-colors">
              Новости и акции
            </Link>
            <span className="text-primary-foreground/20 text-xs">·</span>
            <Link to="/payment"
              className="text-xs text-primary-foreground/50 hover:text-accent underline underline-offset-2 transition-colors">
              Способы оплаты
            </Link>
          </div>
          <p className="mt-4 text-xs text-primary-foreground/40 text-center">Деятельность регулируется ФЗ №190-ФЗ «О кредитной кооперации». Расчёты на калькуляторе носят ознакомительный характер. ИНН: {companyInn} · ОГРН: {companyOgrn}
Сайт не является МКК или МФО, наш сервис даёт вам лучшие условия по займу.</p>
          <p className="mt-3 text-xs text-primary-foreground/40 text-center">При использовании сайта применяются файлы cookie и иные технологии, позволяющие идентифицировать пользователя и анализировать особенности использования веб-ресурса. Cookie представляют собой текстовые файлы, сохраняемые на устройстве пользователя (ПК, смартфон, планшет) и содержащие сведения о действиях на сайте (в том числе о выборе языка, статусе авторизации и др.). Факт дальнейшего использования сайта свидетельствует о согласии пользователя с применением указанных технологий.</p>
          <p className="mt-3 text-xs text-primary-foreground/40 text-center">Оплатить заём можно банковской картой VISA, MasterCard или МИР. Все платежи проходят через защищённое соединение с использованием протокола безопасности транспортного уровня. Безопасность транзакций обеспечивает процессинговый центр Best2Pay, который соответствует международным стандартам безопасности индустрии платёжных карт. Реквизиты карты и персональные данные не передаются интернет-магазину: их обработка происходит на стороне Best2Pay и полностью защищена. Компания ООО «» не имеет доступа к этим данным.</p>
        </div>
      </footer>

      {/* Политика конфиденциальности */}
      {modal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-primary">Политика конфиденциальности</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-primary">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p className="font-semibold text-primary">{companyName}</p>
              <p>Настоящая политика описывает порядок обработки персональных данных пользователей в соответствии с Федеральным законом №152-ФЗ «О персональных данных».</p>
              <p><span className="font-medium text-primary">Какие данные собираем:</span> ФИО, дата рождения, паспортные данные, адрес регистрации и проживания, номер телефона, место работы, фотографии документов.</p>
              <p><span className="font-medium text-primary">Цели обработки:</span> рассмотрение заявки на займ, заключение и исполнение договора, проверка кредитоспособности, передача данных в бюро кредитных историй.</p>
              <p><span className="font-medium text-primary">Хранение:</span> данные хранятся не более 5 лет с момента погашения займа или до отзыва согласия.</p>
              <p><span className="font-medium text-primary">Передача третьим лицам:</span> данные могут передаваться в бюро кредитных историй, государственные органы — строго в рамках законодательства РФ.</p>
              <p><span className="font-medium text-primary">Права субъекта:</span> вы вправе запросить доступ к своим данным, потребовать их исправления или удаления, направив обращение на email: {companyEmail}.</p>
              <p><span className="font-medium text-primary">Защита данных:</span> передача данных осуществляется по защищённому каналу HTTPS. Доступ к данным ограничен кругом уполномоченных сотрудников.</p>
              <p className="pt-2 text-xs">Используя наш сайт и подавая заявку, вы соглашаетесь с настоящей политикой.</p>
            </div>
          </div>
        </div>
      )}

      {/* О компании */}
      {modal === 'about' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-primary">О компании</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-primary">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p className="font-semibold text-primary text-base">{companyName}</p>
              <p>{companyName} работает на рынке потребительского кредитования с 2014 года. Мы помогаем людям решать финансовые вопросы быстро и прозрачно.</p>
              <div className="rounded-xl bg-secondary p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ИНН</span>
                  <span className="font-mono font-semibold text-primary">{companyInn}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ОГРН</span>
                  <span className="font-mono font-semibold text-primary">{companyOgrn}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Год основания</span>
                  <span className="font-semibold text-primary">2026</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Регулятор</span>
                  <span className="font-semibold text-primary">ФЗ -  обработка данных (ФЗ №151)</span>
                </div>
              </div>
              <p><span className="font-medium text-primary">Деятельность:</span> предоставление микрозаймов физическим лицам. Внесены в государственный реестр микрофинансовых организаций Банка России.</p>
              <p><span className="font-medium text-primary">Контакты:</span></p>
              <p>Телефон: <a href={`tel:${companyPhone.replace(/[^\d+]/g, '')}`} className="text-accent hover:underline">{companyPhone}</a></p>
              <p>Email: <a href={`mailto:${companyEmail}`} className="text-accent hover:underline">{companyEmail}</a></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;