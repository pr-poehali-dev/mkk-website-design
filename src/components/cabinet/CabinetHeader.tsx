import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface Props {
  initials: string;
  firstName: string;
  onMenuOpen: () => void;
}

const CabinetHeader = ({ initials, firstName, onMenuOpen }: Props) => (
  <header className="border-b border-border bg-background">
    <div className="container flex h-16 items-center justify-between px-4">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon name="Landmark" size={20} />
        </div>
        <span className="font-display text-lg font-bold tracking-wide text-primary">ЗАЙМЫ ПЛЮС</span>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={onMenuOpen}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary transition-colors">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <span className="hidden sm:block">{firstName}</span>
          <Icon name="ChevronDown" size={15} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  </header>
);

export default CabinetHeader;
