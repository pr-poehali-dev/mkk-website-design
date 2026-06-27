import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiGetSiteSettings } from '@/lib/api';

const MaintenanceContext = createContext(false);

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    apiGetSiteSettings().then((s) => setMaintenance(s.maintenance_banner === 'true'));
  }, []);

  return (
    <MaintenanceContext.Provider value={maintenance}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => useContext(MaintenanceContext);
