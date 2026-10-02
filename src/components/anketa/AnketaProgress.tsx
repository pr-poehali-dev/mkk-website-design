import Icon from '@/components/ui/icon';

export const STEPS = [
  { n: 1, title: 'Личные данные', icon: 'User' },
  { n: 2, title: 'Паспорт', icon: 'BookUser' },
  { n: 3, title: 'Параметры займа', icon: 'Wallet' },
  { n: 4, title: 'Фото документов', icon: 'Images' },
  { n: 5, title: 'Адрес и работа', icon: 'Briefcase' },
];

const AnketaProgress = ({ step }: { step: number }) => (
  <div className="mb-8">
    <div className="mb-4 flex items-center justify-between gap-2">
      {STEPS.map((s) => (
        <div key={s.n} className="flex flex-1 flex-col items-center gap-1.5">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
            step > s.n ? 'bg-primary/80 text-primary-foreground' :
            step === s.n ? 'bg-primary text-primary-foreground' :
            'bg-secondary text-muted-foreground'
          }`}>
            {step > s.n
              ? <Icon name="Check" size={18} />
              : <Icon name={s.icon} size={18} />
            }
          </div>
          <span className={`hidden text-center text-xs sm:block ${step === s.n ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
            {s.title}
          </span>
        </div>
      ))}
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
    </div>
    <p className="mt-3 text-center text-sm text-muted-foreground">Шаг {step} из {STEPS.length} — {STEPS[step - 1].title}</p>
  </div>
);

export default AnketaProgress;
