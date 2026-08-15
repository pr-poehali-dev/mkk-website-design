INSERT INTO site_settings (key, value, updated_at)
VALUES (
  'chat_widget_code',
  '<script>
    (function(){(function c(d,w,m,i) {
        window.supportAPIMethod = m;
        var s = d.createElement(''script'');
        s.id = ''supportScript''; 
        s.async = true;
        var id = ''93b7c5b45f4832f5fb54e47279160c3a'';
        s.src = (!i ? ''https://lcab.talk-me.ru/support/support.js'' : ''https://static.site-chat.me/support/support.int.js'') + ''?h='' + id;
        s.onerror = i ? undefined : function(){c(d,w,m,true)};
        w[m] = w[m] ? w[m] : function(){(w[m].q = w[m].q ? w[m].q : []).push(arguments);};
        (d.head ? d.head : d.body).appendChild(s);
    })(document,window,''TalkMe'')})();
</script>',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();