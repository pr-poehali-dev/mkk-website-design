export interface CabinetArticle {
  id: string;
  title: string;
  image_url: string;
  text: string;
  link_url: string;
  link_text: string;
  visible: boolean;
}

export const DEFAULT_CABINET_ARTICLES: CabinetArticle[] = [
  {
    id: 'default-1',
    title: 'Выездной финансовый помощник',
    image_url: '',
    text: 'Наш специалист может приехать к вам, помочь собрать документы и оформить заявку на удобное для вас время.\n\nДля вызова специалиста свяжитесь с поддержкой.',
    link_url: '',
    link_text: '',
    visible: true,
  },
  {
    id: 'default-2',
    title: 'Перекредитование',
    image_url: '',
    text: 'Перекредитование помогает заменить действующие займы одним — на более выгодных условиях и с одним ежемесячным платежом.\n\nУзнайте у специалиста, подходит ли вам этот вариант.',
    link_url: '',
    link_text: '',
    visible: true,
  },
];

export function parseCabinetArticles(raw: string | undefined): CabinetArticle[] {
  if (raw === undefined || raw === '') return DEFAULT_CABINET_ARTICLES;
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return DEFAULT_CABINET_ARTICLES;
    return data.map((a, i) => ({
      id: String(a.id || `a-${i}`),
      title: String(a.title || ''),
      image_url: String(a.image_url || ''),
      text: String(a.text || ''),
      link_url: String(a.link_url || ''),
      link_text: String(a.link_text || ''),
      visible: a.visible !== false,
    }));
  } catch {
    return DEFAULT_CABINET_ARTICLES;
  }
}
