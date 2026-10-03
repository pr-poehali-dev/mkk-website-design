import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import SocialLinks from '@/components/SocialLinks';
import { useMaintenance } from '@/lib/maintenanceContext';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

const linkCls = 'flex items-center gap-2.5 text-primary-foreground/90 transition-colors hover:text-accent';
const iconBox = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10';

const SiteFooter = ({ className }: Props) => {
  const { companyName, companyInn, companyOgrn, companyPhone, companyEmail, socialTelegram } = useMaintenance();

  return (
    <footer className={cn('mt-10 overflow-hidden rounded-t-3xl bg-primary text-primary-foreground', className)}>
      <div className="container max-w-3xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <Logo theme="dark" variant="full" linkTo={null} />
            <p className="mt-3 text-xs leading-relaxed text-primary-foreground/60">
              {companyName}<br />
              ИНН: {companyInn}<br />
              ОГРН: {companyOgrn}
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground/50">Контакты</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href={`tel:${companyPhone.replace(/[^\d+]/g, '')}`} className={linkCls}>
                  <span className={iconBox}><Icon name="Phone" size={14} className="text-accent" /></span>
                  {companyPhone}
                </a>
              </li>
              {companyEmail && (
                <li>
                  <a href={`mailto:${companyEmail}`} className={linkCls}>
                    <span className={iconBox}><Icon name="Mail" size={14} className="text-accent" /></span>
                    {companyEmail}
                  </a>
                </li>
              )}
              {socialTelegram && (
                <li>
                  <a href={socialTelegram} target="_blank" rel="noopener noreferrer" className={linkCls}>
                    <span className={iconBox}><Icon name="MessageCircle" size={14} className="text-accent" /></span>
                    Telegram — поддержка
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground/50">Режим работы</p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between gap-3"><span className="text-primary-foreground/60">Пн–Пт</span><span>9:00 – 20:00</span></li>
              <li className="flex justify-between gap-3"><span className="text-primary-foreground/60">Сб</span><span>10:00 – 18:00</span></li>
              <li className="flex justify-between gap-3"><span className="text-primary-foreground/60">Вс</span><span className="text-accent">выходной</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 border-t border-primary-foreground/10 pt-4 text-center text-xs text-primary-foreground/50">
          <SocialLinks />
          <span>© {new Date().getFullYear()} {companyName}. Все права защищены.</span>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
