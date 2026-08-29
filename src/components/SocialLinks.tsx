import { useMaintenance } from '@/lib/maintenanceContext';

const ICONS: Record<string, JSX.Element> = {
  telegram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.496.969z" />
    </svg>
  ),
  vk: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.162 18.994c.609 0 .858-.406.851-.915-.031-1.917.714-2.949 2.059-1.604 1.488 1.488 1.796 2.519 3.603 2.519h3.2c.851 0 1.279-.43 1.279-.86 0-.984-1.6-2.723-2.947-4.145-1.529-1.617-1.132-1.786.437-3.938 1.481-2.037 2.204-3.36 1.83-3.87-.406-.539-1.876-.383-2.855-.383h-2.876c-.851 0-.968.462-1.278 1.093-.87 1.777-2.394 4.318-3.043 4.318-.318 0-.475-.284-.475-1.026v-3.152c0-1.09-.313-1.578-1.294-1.578H7.706c-.749 0-1.213.516-1.213 1.007 0 .935 1.578.717 1.578 3.117v2.184c0 .959-.163 1.13-.481 1.13-.873 0-2.816-2.977-3.926-6.383-.263-.762-.516-1.055-1.372-1.055H.216c-.917 0-1.216.398-1.216.86 0 .805 1.202 4.045 5.601 8.573C7.629 18 10.264 19 12.665 19c1.442 0 .497-1.582.497-1.582l.001-.011.001.005z" />
    </svg>
  ),
  ok: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0a5.001 5.001 0 0 0-1.041 9.895 5.001 5.001 0 0 0 2.082 0A5 5 0 1 0 12 0zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6.375 10.813a1 1 0 0 0-.62 1.804A10.68 10.68 0 0 0 9.5 14.36l-3.828 3.828a1 1 0 1 0 1.415 1.414L12 14.688l4.914 4.914a1 1 0 0 0 1.414-1.414L14.5 14.36a10.68 10.68 0 0 0 3.745-1.743 1 1 0 0 0-1.156-1.633A8.66 8.66 0 0 1 12 12.5a8.66 8.66 0 0 1-5.09-1.516 1 1 0 0 0-.535-.17z" />
    </svg>
  ),
  max: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 5.925 2 10.75c0 2.782 1.485 5.262 3.797 6.86-.126.98-.51 2.31-1.517 3.61a.5.5 0 0 0 .513.795c1.85-.462 3.372-1.325 4.39-2.033a12.6 12.6 0 0 0 2.817.318c5.523 0 10-3.925 10-8.75S17.523 2 12 2z" />
    </svg>
  ),
};

const SOCIAL_META = [
  { key: 'telegram', label: 'Telegram' },
  { key: 'vk', label: 'VK' },
  { key: 'ok', label: 'Одноклассники' },
  { key: 'max', label: 'MAX' },
] as const;

const SocialLinks = ({ className = '' }: { className?: string }) => {
  const { socialTelegram, socialVk, socialOk, socialMax } = useMaintenance();
  const urls: Record<string, string> = {
    telegram: socialTelegram,
    vk: socialVk,
    ok: socialOk,
    max: socialMax,
  };
  const active = SOCIAL_META.filter((s) => urls[s.key]);
  if (active.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {active.map((s) => (
        <a
          key={s.key}
          href={urls[s.key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {ICONS[s.key]}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;