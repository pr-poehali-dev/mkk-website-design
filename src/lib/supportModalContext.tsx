import { createContext, useContext, useState, ReactNode } from 'react';

export interface SupportPrefill {
  name?: string;
  phone?: string;
  email?: string;
}

interface SupportModalState {
  isOpen: boolean;
  prefill: SupportPrefill;
  openModal: (prefill?: SupportPrefill) => void;
  closeModal: () => void;
}

const SupportModalContext = createContext<SupportModalState>({
  isOpen: false,
  prefill: {},
  openModal: () => {},
  closeModal: () => {},
});

export const SupportModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<SupportPrefill>({});

  const openModal = (p?: SupportPrefill) => {
    setPrefill(p || {});
    setIsOpen(true);
  };

  return (
    <SupportModalContext.Provider value={{ isOpen, prefill, openModal, closeModal: () => setIsOpen(false) }}>
      {children}
    </SupportModalContext.Provider>
  );
};

export const useSupportModal = () => useContext(SupportModalContext);
