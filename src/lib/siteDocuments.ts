export interface SiteDocument {
  id: string;
  group: string;
  title: string;
  url: string;
  visible: boolean;
}

const mk = (i: number, group: string, title: string): SiteDocument => ({ id: `d-${i}`, group, title, url: '', visible: true });

export const DEFAULT_SITE_DOCUMENTS: SiteDocument[] = [
  mk(1, 'Документы компании', 'Информация о компании'),
  mk(2, 'Документы компании', 'Общие условия договора займа'),
  mk(3, 'Документы компании', 'Политика обработки персональных данных'),
  mk(4, 'Документы компании', 'Правила предоставления микрозаймов'),
  mk(5, 'Документы компании', 'Выписка из государственного реестра микрофинансовых организаций'),
  mk(6, 'Прочее', 'Информация для лиц, пострадавших от мошенничества'),
  mk(7, 'Прочее', 'Информация о привлечении третьих лиц'),
  mk(8, 'Прочее', 'Порядок оспаривания сведений кредитной истории'),
];

export function parseSiteDocuments(raw: string | undefined): SiteDocument[] {
  if (raw === undefined || raw === '') return DEFAULT_SITE_DOCUMENTS;
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return DEFAULT_SITE_DOCUMENTS;
    return data.map((d, i) => ({
      id: String(d.id || `d-${i}`),
      group: String(d.group || ''),
      title: String(d.title || ''),
      url: String(d.url || ''),
      visible: d.visible !== false,
    }));
  } catch {
    return DEFAULT_SITE_DOCUMENTS;
  }
}
