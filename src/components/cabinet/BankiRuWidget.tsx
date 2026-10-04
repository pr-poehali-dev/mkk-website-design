import { useEffect, useRef } from 'react';

const CONFIG = {
  type: 'mpcard',
  width: '100%',
  height: '1200px',
  source: 'afl_admon_24_web-3224_of-mpcardwid_st-5kgq2',
};

const BankiRuWidget = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const script = document.createElement('script');
    script.id = 'bankiru_mpcard_anketa_widget';
    script.src = 'https://www.banki.ru/static/web-card/build/affiliateWidget.js';
    script.setAttribute('data-config', JSON.stringify(CONFIG));
    container.appendChild(script);
    return () => {
      container.innerHTML = '';
    };
  }, []);

  return <div ref={ref} className="w-full" />;
};

export default BankiRuWidget;
