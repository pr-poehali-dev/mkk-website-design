export function formatPhone(raw: string): string {
  let v = raw.replace(/\D/g, '');
  if (v.startsWith('8')) v = '7' + v.slice(1);
  if (!v.startsWith('7')) v = '7' + v;
  v = v.slice(0, 11);
  const d = v.slice(1);
  let result = '+7';
  if (d.length > 0) result += ' (' + d.slice(0, 3);
  if (d.length >= 3) result += ') ' + d.slice(3, 6);
  if (d.length >= 6) result += '-' + d.slice(6, 8);
  if (d.length >= 8) result += '-' + d.slice(8, 10);
  return result;
}
