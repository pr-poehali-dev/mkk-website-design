import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import CameraCapture from '@/components/anketa/CameraCapture';
import { formatPhone } from '@/lib/phone';

const SELFIE_EXAMPLE_URL = 'https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/files/e014475b-6ad6-4982-9ef6-ccfa2cf49809.jpg';

export type WorkForm = { address_residence: string; address_registration: string; work_place: string; work_phone: string };

interface PhotosStepProps {
  checkSeconds: number;
  selfieCode: string;
  passportPhoto: string | null;
  passportFile: File | null;
  passportChecking: boolean;
  passportChecked: boolean;
  passportSecondsLeft: number;
  onPassportPhoto: (file: File) => void;
  selfiePhoto: string | null;
  selfieFile: File | null;
  selfieChecking: boolean;
  selfieChecked: boolean;
  selfieSecondsLeft: number;
  onSelfiePhoto: (file: File) => void;
  incomePreview: string | null;
  incomeFile: File | null;
  incomeChecking: boolean;
  incomeChecked: boolean;
  incomeSecondsLeft: number;
  onIncomeFile: (file: File) => void;
  setApiError: (v: string) => void;
  next: () => void;
}

export const PhotosStep = ({
  checkSeconds, selfieCode,
  passportPhoto, passportFile, passportChecking, passportChecked, passportSecondsLeft, onPassportPhoto,
  selfiePhoto, selfieFile, selfieChecking, selfieChecked, selfieSecondsLeft, onSelfiePhoto,
  incomePreview, incomeFile, incomeChecking, incomeChecked, incomeSecondsLeft, onIncomeFile,
  setApiError, next,
}: PhotosStepProps) => (
  <div className="space-y-6">
    <div className="space-y-1.5">
      <CameraCapture
        label="Фото паспорта (разворот с фото)"
        hint="Наведите камеру на разворот с фотографией"
        preview={passportPhoto}
        onCapture={onPassportPhoto}
        checking={passportChecking}
        checked={passportChecked}
        secondsLeft={passportSecondsLeft}
        totalSeconds={checkSeconds}
      />
    </div>

    <div className="space-y-3">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-800">
          <Icon name="Info" size={16} className="shrink-0" /> Как сделать фото с кодом
        </p>
        <ol className="ml-1 space-y-1.5 text-sm text-blue-700">
          <li>1. Напишите код <span className="rounded bg-white px-1.5 py-0.5 font-mono font-bold text-blue-900">{selfieCode}</span> крупно на листе бумаги</li>
          <li>2. Сфотографируйте своё лицо с этим листком рядом (как на примере)</li>
          <li>3. Убедитесь, что лицо и код хорошо видны</li>
        </ol>
        <div className="mt-3 overflow-hidden rounded-lg border border-blue-200">
          <img src={SELFIE_EXAMPLE_URL} alt="Пример фото с кодом" className="w-full object-cover" />
        </div>
        <p className="mt-2 text-center text-xs text-blue-600">Пример фото</p>
      </div>

      <CameraCapture
        label="Фото лица с кодом"
        hint="Наведите камеру на своё лицо и листок с кодом"
        preview={selfiePhoto}
        onCapture={onSelfiePhoto}
        aspect="square"
        checking={selfieChecking}
        checked={selfieChecked}
        secondsLeft={selfieSecondsLeft}
        totalSeconds={checkSeconds}
      />
    </div>

    <div className="space-y-1.5">
      <CameraCapture
        label="Фото справки о доходах"
        hint="Сфотографируйте документ"
        preview={incomePreview}
        onCapture={onIncomeFile}
        checking={incomeChecking}
        checked={incomeChecked}
        secondsLeft={incomeSecondsLeft}
        totalSeconds={checkSeconds}
      />
    </div>

    {(passportChecking || selfieChecking || incomeChecking) && (
      <p className="flex items-center gap-1.5 text-center text-xs text-blue-600">
        <Icon name="Loader2" size={13} className="shrink-0 animate-spin" /> Дождитесь окончания проверки фото, чтобы продолжить
      </p>
    )}

    <Button size="lg" className="mt-2 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
      disabled={passportChecking || selfieChecking || incomeChecking}
      onClick={() => {
        if (!passportFile) { setApiError('Сделайте фото паспорта'); return; }
        if (!selfieFile) { setApiError('Сделайте фото лица с листком, на котором написан код'); return; }
        if (!incomeFile) { setApiError('Сделайте фото справки о доходах'); return; }
        next();
      }}>
      Далее <Icon name="ArrowRight" size={18} className="ml-1" />
    </Button>
  </div>
);

interface AddressStepProps {
  f4: WorkForm;
  setF4: (v: WorkForm) => void;
  codeSending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddressStep = ({ f4, setF4, codeSending, onSubmit }: AddressStepProps) => {
  const handleWorkPhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setF4({ ...f4, work_phone: formatPhone(e.target.value) });
  const upd4 = (k: keyof typeof f4) => (e: React.ChangeEvent<HTMLInputElement>) => setF4({ ...f4, [k]: e.target.value });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon name="MapPin" size={15} className="text-accent" /> Адрес
        </legend>
        <div className="space-y-1.5">
          <Label htmlFor="address_residence">Место проживания *</Label>
          <Input id="address_residence" placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
            value={f4.address_residence} onChange={upd4('address_residence')} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address_registration">Адрес регистрации (прописки)</Label>
          <Input id="address_registration" placeholder="Совпадает с местом проживания или укажите другой"
            value={f4.address_registration} onChange={upd4('address_registration')} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon name="Briefcase" size={15} className="text-accent" /> Место работы
        </legend>
        <div className="space-y-1.5">
          <Label htmlFor="work_place">Организация и должность *</Label>
          <Input id="work_place" placeholder="ООО «Компания», менеджер"
            value={f4.work_place} onChange={upd4('work_place')} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="work_phone">Телефон работы</Label>
          <Input id="work_phone" type="tel" placeholder="+7 (___) ___-__-__"
            value={f4.work_phone} onChange={handleWorkPhone}
            onFocus={() => { if (!f4.work_phone) setF4({ ...f4, work_phone: '+7 ' }); }} />
        </div>
      </fieldset>

      <div className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
        <Icon name="ShieldCheck" size={16} className="mr-1.5 inline text-accent" />
        Ваши данные передаются по защищённому соединению и не передаются третьим лицам.
      </div>

      <Button type="submit" size="lg" disabled={codeSending}
        className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
        {codeSending ? (
          <span className="flex items-center gap-2">
            <Icon name="Loader2" size={18} className="animate-spin" />
            Отправляем код на почту...
          </span>
        ) : (
          <span className="flex items-center gap-2">Подтвердить email и продолжить <Icon name="ArrowRight" size={18} /></span>
        )}
      </Button>
    </form>
  );
};
