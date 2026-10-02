import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: string;
  hint?: string;
  error?: string;
}

const AnketaField = ({ id, label, icon, hint, error, className = '', ...rest }: Props) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-sm font-medium text-primary">{label}</Label>
    <div className="relative">
      <Icon name={icon} size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        className={`h-12 rounded-lg bg-background pl-10 text-base ${error ? 'border-red-400 focus-visible:ring-red-400' : 'border-border'} ${className}`}
        {...rest}
      />
    </div>
    {error ? (
      <p className="flex items-center gap-1 text-xs text-red-600"><Icon name="AlertCircle" size={12} /> {error}</p>
    ) : hint ? (
      <p className="text-xs text-muted-foreground">{hint}</p>
    ) : null}
  </div>
);

export default AnketaField;
