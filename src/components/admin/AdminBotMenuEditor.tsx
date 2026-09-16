import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import {
  apiGetBotMenuConfig, apiSaveBotMenuConfig, type BotMenuItem, type BotMenuConfig,
} from '@/lib/api';

const DEFAULT_GREETING = 'Здравствуйте! 👋';

const DEFAULT_ITEMS: BotMenuItem[] = [
  { id: 'status', emoji: '📋', label: 'Узнать статус заявки', type: 'status' },
  { id: 'operator', emoji: '🙋', label: 'Позвать оператора', type: 'operator' },
  {
    id: 'terms', emoji: '📄', label: 'Условия займа', type: 'text',
    text: 'Сумма займа: от 1 000 до 100 000 ₽\nСрок: от 7 до 30 дней\nСтавка: 0,8% в день\n'
      + 'Первый займ до 30 000 ₽ доступен без переплаты для новых клиентов.',
  },
  {
    id: 'change_phone', emoji: '📱', label: 'Как сменить номер', type: 'operator',
    prefix: 'По вопросу смены номера телефона подключаю оператора. ',
  },
  { id: 'appeal', emoji: '📝', label: 'Оставить обращение', type: 'appeal',
    text: 'Вы можете оставить обращение через специальную форму на сайте.\n/appeal' },
  {
    id: 'insurance', emoji: '🛡', label: 'Вернуть страховку', type: 'text',
    text: 'Для возврата страховки по займу вам надо написать нам на почту 📩 мы ответим вам в рабочее '
      + 'время до 12 рабочих дней с момента получения вашего обращения.',
  },
  { id: 'other', emoji: '❓', label: 'Другой вопрос', type: 'operator', prefix: 'Опишите ваш вопрос — ' },
];

const TYPE_LABELS: Record<BotMenuItem['type'], string> = {
  status: 'Проверка статуса заявки (по телефону и паспорту)',
  operator: 'Передать оператору',
  text: 'Ответ текстом',
  appeal: 'Ответ текстом + ссылка на форму обращения',
};

const genId = () => `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const AdminBotMenuEditor = () => {
  const [greeting, setGreeting] = useState(DEFAULT_GREETING);
  const [items, setItems] = useState<BotMenuItem[]>(DEFAULT_ITEMS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiGetBotMenuConfig().then((cfg) => {
      if (cfg) {
        setGreeting(cfg.greeting || DEFAULT_GREETING);
        setItems(cfg.items?.length ? cfg.items : DEFAULT_ITEMS);
      }
      setLoaded(true);
    });
  }, []);

  const updateItem = (id: string, patch: Partial<BotMenuItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    setSaved(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setSaved(false);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setSaved(false);
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id: genId(), emoji: '💬', label: 'Новый пункт', type: 'text', text: '' }]);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config: BotMenuConfig = { greeting: greeting.trim() || DEFAULT_GREETING, items };
      await apiSaveBotMenuConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="mt-4 flex items-center justify-center rounded-2xl border border-border bg-card p-8">
        <Icon name="Loader2" size={22} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <Icon name="Bot" size={18} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-primary">Приветствие и меню чат-бота</p>
          <p className="mb-3 text-sm text-muted-foreground">
            Текст, который клиент видит при открытии чата, и кнопки быстрых ответов бота
          </p>

          <label className="mb-1 block text-xs font-medium text-muted-foreground">Приветственная фраза</label>
          <input
            type="text"
            value={greeting}
            onChange={(e) => { setGreeting(e.target.value); setSaved(false); }}
            placeholder="Здравствуйте! 👋"
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />

          <p className="mb-2 text-xs font-medium text-muted-foreground">Кнопки меню (в этом порядке появятся у клиента)</p>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" disabled={idx === 0} onClick={() => moveItem(idx, -1)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-secondary disabled:opacity-30">
                      <Icon name="ChevronUp" size={14} />
                    </button>
                    <button type="button" disabled={idx === items.length - 1} onClick={() => moveItem(idx, 1)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-secondary disabled:opacity-30">
                      <Icon name="ChevronDown" size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.emoji}
                    onChange={(e) => updateItem(item.id, { emoji: e.target.value })}
                    className="w-12 shrink-0 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm"
                    maxLength={4}
                  />
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                    placeholder="Текст кнопки"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <select
                    value={item.type}
                    onChange={(e) => updateItem(item.id, { type: e.target.value as BotMenuItem['type'] })}
                    className="shrink-0 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <option value="status">Статус заявки</option>
                    <option value="operator">Оператор</option>
                    <option value="text">Текст</option>
                    <option value="appeal">Текст + /appeal</option>
                  </select>
                  <button type="button" onClick={() => removeItem(item.id)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600">
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>

                <p className="mt-1.5 pl-[74px] text-[11px] text-muted-foreground">{TYPE_LABELS[item.type]}</p>

                {item.type === 'operator' && (
                  <div className="mt-2 pl-[74px]">
                    <input
                      type="text"
                      value={item.prefix || ''}
                      onChange={(e) => updateItem(item.id, { prefix: e.target.value })}
                      placeholder="Текст перед сообщением оператора (необязательно)"
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                )}

                {(item.type === 'text' || item.type === 'appeal') && (
                  <div className="mt-2 pl-[74px]">
                    <Textarea
                      value={item.text || ''}
                      onChange={(e) => updateItem(item.id, { text: e.target.value })}
                      placeholder={item.type === 'appeal' ? 'Текст ответа. Вставьте /appeal, чтобы дать ссылку на форму обращения' : 'Текст ответа бота'}
                      className="min-h-[70px] text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <Button type="button" size="sm" variant="outline" onClick={addItem}>
              <Icon name="Plus" size={14} className="mr-1.5" /> Добавить пункт
            </Button>
            <Button size="sm" disabled={saving} onClick={handleSave}>
              {saving
                ? <Icon name="Loader2" size={14} className="animate-spin" />
                : saved
                  ? <Icon name="Check" size={14} className="text-green-300" />
                  : <Icon name="Save" size={14} />}
              <span className="ml-1.5">Сохранить</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBotMenuEditor;
