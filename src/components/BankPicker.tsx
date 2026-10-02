import { useState } from 'react';
import Icon from '@/components/ui/icon';
import BankLogo from '@/components/BankLogo';
import { BANKS, normalizeBankName } from '@/lib/banks';

interface Props {
  selected: string | null;
  onSelect: (name: string) => void;
  maxHeightClass?: string;
}

const BankPicker = ({ selected, onSelect, maxHeightClass = 'max-h-80' }: Props) => {
  const [query, setQuery] = useState('');
  const current = normalizeBankName(selected);
  const q = query.trim().toLowerCase();
  const list = q ? BANKS.filter((b) => b.name.toLowerCase().includes(q)) : BANKS;

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск"
          className="h-11 w-full rounded-xl border-2 border-border bg-background px-4 pr-10 text-sm text-primary outline-none transition-colors focus:border-accent"
        />
        <Icon name="Search" size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
      <div className={`${maxHeightClass} overflow-y-auto rounded-xl border border-border bg-card`}>
        {list.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">Банк не найден</p>
        ) : (
          list.map((bank) => (
            <button
              key={bank.name}
              type="button"
              onClick={() => onSelect(bank.name)}
              className={`flex w-full items-center gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary ${current === bank.name ? 'bg-accent/10' : ''}`}
            >
              <BankLogo name={bank.name} size={36} />
              <span className="flex-1 text-sm font-medium text-primary">{bank.name}</span>
              {current === bank.name && <Icon name="Check" size={16} className="text-accent" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default BankPicker;
