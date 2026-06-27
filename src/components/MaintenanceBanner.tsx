import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useMaintenance } from '@/lib/maintenanceContext';

const MaintenanceBanner = () => {
  const maintenance = useMaintenance();
  const [dismissed, setDismissed] = useState(false);

  if (!maintenance || dismissed) return null;

  return (
    <div className="relative z-50 w-full bg-yellow-400 text-yellow-900">
      <div className="container flex items-center gap-3 px-4 py-2.5">
        <Icon name="Construction" size={18} className="shrink-0" />
        <p className="flex-1 text-sm font-medium">
          На сайте временно проводятся технические работы. Просим вас не беспокоиться — мы скоро всё завершим.
        </p>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Закрыть"
          className="shrink-0 rounded-md p-1 hover:bg-yellow-500 transition-colors">
          <Icon name="X" size={16} />
        </button>
      </div>
    </div>
  );
};

export default MaintenanceBanner;
