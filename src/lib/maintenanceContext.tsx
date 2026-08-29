import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiGetSiteSettings } from '@/lib/api';

export const DEFAULT_COMPANY_NAME = 'КПК «Частные займы плюс»';

interface MaintenanceState {
  maintenance: boolean;
  siteClosed: boolean;
  companyName: string;
}

const MaintenanceContext = createContext<MaintenanceState>({ maintenance: false, siteClosed: false, companyName: DEFAULT_COMPANY_NAME });

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [maintenance, setMaintenance] = useState(false);
  const [siteClosed, setSiteClosed] = useState(false);
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);

  useEffect(() => {
    apiGetSiteSettings().then((s) => {
      setMaintenance(s.maintenance_banner === 'true');
      setSiteClosed(s.site_closed === 'true');
      setCompanyName(s.company_name || DEFAULT_COMPANY_NAME);
    });
  }, []);

  return (
    <MaintenanceContext.Provider value={{ maintenance, siteClosed, companyName }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => useContext(MaintenanceContext);