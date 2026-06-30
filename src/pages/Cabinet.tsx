import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { getSession, clearSession, apiGetRequest, saveSession, type UserSession } from '@/lib/api';
import CabinetHeader from '@/components/cabinet/CabinetHeader';
import CabinetStatusCard from '@/components/cabinet/CabinetStatusCard';
import CabinetDialogs from '@/components/cabinet/CabinetDialogs';

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
      <CabinetHeader
        initials={initials}
        firstName={user.full_name.split(' ')[0]}
        onMenuOpen={() => setMenuOpen(true)}
      />

      <main className="container max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-primary">Личный кабинет</h1>
        <p className="mt-1 text-muted-foreground">Здравствуйте, {user.full_name.split(' ').slice(0, 2).join(' ')}!</p>

        {/* Комментарий оператора */}
        {user.operator_comment && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
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

      <footer className="mt-10 border-t border-border bg-card">
        <div className="container max-w-3xl px-4 py-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="mb-2 font-display font-bold text-primary">ООО МКК «Займы Плюс»</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Свидетельство ЦБ РФ № 2110177000284<br />
                ИНН: 7710000000<br />
                ОГРН: 1117746000000
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-primary">Контакты</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Icon name="Phone" size={12} className="shrink-0 text-accent" />
                  <a href="tel:+74999610736" className="hover:text-primary transition-colors">+7 (499) 961-07-36</a>
                </li>
                <li className="flex items-center gap-1.5">
                  <Icon name="MessageCircle" size={12} className="shrink-0 text-accent" />
                  <a href="https://t.me/zaymiplus263" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">@zaymiplus263 — поддержка</a>
                </li>
                <li className="flex items-center gap-1.5">
                  <Icon name="Globe" size={12} className="shrink-0 text-accent" />
                  <a href="https://займы-плюс.рф" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">займы-плюс.рф</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-primary">Режим работы</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Пн–Пт: 9:00 – 20:00<br />
                Сб: 10:00 – 18:00<br />
                Вс: выходной
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Микрофинансовая организация внесена в реестр ЦБ РФ
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} ООО МКК «Займы Плюс». Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Cabinet;