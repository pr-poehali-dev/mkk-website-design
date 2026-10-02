export interface Bank {
  name: string;
  short: string;
  color: string;
  text?: string;
}

export const BANKS: Bank[] = [
  { name: 'Сбербанк', short: '✓', color: '#21A038' },
  { name: 'Т-Банк', short: 'Т', color: '#FFDD2D', text: '#1F1F1F' },
  { name: 'Банк ВТБ', short: 'ВТБ', color: '#0A2896' },
  { name: 'Альфа-Банк', short: 'А', color: '#EF3124' },
  { name: 'Газпромбанк', short: 'ГПБ', color: '#1B4F9C' },
  { name: 'Россельхозбанк', short: 'РСХБ', color: '#0B7A3E' },
  { name: 'Почта Банк', short: 'ПБ', color: '#0055A5' },
  { name: 'Совкомбанк', short: 'СКБ', color: '#E8501C' },
  { name: 'Банк Открытие', short: 'О', color: '#00B2E3' },
  { name: 'Райффайзенбанк', short: 'R', color: '#FEE600', text: '#1F1F1F' },
  { name: 'Промсвязьбанк', short: 'ПСБ', color: '#E2231A' },
  { name: 'Росбанк', short: 'Р', color: '#D6001C' },
  { name: 'Яндекс Банк', short: 'Я', color: '#FC3F1D' },
  { name: 'Озон Банк', short: 'О', color: '#005BFF' },
  { name: 'МТС Банк', short: 'МТС', color: '#E30611' },
  { name: 'Дом.РФ', short: 'ДР', color: '#2E7D32' },
  { name: 'Россия', short: 'РУ', color: '#1C3F94' },
  { name: 'Банк Санкт-Петербург', short: 'БСП', color: '#B71C1C' },
  { name: 'Банк Левобережный', short: 'Л', color: '#00796B' },
  { name: 'Ак Барс Банк', short: 'АБ', color: '#00843D' },
  { name: 'Банк Хоум Кредит', short: 'HC', color: '#E4002B' },
  { name: 'Уралсиб', short: 'У', color: '#00A0DF' },
  { name: 'МКБ', short: 'МКБ', color: '#C8102E' },
  { name: 'Банк Синара', short: 'С', color: '#0072CE' },
  { name: 'Ренессанс Кредит', short: 'РК', color: '#F58220' },
  { name: 'Русский Стандарт', short: 'РС', color: '#6C1D45' },
  { name: 'Авангард', short: 'АВ', color: '#003D7C' },
  { name: 'Банк Зенит', short: 'З', color: '#00A9CE' },
  { name: 'Банк Хлынов', short: 'Х', color: '#E30613' },
  { name: 'Банк Уралфинанс', short: 'УФ', color: '#2B3990' },
  { name: 'Таврический', short: 'Т', color: '#1B6EC2' },
  { name: 'Банк Авито', short: 'Ав', color: '#00AAFF' },
  { name: 'Банк Точка', short: 'Тч', color: '#6F2DBD' },
  { name: 'Банк Тинькофф Бизнес', short: 'ТБ', color: '#FFDD2D', text: '#1F1F1F' },
  { name: 'Модульбанк', short: 'М', color: '#00B894' },
  { name: 'Банк Русский Стандарт', short: 'РС', color: '#8E2A5B' },
  { name: 'Экспобанк', short: 'Э', color: '#C4161C' },
  { name: 'Абсолют Банк', short: 'АБ', color: '#E31E24' },
  { name: 'Банк Траст', short: 'Тр', color: '#1D4ED8' },
  { name: 'Юни Кредит Банк', short: 'UC', color: '#E2001A' },
  { name: 'Банк Центр-инвест', short: 'ЦИ', color: '#0B5CAD' },
  { name: 'Банк Кубань Кредит', short: 'КК', color: '#2E7D32' },
  { name: 'Банк Приморье', short: 'П', color: '#0057B8' },
  { name: 'Банк Возрождение', short: 'В', color: '#9C1C2C' },
  { name: 'СДМ-Банк', short: 'СДМ', color: '#E6007E' },
  { name: 'Банк Ланта', short: 'Л', color: '#F39200' },
  { name: 'Другой банк', short: '₽', color: '#64748B' },
];

const ALIASES: Record<string, string> = {
  'Тинькофф': 'Т-Банк',
  'ВТБ': 'Банк ВТБ',
  'Открытие': 'Банк Открытие',
};

export const findBank = (name?: string | null): Bank | undefined => {
  if (!name) return undefined;
  const key = ALIASES[name] || name;
  return BANKS.find((b) => b.name === key);
};

export const normalizeBankName = (name?: string | null): string | null => {
  if (!name) return null;
  return ALIASES[name] || name;
};
