import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiGetSiteSettings } from '@/lib/api';

export const DEFAULT_COMPANY_NAME = 'КПК «Частные займы плюс»';
export const DEFAULT_COMPANY_LOGO_URL = '';
export const DEFAULT_CABINET_BANNER_URL = '';
export const DEFAULT_COMPANY_INN = '220038299987';
export const DEFAULT_COMPANY_OGRN = '0092800992828288';

interface MaintenanceState {
  maintenance: boolean;
  siteClosed: boolean;
  companyName: string;
  companyLogoUrl: string;
  cabinetBannerUrl: string;
  companyInn: string;
  companyOgrn: string;
}

const MaintenanceContext = createContext<MaintenanceState>({ maintenance: false, siteClosed: false, companyName: DEFAULT_COMPANY_NAME, companyLogoUrl: DEFAULT_COMPANY_LOGO_URL, cabinetBannerUrl: DEFAULT_CABINET_BANNER_URL, companyInn: DEFAULT_COMPANY_INN, companyOgrn: DEFAULT_COMPANY_OGRN });

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [maintenance, setMaintenance] = useState(false);
  const [siteClosed, setSiteClosed] = useState(false);
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(DEFAULT_COMPANY_LOGO_URL);
  const [cabinetBannerUrl, setCabinetBannerUrl] = useState(DEFAULT_CABINET_BANNER_URL);
  const [companyInn, setCompanyInn] = useState(DEFAULT_COMPANY_INN);
  const [companyOgrn, setCompanyOgrn] = useState(DEFAULT_COMPANY_OGRN);

  useEffect(() => {
    apiGetSiteSettings().then((s) => {
      setMaintenance(s.maintenance_banner === 'true');
      setSiteClosed(s.site_closed === 'true');
      setCompanyName(s.company_name || DEFAULT_COMPANY_NAME);
      setCompanyLogoUrl(s.company_logo_url || DEFAULT_COMPANY_LOGO_URL);
      setCabinetBannerUrl(s.cabinet_banner_url || DEFAULT_CABINET_BANNER_URL);
      setCompanyInn(s.company_inn || DEFAULT_COMPANY_INN);
      setCompanyOgrn(s.company_ogrn || DEFAULT_COMPANY_OGRN);
    });
  }, []);

  return (
    <MaintenanceContext.Provider value={{ maintenance, siteClosed, companyName, companyLogoUrl, cabinetBannerUrl, companyInn, companyOgrn }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => useContext(MaintenanceContext);