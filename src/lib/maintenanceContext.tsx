import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiGetSiteSettings } from '@/lib/api';

interface MaintenanceState {
  maintenance: boolean;
  siteClosed: boolean;
}

const MaintenanceContext = createContext<MaintenanceState>({ maintenance: false, siteClosed: false });

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [maintenance, setMaintenance] = useState(false);
  const [siteClosed, setSiteClosed] = useState(false);

  useEffect(() => {
    apiGetSiteSettings().then((s) => {
      setMaintenance(s.maintenance_banner === 'true');
      setSiteClosed(s.site_closed === 'true');
    });
  }, []);

  return (
    <MaintenanceContext.Provider value={{ maintenance, siteClosed }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => useContext(MaintenanceContext);
