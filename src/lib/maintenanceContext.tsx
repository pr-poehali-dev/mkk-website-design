import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiGetSiteSettings } from '@/lib/api';

export const DEFAULT_COMPANY_NAME = 'КПК «Частные займы плюс»';
export const DEFAULT_COMPANY_LOGO_URL = '';
export const DEFAULT_CABINET_BANNER_URL = '';
export const DEFAULT_COMPANY_INN = '220038299987';
export const DEFAULT_COMPANY_OGRN = '0092800992828288';
export const DEFAULT_COMPANY_PHONE = '8 499 961-07-36';
export const DEFAULT_COMPANY_EMAIL = 'zaymy.plyus@bk.ru';
export const DEFAULT_SOCIAL_TELEGRAM = 'https://t.me/zaymiplus263';
export const DEFAULT_SOCIAL_VK = '';
export const DEFAULT_SOCIAL_OK = '';
export const DEFAULT_SOCIAL_MAX = '';

interface MaintenanceState {
  maintenance: boolean;
  siteClosed: boolean;
  companyName: string;
  companyLogoUrl: string;
  cabinetBannerUrl: string;
  companyInn: string;
  companyOgrn: string;
  companyPhone: string;
  companyEmail: string;
  socialTelegram: string;
  socialVk: string;
  socialOk: string;
  socialMax: string;
}

const DEFAULT_STATE: MaintenanceState = {
  maintenance: false,
  siteClosed: false,
  companyName: DEFAULT_COMPANY_NAME,
  companyLogoUrl: DEFAULT_COMPANY_LOGO_URL,
  cabinetBannerUrl: DEFAULT_CABINET_BANNER_URL,
  companyInn: DEFAULT_COMPANY_INN,
  companyOgrn: DEFAULT_COMPANY_OGRN,
  companyPhone: DEFAULT_COMPANY_PHONE,
  companyEmail: DEFAULT_COMPANY_EMAIL,
  socialTelegram: DEFAULT_SOCIAL_TELEGRAM,
  socialVk: DEFAULT_SOCIAL_VK,
  socialOk: DEFAULT_SOCIAL_OK,
  socialMax: DEFAULT_SOCIAL_MAX,
};

const MaintenanceContext = createContext<MaintenanceState>(DEFAULT_STATE);

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<MaintenanceState>(DEFAULT_STATE);

  useEffect(() => {
    apiGetSiteSettings().then((s) => {
      setState({
        maintenance: s.maintenance_banner === 'true',
        siteClosed: s.site_closed === 'true',
        companyName: s.company_name || DEFAULT_COMPANY_NAME,
        companyLogoUrl: s.company_logo_url || DEFAULT_COMPANY_LOGO_URL,
        cabinetBannerUrl: s.cabinet_banner_url || DEFAULT_CABINET_BANNER_URL,
        companyInn: s.company_inn || DEFAULT_COMPANY_INN,
        companyOgrn: s.company_ogrn || DEFAULT_COMPANY_OGRN,
        companyPhone: s.company_phone || DEFAULT_COMPANY_PHONE,
        companyEmail: s.company_email || DEFAULT_COMPANY_EMAIL,
        socialTelegram: s.social_telegram ?? DEFAULT_SOCIAL_TELEGRAM,
        socialVk: s.social_vk ?? DEFAULT_SOCIAL_VK,
        socialOk: s.social_ok ?? DEFAULT_SOCIAL_OK,
        socialMax: s.social_max ?? DEFAULT_SOCIAL_MAX,
      });
    });
  }, []);

  return (
    <MaintenanceContext.Provider value={state}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => useContext(MaintenanceContext);