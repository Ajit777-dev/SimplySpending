import { nanoid } from "nanoid";
import type { Expense } from "./types";

const KEY = "simplyspending_expenses";

function load(): Expense[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Expense[];
  } catch {
    return [];
  }
}

function save(data: Expense[]): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getExpenses(): Expense[] {
  return load().sort((a, b) => b.createdAt - a.createdAt);
}

export function addExpense(amount: number, category: string, note?: string): Expense {
  const expenses = load();
  const expense: Expense = {
    id: nanoid(),
    amount,
    category,
    note: note?.trim() || undefined,
    createdAt: Date.now(),
  };
  expenses.push(expense);
  save(expenses);
  return expense;
}

export function restoreExpense(expense: Expense): void {
  const expenses = load();
  expenses.push(expense);
  save(expenses);
}

export function deleteExpense(id: string): void {
  save(load().filter((e) => e.id !== id));
}
