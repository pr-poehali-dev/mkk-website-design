import { useEffect } from 'react';
import { apiGetSiteSettings } from '@/lib/api';

const ChatWidget = () => {
  useEffect(() => {
    apiGetSiteSettings().then((s) => {
      const code = s.chat_widget_code;
      if (!code) return;
      const container = document.createElement('div');
      container.id = 'chat-widget-container';
      container.innerHTML = code;
      document.body.appendChild(container);
      container.querySelectorAll('script').forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
        newScript.text = oldScript.text;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }).catch(() => {});
  }, []);

  return null;
};

export default ChatWidget;
