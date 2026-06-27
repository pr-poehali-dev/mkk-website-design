import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const COOKIE_KEY = 'cookie_consent';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4">
      <div className="rounded-2xl bg-primary text-primary-foreground shadow-2xl p-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3 flex-1">
          <Icon name="Cookie" size={22} className="shrink-0 mt-0.5 text-accent" />
          <p className="text-sm leading-relaxed">
            Мы используем файлы cookie для улучшения работы сайта. Продолжая пользоваться сайтом, вы соглашаетесь с{' '}
            <span className="underline underline-offset-2 cursor-pointer opacity-80">политикой конфиденциальности</span>.
          </p>
        </div>
        <Button
          size="sm"
          onClick={accept}
          className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-5">
          Принять
        </Button>
      </div>
    </div>
  );
};

export default CookieBanner;
