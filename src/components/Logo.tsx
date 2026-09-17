import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface LogoProps {
  /** full — иконка + название + подпись "займы онлайн"; compact — иконка + название в одну строку */
  variant?: 'full' | 'compact';
  /** dark — для тёмных фонов (например, bg-primary) */
  theme?: 'light' | 'dark';
  /** Куда ведёт клик по логотипу. null — логотип без ссылки */
  linkTo?: string | null;
  className?: string;
}

const Logo = ({ variant = 'full', theme = 'light', linkTo = '/', className = '' }: LogoProps) => {
  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md ${
          theme === 'dark'
            ? 'bg-white/15 text-white shadow-black/20'
            : 'bg-gradient-to-br from-[#2f3277] to-[#4a4fb0] text-white shadow-[#2f3277]/30'
        }`}
      >
        <Icon name="Sparkles" size={18} />
      </div>
      {variant === 'full' ? (
        <div className="leading-none">
          <p className={`font-display text-lg font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-[#1b1d3a]'}`}>Займы плюс </p>
          <p className={`text-[10px] italic ${theme === 'dark' ? 'text-white/75' : 'text-muted-foreground'}`}>займы онлайн</p>
        </div>
      ) : (
        <p className={`font-display text-lg font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-[#1b1d3a]'}`}>
          Финан<span className="text-[#8fce2b]">з</span>а<span className="text-[#8fce2b]">!</span>
        </p>
      )}
    </div>
  );

  if (linkTo === null) return content;
  return <Link to={linkTo}>{content}</Link>;
};

export default Logo;