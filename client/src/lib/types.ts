export interface Expense {
  id: string;
  amount: number;
  category: string;
  note?: string;
  createdAt: number;
}

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Fun",
  "Other",
] as const;
