import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { getSession, clearSession, apiGetRequest, saveSession, type UserSession } from '@/lib/api';
import CabinetHeader from '@/components/cabinet/CabinetHeader';
import CabinetStatusCard from '@/components/cabinet/CabinetStatusCard';
import CabinetDialogs from '@/components/cabinet/CabinetDialogs';
import SiteFooter from '@/components/SiteFooter';
import CabinetArticles from '@/components/cabinet/CabinetArticles';

const PARTNERS_URL = 'https://topmain.ru/t4ze';
const PARTNERS_IMG = 'https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/bucket/6b9a90e2-d0a0-439e-8f2d-ee8d3c421ac9.jpg';

const Cabinet = () => {
  const nav = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [contractSigned, setContractSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [bankSaved, setBankSaved] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [cardBannerHidden, setCardBannerHidden] = useState(() => localStorage.getItem('card_banner_hidden') === '1');
  const [partnersPopup, setPartnersPopup] = useState(false);
  const popupShown = useRef(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { nav('/login'); return; }
    setUser(session);
    if (session.payment_bank) setSelectedBank(session.payment_bank);
    setLoading(false);
    apiGetRequest(session.ref_number).then((fresh) => {
      saveSession(fresh);
      setUser(fresh);
      if (fresh.payment_bank) setSelectedBank(fresh.payment_bank);
      if (fresh.status === 'rejected' && !popupShown.current) {
        popupShown.current = true;
        setPartnersPopup(true);
      }
    }).catch(() => {});
  }, [nav]);

  const handleLogout = () => { clearSession(); nav('/login'); };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const contractCode = `ДГ-${user.ref_number}-${user.created_at?.slice(0, 10).replace(/-/g, '')}`;
  const initials = user.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-secondary/40">

      {/* Поп-окно для отказанных клиентов */}
      {partnersPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPartnersPopup(false)}>
          <div className="relative w-full max-w-sm rounded-2xl bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPartnersPopup(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <Icon name="X" size={16} />
            </button>
            <img src={PARTNERS_IMG} alt="Займы одобрили тут" className="w-full object-cover" />
            <div className="p-5">
              <h3 className="text-lg font-bold text-primary">Займы одобрили тут!</h3>
              <p className="mt-1 text-sm text-muted-foreground">Наши партнёры одобряют займы даже при плохой кредитной истории. Попробуйте прямо сейчас!</p>
              <a
                href={PARTNERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                onClick={() => setPartnersPopup(false)}
              >
                <Icon name="ExternalLink" size={16} className="shrink-0" />
                Получить займ у партнёров
              </a>
            </div>
          </div>
        </div>
      )}

      <CabinetHeader
        initials={initials}
        firstName={user.full_name.split(' ')[0]}
        phone={user.phone}
        onMenuOpen={() => setMenuOpen(true)}
      />

      <main className="container max-w-3xl px-4 py-10">
        <CabinetArticles />

        {/* Комментарий оператора */}
        {user.operator_comment && (
          <div className="flex gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Icon name="MessageSquare" size={20} />
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold text-primary">Сообщение от оператора</p>
              <p className="text-sm text-muted-foreground">{user.operator_comment}</p>
            </div>
          </div>
        )}

        {!cardBannerHidden && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setWalletOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') setWalletOpen(true); }}
          className="group relative mb-6 flex cursor-pointer w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-5 text-left text-primary-foreground shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Icon name="CreditCard" size={24} />
          </span>
          <span className="relative min-w-0 flex-1 pr-6">
            <span className="block font-display text-base font-bold leading-tight sm:text-lg">Откройте виртуальную карту до 270 000 ₽</span>
            <span className="mt-1 block text-xs text-primary-foreground/80 sm:text-sm">Онлайн, без визита в офис — заявка за пару минут</span>
          </span>
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:translate-x-1">
            <Icon name="ArrowRight" size={18} />
          </span>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={(e) => { e.stopPropagation(); setCardBannerHidden(true); localStorage.setItem('card_banner_hidden', '1'); }}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-primary-foreground hover:bg-black/40"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
        )}

        <CabinetStatusCard
          user={user}
          contractSigned={contractSigned}
          signing={signing}
          selectedBank={selectedBank}
          contractCode={contractCode}
          onOpenCards={() => { setCardsOpen(true); setBankSaved(false); }}
          onOpenDocs={() => setDocsOpen(true)}
          setContractSigned={setContractSigned}
          setSigning={setSigning}
          setUser={setUser}
        />

      </main>

      <CabinetDialogs
        user={user}
        initials={initials}
        contractCode={contractCode}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        cardsOpen={cardsOpen}
        setCardsOpen={setCardsOpen}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        docsOpen={docsOpen}
        setDocsOpen={setDocsOpen}
        selectedBank={selectedBank}
        setSelectedBank={setSelectedBank}
        bankSaved={bankSaved}
        setBankSaved={setBankSaved}
        walletOpen={walletOpen}
        setWalletOpen={setWalletOpen}
        setUser={setUser}
        onLogout={handleLogout}
      />

      <SiteFooter />
    </div>
  );
};

export default Cabinet;