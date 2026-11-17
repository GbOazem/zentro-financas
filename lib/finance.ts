export type Kind = 'income' | 'expense';
export type Category = { id: string; user_id: string; name: string; type: Kind; color: string; created_at?: string };
export type Transaction = {
  id: string; user_id: string; title: string; amount_cents: number; type: Kind;
  category_id: string | null; due_date: string; paid: boolean; notes: string | null;
  salary_month?: string | null; group_id: string | null; installment_number: number | null; installment_count: number | null;
  created_at?: string;
};
export const DEFAULT_CATEGORIES: { name: string; type: Kind; color: string }[] = [
  { name: 'Alimentação', type: 'expense', color: '#f59e0b' },
  { name: 'Moradia', type: 'expense', color: '#818cf8' },
  { name: 'Transporte', type: 'expense', color: '#0ea5e9' },
  { name: 'Saúde', type: 'expense', color: '#f472b6' },
  { name: 'Lazer', type: 'expense', color: '#a78bfa' },
  { name: 'Educação', type: 'expense', color: '#14b8a6' },
  { name: 'Compras', type: 'expense', color: '#fb7185' },
  { name: 'Outros', type: 'expense', color: '#94a3b8' },
  { name: 'Salário', type: 'income', color: '#10b981' },
  { name: 'Freelance', type: 'income', color: '#38bdf8' },
  { name: 'Investimentos', type: 'income', color: '#a3e635' },
  { name: 'Outras receitas', type: 'income', color: '#94a3b8' },
];
export function currency(cents: number) { return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
export function parseMoney(text: string) {
  const normalized = text.trim().replace(/\s|R\$/g, '');
  if (!normalized || !/^[\d.,]+$/.test(normalized)) return NaN;
  const decimal = normalized.includes(',') ? normalized.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(normalized) ? normalized.replace(/\./g, '') : normalized;
  const numeric = Number(decimal);
  if (!Number.isFinite(numeric) || numeric <= 0 || !Number.isSafeInteger(Math.round(numeric * 100))) return NaN;
  return Math.round(numeric * 100);
}
export function formatInputMoney(cents: number) { return (cents / 100).toFixed(2).replace('.', ','); }
export function dateNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function monthNow() { return dateNow().slice(0,7); }
export function addMonths(date: string, steps: number) {
  const [year, month, day] = date.split('-').map(Number);
  const first = new Date(Date.UTC(year, month-1+steps, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth()+1, 0)).getUTCDate();
  const safeDay = Math.min(day, lastDay);
  return `${first.getUTCFullYear()}-${String(first.getUTCMonth()+1).padStart(2,'0')}-${String(safeDay).padStart(2,'0')}`;
}
export function monthLabel(month: string) {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m-1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
export function dateLabel(date: string) { const [y,m,d]=date.split('-'); return `${d}/${m}/${y}`; }
export function splitInstallments(totalCents: number, count: number) {
  const base = Math.floor(totalCents / count);
  return Array.from({length:count}, (_, index) => base + (index < totalCents % count ? 1 : 0));
}
