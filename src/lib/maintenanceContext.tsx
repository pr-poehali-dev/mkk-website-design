import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiGetSiteSettings } from '@/lib/api';

export const DEFAULT_COMPANY_NAME = 'КПК «Частные займы плюс»';
export const DEFAULT_COMPANY_LOGO_URL = '';

interface MaintenanceState {
  maintenance: boolean;
  siteClosed: boolean;
  companyName: string;
  companyLogoUrl: string;
}

const MaintenanceContext = createContext<MaintenanceState>({ maintenance: false, siteClosed: false, companyName: DEFAULT_COMPANY_NAME, companyLogoUrl: DEFAULT_COMPANY_LOGO_URL });

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [maintenance, setMaintenance] = useState(false);
  const [siteClosed, setSiteClosed] = useState(false);
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(DEFAULT_COMPANY_LOGO_URL);

  useEffect(() => {
    apiGetSiteSettings().then((s) => {
      setMaintenance(s.maintenance_banner === 'true');
      setSiteClosed(s.site_closed === 'true');
      setCompanyName(s.company_name || DEFAULT_COMPANY_NAME);
      setCompanyLogoUrl(s.company_logo_url || DEFAULT_COMPANY_LOGO_URL);
    });
  }, []);

  return (
    <MaintenanceContext.Provider value={{ maintenance, siteClosed, companyName, companyLogoUrl }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => useContext(MaintenanceContext);