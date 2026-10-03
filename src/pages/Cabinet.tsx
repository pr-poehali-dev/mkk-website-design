import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { getSession, clearSession, apiGetRequest, saveSession, type UserSession } from '@/lib/api';
import { useMaintenance } from '@/lib/maintenanceContext';
import CabinetHeader from '@/components/cabinet/CabinetHeader';
import CabinetStatusCard from '@/components/cabinet/CabinetStatusCard';
import CabinetDialogs from '@/components/cabinet/CabinetDialogs';

const PARTNERS_URL = 'https://topmain.ru/t4ze';
const PARTNERS_IMG = 'https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/bucket/6b9a90e2-d0a0-439e-8f2d-ee8d3c421ac9.jpg';

const Cabinet = () => {
  const { companyName, cabinetBannerUrl, companyInn, companyOgrn, companyPhone, socialTelegram } = useMaintenance();
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
        {cabinetBannerUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl">
            <img src={cabinetBannerUrl} alt="Акция" className="w-full object-cover" />
          </div>
        )}

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
        setUser={setUser}
        onLogout={handleLogout}
      />

      <footer className="mt-10 overflow-hidden rounded-t-3xl bg-primary text-primary-foreground">
        <div className="container max-w-3xl px-4 py-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-md shadow-black/20">
                  <Icon name="Sparkles" size={18} />
                </span>
                <p className="font-display font-bold leading-tight">{companyName}</p>
              </div>
              <p className="text-xs leading-relaxed text-primary-foreground/60">
                ИНН: {companyInn}<br />
                ОГРН: {companyOgrn}
              </p>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground/50">Контакты</p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href={`tel:${companyPhone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2.5 text-primary-foreground/90 transition-colors hover:text-accent">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10"><Icon name="Phone" size={14} className="text-accent" /></span>
                    {companyPhone}
                  </a>
                </li>
                {socialTelegram && (
                  <li>
                    <a href={socialTelegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-primary-foreground/90 transition-colors hover:text-accent">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10"><Icon name="MessageCircle" size={14} className="text-accent" /></span>
                      Telegram — поддержка
                    </a>
                  </li>
                )}
                <li>
                  <a href="https://займы-плюс.рф" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-primary-foreground/90 transition-colors hover:text-accent">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10"><Icon name="Globe" size={14} className="text-accent" /></span>
                    займы-плюс.рф
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground/50">Режим работы</p>
              <ul className="space-y-1.5 text-sm">
                <li className="flex justify-between gap-3"><span className="text-primary-foreground/60">Пн–Пт</span><span>9:00 – 20:00</span></li>
                <li className="flex justify-between gap-3"><span className="text-primary-foreground/60">Сб</span><span>10:00 – 18:00</span></li>
                <li className="flex justify-between gap-3"><span className="text-primary-foreground/60">Вс</span><span className="text-accent">выходной</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 border-t border-primary-foreground/10 pt-4 text-center text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} {companyName}. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Cabinet;