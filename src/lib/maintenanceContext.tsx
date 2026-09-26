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
export const DEFAULT_PAYMENT_INFO_TEXT = 'Уважаемый клиент! Для оплаты займа ✅ напишите нам в чат для запроса оплаты займа — наш специалист даст вам информацию и ссылку для оплаты.';
export const DEFAULT_PAYMENT_INFO_NOTE = 'К сожалению, в данный момент оплата возможна только через специалиста.';
export const DEFAULT_PAYMENT_INFO_LINK_URL = 'https://t.me/zaimyplus_support';
export const DEFAULT_PAYMENT_INFO_LINK_TEXT = 'Написать в чат поддержки';

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
  paymentInfoText: string;
  paymentInfoNote: string;
  paymentInfoLinkUrl: string;
  paymentInfoLinkText: string;
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
  paymentInfoText: DEFAULT_PAYMENT_INFO_TEXT,
  paymentInfoNote: DEFAULT_PAYMENT_INFO_NOTE,
  paymentInfoLinkUrl: DEFAULT_PAYMENT_INFO_LINK_URL,
  paymentInfoLinkText: DEFAULT_PAYMENT_INFO_LINK_TEXT,
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
        paymentInfoText: s.payment_info_text || DEFAULT_PAYMENT_INFO_TEXT,
        paymentInfoNote: s.payment_info_note || DEFAULT_PAYMENT_INFO_NOTE,
        paymentInfoLinkUrl: s.payment_info_link_url || DEFAULT_PAYMENT_INFO_LINK_URL,
        paymentInfoLinkText: s.payment_info_link_text || DEFAULT_PAYMENT_INFO_LINK_TEXT,
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