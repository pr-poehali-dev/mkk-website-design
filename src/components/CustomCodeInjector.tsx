import { useEffect } from 'react';
import { apiGetSiteSettings } from '@/lib/api';

const CONTAINER_ID = 'custom-widget-code-container';

const CustomCodeInjector = () => {
  useEffect(() => {
    apiGetSiteSettings().then((s) => {
      const code = s.chat_widget_code;
      if (!code) return;

      const container = document.createElement('div');
      container.id = CONTAINER_ID;
      container.innerHTML = code;
      document.body.appendChild(container);

      // Скрипты, вставленные через innerHTML, браузер не выполняет —
      // пересоздаём каждый <script>, чтобы код виджета реально запустился.
      const scripts = Array.from(container.querySelectorAll('script'));
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }).catch(() => {
      // не критично — просто не подключаем виджет
    });

    return () => {
      document.getElementById(CONTAINER_ID)?.remove();
    };
  }, []);

  return null;
};

export default CustomCodeInjector;
