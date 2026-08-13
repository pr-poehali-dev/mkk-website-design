import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import { useMaintenance } from '@/lib/maintenanceContext';

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
  const { maintenance } = useMaintenance();
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
    { n: '01', title: 'Рассчитайте займ', text: 'Выберите сумму и срок на калькуляторе.' },
    { n: '02', title: 'Заполните анкету', text: 'Укажите данные и загрузите фото паспорта.' },
    { n: '03', title: 'Получите деньги', text: 'Средства поступят на вашу карту за минуты.' },
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
        <div className="container flex h-16 items-center justify-between px-4 rounded-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/30 ring-1 ring-white/10">
              <Icon name="Landmark" size={19} />
            </div>
            <div className="leading-none">
              <p className="font-display text-lg font-bold tracking-wide text-primary">ЗАЙМЫ ПЛЮС</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Займы онлайн 24/7</p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#calc" className="text-muted-foreground transition-colors hover:text-primary">Калькулятор</a>
            <a href="#how" className="text-muted-foreground transition-colors hover:text-primary">Как это работает</a>
            <a href="#why" className="text-muted-foreground transition-colors hover:text-primary">Преимущества</a>
            <a href="#faq" className="text-muted-foreground transition-colors hover:text-primary">FAQ</a>
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
                  <a href="#why" className="rounded-xl px-4 py-3 text-base font-medium text-primary hover:bg-secondary">Преимущества</a>
                  <a href="#faq" className="rounded-xl px-4 py-3 text-base font-medium text-primary hover:bg-secondary">FAQ</a>
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
          <div className="animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-xs font-medium">Одобрение 96% заявок · работаем 24/7</div>
            <h1 className="font-display font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl text-3xl">
              Оформите заявку онлайн и получите{' '}
              <span className="inline-block rounded-full bg-accent px-4 py-1 text-primary">до 30 000 ₽</span>{' '}
              на любые цели
            </h1>
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
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 hero-grid opacity-40" />
        <div className="container relative px-4 py-16 text-center md:py-20">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Готовы оформить займ?</h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/75">Заполните анкету за 2 минуты — решение придёт мгновенно.</p>
          {maintenance ? (
            <Button size="lg" disabled className="mt-7 h-12 px-8 text-base font-bold cursor-not-allowed opacity-60">
              <Icon name="Construction" size={18} className="mr-2" />
              Временно недоступно
            </Button>
          ) : (
            <Button asChild size="lg" className="mt-7 h-12 bg-accent px-8 text-base font-bold text-accent-foreground hover:bg-accent/90">
              <Link to="/anketa">Заполнить анкету <Icon name="ArrowRight" size={18} className="ml-1" /></Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground/70">
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
            <p className="text-primary-foreground/60 text-center">© 2014–2026 КПК «Частные займы плюс».<br className="hidden md:block" /> Все права защищены.</p>
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
          </div>
          <p className="mt-4 text-xs text-primary-foreground/40 text-center">Деятельность регулируется ФЗ №190-ФЗ «О кредитной кооперации». Расчёты на калькуляторе носят ознакомительный характер. ИНН: 220038299987 · ОГРН: 0092800992828288
Сайт не является МКК или МФО, наш сервис даёт вам лучшие условия по займу.</p>
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
              <p className="font-semibold text-primary">КПК «Частные займы плюс»</p>
              <p>Настоящая политика описывает порядок обработки персональных данных пользователей в соответствии с Федеральным законом №152-ФЗ «О персональных данных».</p>
              <p><span className="font-medium text-primary">Какие данные собираем:</span> ФИО, дата рождения, паспортные данные, адрес регистрации и проживания, номер телефона, место работы, фотографии документов.</p>
              <p><span className="font-medium text-primary">Цели обработки:</span> рассмотрение заявки на займ, заключение и исполнение договора, проверка кредитоспособности, передача данных в бюро кредитных историй.</p>
              <p><span className="font-medium text-primary">Хранение:</span> данные хранятся не более 5 лет с момента погашения займа или до отзыва согласия.</p>
              <p><span className="font-medium text-primary">Передача третьим лицам:</span> данные могут передаваться в бюро кредитных историй, государственные органы — строго в рамках законодательства РФ.</p>
              <p><span className="font-medium text-primary">Права субъекта:</span> вы вправе запросить доступ к своим данным, потребовать их исправления или удаления, направив обращение на email: zaymy.plyus@bk.ru.</p>
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
              <p className="font-semibold text-primary text-base">КПК «Частные займы плюс»</p>
              <p>Кредитный потребительский кооператив «Частные займы плюс» работает на рынке потребительского кредитования с 2014 года. Мы помогаем людям решать финансовые вопросы быстро и прозрачно.</p>
              <div className="rounded-xl bg-secondary p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ИНН</span>
                  <span className="font-mono font-semibold text-primary">220038299987</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ОГРН</span>
                  <span className="font-mono font-semibold text-primary">0092800992828288</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Год основания</span>
                  <span className="font-semibold text-primary">2014</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Регулятор</span>
                  <span className="font-semibold text-primary">Банк России (ФЗ №151)</span>
                </div>
              </div>
              <p><span className="font-medium text-primary">Деятельность:</span> предоставление микрозаймов физическим лицам. Внесены в государственный реестр микрофинансовых организаций Банка России.</p>
              <p><span className="font-medium text-primary">Контакты:</span></p>
              <p>Телефон: <a href="tel:84999610736" className="text-accent hover:underline">8 499 961-07-36</a></p>
              <p>Email: <a href="mailto:zaymy.plyus@bk.ru" className="text-accent hover:underline">zaymy.plyus@bk.ru</a></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;