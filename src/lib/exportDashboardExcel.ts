import * as XLSX from 'xlsx';
import type { UserSession } from '@/lib/api';
import type { DashboardStats } from '@/lib/api';
import type { StatusKey } from '@/lib/loanStore';

interface StatusStat {
  key: StatusKey;
  label: string;
  count: number;
}

const fmtDate = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU');
};

export function exportDashboardExcel(
  requests: UserSession[],
  statusStats: StatusStat[],
  dashboardStats: DashboardStats | null,
) {
  const wb = XLSX.utils.book_new();

  const summaryRows: (string | number)[][] = [
    ['Статистика по заявкам'],
    [],
    ['Статус', 'Количество заявок'],
    ...statusStats.map((s) => [s.label, s.count]),
    ['Всего заявок', requests.length],
    [],
    ['Суммы за текущий месяц'],
    [],
    ['Показатель', 'Сумма (₽)', 'Количество'],
    ['Выдано займов', dashboardStats?.issued_sum ?? 0, dashboardStats?.issued_count ?? 0],
    ['Погашено займов', dashboardStats?.repaid_sum ?? 0, dashboardStats?.repaid_count ?? 0],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Статистика');

  const requestsRows = requests.map((r) => ({
    'Номер заявки': r.ref_number,
    'ФИО': r.full_name,
    'Телефон': r.phone,
    'Статус': r.status,
    'Сумма займа': r.amount,
    'Срок (дней)': r.days,
    'Дата создания': fmtDate(r.created_at),
    'Дата выдачи': fmtDate(r.money_sent_at),
    'Заблокирован': r.is_blocked ? 'Да' : 'Нет',
  }));
  const requestsSheet = XLSX.utils.json_to_sheet(requestsRows);
  requestsSheet['!cols'] = [
    { wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 16 },
    { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, requestsSheet, 'Заявки');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `статистика-${today}.xlsx`);
}
