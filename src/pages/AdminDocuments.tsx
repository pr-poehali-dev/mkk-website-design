import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';
import { useMaintenance } from '@/lib/maintenanceContext';
import {
  buildPhoneChangeApplicationHtml,
  buildDebtClearanceCertificateHtml,
  buildPersonalDataConsentHtml,
  buildDataTransferConsentHtml,
} from '@/components/admin/documentTemplates';

interface DocDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  fileName: string;
  build: (companyName: string) => string;
}

const DOCS: DocDef[] = [
  {
    key: 'phone_change',
    title: 'Заявление на смену номера телефона',
    description: 'Бланк для клиента на изменение контактного номера в договоре займа',
    icon: 'Smartphone',
    fileName: 'Заявление_смена_номера.html',
    build: buildPhoneChangeApplicationHtml,
  },
  {
    key: 'debt_clearance',
    title: 'Справка об отсутствии задолженности',
    description: 'Типовой бланк справки для клиента, полностью погасившего займ',
    icon: 'FileCheck',
    fileName: 'Справка_об_отсутствии_задолженности.html',
    build: (companyName) => buildDebtClearanceCertificateHtml(undefined, companyName),
  },
  {
    key: 'pd_consent',
    title: 'Согласие на обработку персональных данных',
    description: 'Развёрнутый типовой текст 152-ФЗ (10 страниц)',
    icon: 'ShieldCheck',
    fileName: 'Согласие_на_обработку_ПД.html',
    build: (companyName) => buildPersonalDataConsentHtml(undefined, companyName),
  },
  {
    key: 'pd_transfer',
    title: 'Согласие на передачу персональных данных',
    description: 'Согласие на передачу данных третьим лицам (БКИ, банки, коллекторы и др.)',
    icon: 'Share2',
    fileName: 'Согласие_на_передачу_ПД.html',
    build: (companyName) => buildDataTransferConsentHtml(undefined, companyName),
  },
];

const AdminDocuments = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('zaimy_admin') === '1');
  const { companyName } = useMaintenance();

  if (!authed) {
    return <AdminLoginScreen onAuth={() => setAuthed(true)} />;
  }

  const download = (doc: DocDef) => {
    const html = doc.build(companyName);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const preview = (doc: DocDef) => {
    const html = doc.build(companyName);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon name="FileStack" size={20} className="text-accent" />
            <span className="font-display text-lg font-bold tracking-wide">ДОКУМЕНТЫ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="ArrowLeft" size={16} /> К заявкам
            </Link>
            <button onClick={() => { sessionStorage.removeItem('zaimy_admin'); setAuthed(false); }}
              className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Icon name="LogOut" size={16} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-primary">Типовые документы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Готовые бланки для выдачи клиентам. Скачайте нужный документ или откройте предпросмотр.
        </p>

        <div className="mt-5 space-y-3">
          {DOCS.map((doc) => (
            <div key={doc.key} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon name={doc.icon} size={19} />
                </div>
                <div>
                  <p className="font-semibold text-primary">{doc.title}</p>
                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => preview(doc)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-primary hover:bg-secondary transition-colors">
                  <Icon name="Eye" size={14} /> Просмотр
                </button>
                <button onClick={() => download(doc)}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
                  <Icon name="Download" size={14} /> Скачать
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDocuments;