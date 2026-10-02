import Icon from '@/components/ui/icon';

const ITEMS = [
  { icon: 'ShieldCheck', title: 'Данные защищены', text: 'Передаются по защищённому соединению и не передаются третьим лицам' },
  { icon: 'Clock', title: 'Решение за 10 минут', text: 'Заявка рассматривается сразу после отправки' },
  { icon: 'CreditCard', title: 'Деньги на карту', text: 'Перевод через СБП на вашу банковскую карту' },
  { icon: 'Headset', title: 'Поддержка', text: 'Поможем с заявкой в чате и по телефону' },
];

const AnketaTrust = () => (
  <aside className="rounded-xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-6">
    <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Почему нам доверяют</p>
    <ul className="space-y-4">
      {ITEMS.map((i) => (
        <li key={i.title} className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon name={i.icon} size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">{i.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{i.text}</p>
          </div>
        </li>
      ))}
    </ul>
  </aside>
);

export default AnketaTrust;
