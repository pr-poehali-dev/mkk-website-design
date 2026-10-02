import { findBank } from '@/lib/banks';

interface Props {
  name?: string | null;
  size?: number;
}

const BankLogo = ({ name, size = 40 }: Props) => {
  const bank = findBank(name);
  const short = bank?.short || '₽';
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold leading-none"
      style={{
        width: size,
        height: size,
        backgroundColor: bank?.color || '#64748B',
        color: bank?.text || '#FFFFFF',
        fontSize: short.length > 2 ? size * 0.28 : size * 0.4,
      }}
    >
      {short}
    </div>
  );
};

export default BankLogo;
