import { useState, useEffect } from "react";
import { Wallet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { getExpenses, addExpense, deleteExpense, restoreExpense } from "@/lib/storage";
import type { Expense } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";

const CURRENCY = "₹";

function formatMoney(n: number): string {
  return `${CURRENCY}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayLabel(day: number): string {
  const today = startOfDay(Date.now());
  if (day === today) return "Today";
  if (day === startOfDay(today - 1)) return "Yesterday";
  return new Date(day).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function Spending() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);

  useEffect(() => {
    setExpenses(getExpenses());
  }, []);

  const refresh = () => setExpenses(getExpenses());

  const parsedAmount = parseFloat(amount);
  const canAdd = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    addExpense(parsedAmount, category, note);
    setAmount("");
    setNote("");
    refresh();
  };

  const handleDelete = (expense: Expense) => {
    deleteExpense(expense.id);
    refresh();
    toast({
      title: `Removed ${formatMoney(expense.amount)}`,
      action: (
        <ToastAction altText="Undo" onClick={() => { restoreExpense(expense); refresh(); }}>
          Undo
        </ToastAction>
      ),
    });
  };

  const now = new Date();
  const todayStart = startOfDay(now.getTime());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const todayTotal = expenses.filter((e) => e.createdAt >= todayStart).reduce((s, e) => s + e.amount, 0);
  const monthExpenses = expenses.filter((e) => e.createdAt >= monthStart);
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = EXPENSE_CATEGORIES
    .map((c) => ({ name: c, total: monthExpenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Group the list by day (expenses are already newest first)
  const days: { day: number; items: Expense[] }[] = [];
  for (const e of expenses) {
    const day = startOfDay(e.createdAt);
    const last = days[days.length - 1];
    if (last && last.day === day) last.items.push(e);
    else days.push({ day, items: [e] });
  }

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" strokeWidth={2.25} />
            <h1 className="text-2xl font-bold tracking-tight">SimplySpending</h1>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-xl border border-card-border bg-card px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Today</p>
              <p className="text-lg font-bold tabular-nums" data-testid="text-today-total">{formatMoney(todayTotal)}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card px-3 py-2">
              <p className="text-[11px] text-muted-foreground">This month</p>
              <p className="text-lg font-bold tabular-nums" data-testid="text-month-total">{formatMoney(monthTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 py-4 flex flex-col gap-5">
        {/* Quick add */}
        <form
          className="rounded-xl border border-card-border bg-card p-3 flex flex-col gap-3"
          onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-muted-foreground">{CURRENCY}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/40"
              data-testid="input-expense-amount"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  category === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border/50"
                }`}
                data-testid={`chip-category-${c.toLowerCase()}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
              data-testid="input-expense-note"
            />
            <Button type="submit" disabled={!canAdd} data-testid="button-add-expense">
              Add
            </Button>
          </div>
        </form>

        {/* This month by category */}
        {byCategory.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              This month by category
            </h2>
            <div className="rounded-xl border border-card-border bg-card px-4 py-3 flex flex-col gap-2.5">
              {byCategory.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="font-medium tabular-nums">{formatMoney(c.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(c.total / monthTotal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold">No spending yet</p>
              <p className="text-sm text-muted-foreground mt-1">Type an amount above and tap Add</p>
            </div>
          </div>
        ) : (
          days.map(({ day, items }) => (
            <div key={day}>
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                <span>{dayLabel(day)}</span>
                <span className="tabular-nums">{formatMoney(items.reduce((s, e) => s + e.amount, 0))}</span>
              </div>
              <div className="rounded-xl border border-card-border bg-card overflow-hidden divide-y divide-border/50">
                {items.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3" data-testid={`row-expense-${e.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.note || e.category}</p>
                      {e.note && <p className="text-[11px] text-muted-foreground">{e.category}</p>}
                    </div>
                    <span className="font-semibold tabular-nums">{formatMoney(e.amount)}</span>
                    <button
                      onClick={() => handleDelete(e)}
                      className="p-1.5 -mr-1.5 rounded-md text-muted-foreground hover:text-destructive"
                      aria-label="Delete expense"
                      data-testid={`button-delete-expense-${e.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
