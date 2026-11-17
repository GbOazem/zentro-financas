import { addMonths, type Transaction } from './finance';

export type SalaryPlan = {
  id: string;
  user_id: string;
  effective_month: string;
  amount_cents: number;
  payment_day: number;
  enabled: boolean;
};

export function salaryForMonth(plans: SalaryPlan[], month: string): SalaryPlan | null {
  return [...plans]
    .filter(p => p.effective_month.slice(0, 7) <= month)
    .sort((a, b) => b.effective_month.localeCompare(a.effective_month))[0] ?? null;
}

export function salaryDate(month: string, day: number) {
  return addMonths(`${month}-01`, 0).slice(0, 8) +
    String(Math.min(day, new Date(Date.UTC(Number(month.slice(0,4)), Number(month.slice(5,7)), 0)).getUTCDate())).padStart(2, '0');
}

// O salário previsto só aparece virtualmente; ao marcar "Recebido", é salvo como
// transação real com salary_month único. Isso evita duplicações após refresh.
export function virtualSalary(plans: SalaryPlan[], transactions: Transaction[], month: string, userId: string): Transaction | null {
  const plan = salaryForMonth(plans, month);
  if (!plan?.enabled || transactions.some(t => t.salary_month === `${month}-01`)) return null;
  return {
    id: `salary-preview:${month}`, user_id: userId, title: 'Salário mensal',
    amount_cents: plan.amount_cents, type: 'income', category_id: null,
    due_date: salaryDate(month, plan.payment_day), paid: false,
    notes: 'Previsão automática; confirme quando receber.', group_id: null,
    installment_number: null, installment_count: null, salary_month: `${month}-01`
  };
}
