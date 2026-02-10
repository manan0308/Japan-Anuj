import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, Plus, Trash2, History } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import api from "@/lib/api";

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];
const DEFAULT_EXPENSE_CATS = ["food", "transport", "shopping", "experience", "accommodation"];
const CAT_COLORS = {
  food: "#f97316",
  transport: "#a855f7",
  shopping: "#ec4899",
  experience: "#eab308",
  accommodation: "#10b981",
};

export default function CurrencyTab({ settings }) {
  const [jpyAmount, setJpyAmount] = useState("");
  const [inrResult, setInrResult] = useState("");
  const [rate, setRate] = useState(settings?.exchange_rate || 0.56);
  const [expenses, setExpenses] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [expForm, setExpForm] = useState({ amount_jpy: "", category: "food", note: "", date: new Date().toISOString().split("T")[0] });
  const [showHistory, setShowHistory] = useState(false);
  const [customCats, setCustomCats] = useState([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  useEffect(() => {
    if (settings?.exchange_rate) setRate(settings.exchange_rate);
  }, [settings]);

  const fetchData = useCallback(async () => {
    try {
      const [exp, conv] = await Promise.all([
        api.getExpenses(),
        api.getConversions(),
      ]);
      setExpenses(exp);
      setConversions(conv);
      // Derive custom categories from existing expenses
      const existing = exp
        .map((e) => e.category)
        .filter((c) => !DEFAULT_EXPENSE_CATS.includes(c));
      setCustomCats((prev) => [...new Set([...prev, ...existing])]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const convert = (jpy) => {
    const val = parseFloat(jpy);
    if (isNaN(val)) {
      setInrResult("");
      return;
    }
    const inr = val * rate;
    setInrResult(inr.toFixed(2));
    // Save conversion
    api.createConversion({ from_amount: val, to_amount: inr, rate }).catch(console.error);
    fetchData();
  };

  const handleQuickConvert = (amount) => {
    setJpyAmount(String(amount));
    const inr = amount * rate;
    setInrResult(inr.toFixed(2));
    api.createConversion({ from_amount: amount, to_amount: inr, rate }).catch(console.error);
    fetchData();
  };

  const handleAddExpense = async () => {
    const amount = parseFloat(expForm.amount_jpy);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await api.createExpense({
        amount_jpy: amount,
        category: expForm.category,
        note: expForm.note,
        date: expForm.date,
      });
      toast.success("Expense logged");
      setExpForm({ ...expForm, amount_jpy: "", note: "" });
      fetchData();
    } catch (e) {
      toast.error("Failed to add expense");
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.deleteExpense(id);
      toast.success("Expense deleted");
      fetchData();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const addCustomCategory = () => {
    const cat = newCatInput.trim().toLowerCase();
    if (!cat) return;
    if (DEFAULT_EXPENSE_CATS.includes(cat) || customCats.includes(cat)) {
      toast.error("Category already exists");
      return;
    }
    setCustomCats((prev) => [...prev, cat]);
    setExpForm({ ...expForm, category: cat });
    setNewCatInput("");
    setShowAddCat(false);
    toast.success(`Category "${cat}" added`);
  };

  const allCategories = [...DEFAULT_EXPENSE_CATS, ...customCats];

  // Calculate totals
  const totalJpy = expenses.reduce((sum, e) => sum + e.amount_jpy, 0);
  const totalInr = totalJpy * rate;

  // Chart data
  const chartData = allCategories.map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    key: cat,
    amount: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount_jpy, 0),
  })).filter((d) => d.amount > 0);

  return (
    <div className="p-4 space-y-4" data-testid="currency-tab">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Currency</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rate: 1 JPY = {rate} INR
        </p>
      </div>

      {/* Converter */}
      <Card className="rounded-2xl border-border/50" data-testid="converter-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">JPY</label>
              <Input
                type="number"
                placeholder="0"
                value={jpyAmount}
                onChange={(e) => {
                  setJpyAmount(e.target.value);
                  const val = parseFloat(e.target.value);
                  setInrResult(isNaN(val) ? "" : (val * rate).toFixed(2));
                }}
                className="rounded-xl text-xl font-bold h-12 mt-1"
                data-testid="jpy-input"
              />
            </div>
            <ArrowLeftRight size={20} className="text-muted-foreground shrink-0 mt-5" />
            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">INR</label>
              <div className="h-12 mt-1 flex items-center px-3 rounded-xl bg-muted text-xl font-bold" data-testid="inr-result">
                {inrResult || "0"}
              </div>
            </div>
          </div>

          {/* Quick Convert */}
          <div className="flex gap-2 flex-wrap">
            {QUICK_AMOUNTS.map((amt) => (
              <Button
                key={amt}
                variant="outline"
                size="sm"
                className="rounded-full text-xs font-semibold"
                onClick={() => handleQuickConvert(amt)}
                data-testid={`quick-${amt}-btn`}
              >
                ¥{amt.toLocaleString()}
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setShowHistory(!showHistory)}
            data-testid="history-toggle-btn"
          >
            <History size={14} className="mr-1" />
            {showHistory ? "Hide" : "Show"} History
          </Button>

          {showHistory && conversions.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto animate-fade-in">
              {conversions.slice(0, 10).map((c) => (
                <div key={c.id} className="flex justify-between text-xs text-muted-foreground py-1 border-b border-border/30">
                  <span>¥{c.from_amount.toLocaleString()}</span>
                  <span>₹{c.to_amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Logger */}
      <Card className="rounded-2xl border-border/50" data-testid="expense-logger">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Log Expense
          </h3>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Amount (JPY)"
              value={expForm.amount_jpy}
              onChange={(e) => setExpForm({ ...expForm, amount_jpy: e.target.value })}
              className="rounded-xl flex-1"
              data-testid="expense-amount-input"
            />
            <div className="relative">
              <Select
                value={expForm.category}
                onValueChange={(v) => {
                  if (v === "__add_new__") {
                    setShowAddCat(true);
                  } else {
                    setExpForm({ ...expForm, category: v });
                  }
                }}
              >
                <SelectTrigger className="rounded-xl w-36" data-testid="expense-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                  <SelectItem value="__add_new__">
                    <span className="flex items-center gap-1 text-primary">
                      <Plus size={12} /> Add New
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {showAddCat && (
            <div className="flex gap-2 animate-fade-in">
              <Input
                placeholder="New category name"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomCategory()}
                className="rounded-xl flex-1 text-sm h-9"
                data-testid="new-category-input"
                autoFocus
              />
              <Button
                size="sm"
                className="rounded-full h-9"
                onClick={addCustomCategory}
                data-testid="add-category-btn"
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full h-9"
                onClick={() => { setShowAddCat(false); setNewCatInput(""); }}
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Note (optional)"
              value={expForm.note}
              onChange={(e) => setExpForm({ ...expForm, note: e.target.value })}
              className="rounded-xl flex-1"
              data-testid="expense-note-input"
            />
            <Button
              size="icon"
              className="rounded-full shrink-0"
              onClick={handleAddExpense}
              data-testid="add-expense-btn"
            >
              <Plus size={18} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trip Totals */}
      <Card className="rounded-2xl border-border/50 bg-primary/5" data-testid="expense-totals">
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Trip Total
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">¥{totalJpy.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Japanese Yen</p>
            </div>
            <div>
              <p className="text-2xl font-bold">₹{totalInr.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Indian Rupees</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spending Chart */}
      {chartData.length > 0 && (
        <Card className="rounded-2xl border-border/50" data-testid="spending-chart">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
              Spending by Category
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(val) => [`¥${val.toLocaleString()}`, "Amount"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={CAT_COLORS[entry.key] || "#888"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      {expenses.length > 0 && (
        <div data-testid="expense-list">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Recent Expenses
          </h3>
          <div className="space-y-1">
            {expenses.slice(0, 20).map((exp) => (
              <Card key={exp.id} className="rounded-xl border-border/40">
                <CardContent className="p-2.5 flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CAT_COLORS[exp.category] || "#888" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">
                        ¥{exp.amount_jpy.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ₹{(exp.amount_jpy * rate).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {exp.category} {exp.note ? `· ${exp.note}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                    data-testid={`delete-expense-${exp.id}`}
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
