"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FiTarget,
  FiPlus,
  FiX,
  FiLoader,
  FiAlertCircle,
  FiEdit2,
  FiTrash2,
  FiCopy,
} from "react-icons/fi";
import supabase from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { useAuth } from "./AuthProvider";

type Budget = {
  id: string;
  user_id: string;
  category_id: string | null;
  month: string;
  limit_amount: number;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  color?: string;
};

type Transaction = {
  id: string;
  amount: number;
  type: string;
  category: string;
  description?: string;
  status?: string;
  competence_date?: string;
  due_date?: string;
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function BudgetManager() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);

  // Form
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [budgetScope, setBudgetScope] = useState<"single" | "full_year" | "from_month">("single");

  // View month
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [budgetRes, catRes, txRes] = await Promise.all([
      supabase.from("budgets").select("*").eq("user_id", user.id),
      supabase
        .from("categories")
        .select("id, name, type, parent_id, color")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order("name"),
      supabase
        .from("transactions")
        .select("id, amount, type, category, description, status, competence_date, due_date")
        .eq("user_id", user.id),
    ]);
    setBudgets(budgetRes.data || []);
    setCategories(catRes.data || []);
    setTransactions(txRes.data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "despesa" && !c.parent_id),
    [categories],
  );

  // Build a map: category_id → parent_id (or itself if it's a parent)
  const childToParent = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories) {
      // If subcategory, map to parent; if parent, map to itself
      map.set(cat.id, cat.parent_id || cat.id);
    }
    return map;
  }, [categories]);

  // Calculate spent per PARENT category for the view month
  // Only counts PAID transactions by due_date (what was actually spent)
  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    const monthTxs = transactions.filter((tx) => {
      if (tx.type !== "saida") return false;
      if (tx.status !== "Pago") return false;
      const d = tx.due_date || "";
      return d.startsWith(viewMonth);
    });
    for (const tx of monthTxs) {
      if (!tx.category) continue;
      // Resolve to parent category (rolls up subcategories)
      const parentId = childToParent.get(tx.category) || tx.category;
      map.set(parentId, (map.get(parentId) || 0) + Math.abs(tx.amount));
    }
    return map;
  }, [transactions, viewMonth, childToParent]);

  // Group paid transactions by parent category for detail view
  const txsByParentCategory = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    const monthTxs = transactions.filter((tx) => {
      if (tx.type !== "saida") return false;
      if (tx.status !== "Pago") return false;
      const d = tx.due_date || "";
      return d.startsWith(viewMonth);
    });
    for (const tx of monthTxs) {
      if (!tx.category) continue;
      const parentId = childToParent.get(tx.category) || tx.category;
      const arr = map.get(parentId) || [];
      arr.push(tx);
      map.set(parentId, arr);
    }
    return map;
  }, [transactions, viewMonth, childToParent]);

  const getCatNameById = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || "—";

  const monthBudgets = useMemo(
    () => budgets.filter((b) => b.month === viewMonth),
    [budgets, viewMonth],
  );

  const totalBudget = monthBudgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = monthBudgets.reduce(
    (s, b) => s + (spentByCategory.get(b.category_id || "") || 0),
    0,
  );

  function openModal(budget?: Budget) {
    if (budget) {
      setEditingBudget(budget);
      setSelectedCategory(budget.category_id || "");
      setLimitAmount(String(budget.limit_amount));
      setSelectedMonth(budget.month);
      setBudgetScope("single");
    } else {
      setEditingBudget(null);
      setSelectedCategory("");
      setLimitAmount("");
      setSelectedMonth(viewMonth);
      setBudgetScope("single");
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingBudget(null);
    setSelectedCategory("");
    setLimitAmount("");
  }

  function getMonthsForScope(): string[] {
    const [year, month] = selectedMonth.split("-").map(Number);
    if (budgetScope === "single") return [selectedMonth];
    if (budgetScope === "full_year") {
      return Array.from({ length: 12 }, (_, i) =>
        `${year}-${String(i + 1).padStart(2, "0")}`
      );
    }
    // from_month: from selected month to december
    return Array.from({ length: 12 - month + 1 }, (_, i) =>
      `${year}-${String(month + i).padStart(2, "0")}`
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory || !limitAmount || !user?.id) return;

    const amount = Number(limitAmount);
    if (amount <= 0) return;

    try {
      if (editingBudget) {
        const { error } = await supabase
          .from("budgets")
          .update({
            category_id: selectedCategory,
            limit_amount: amount,
            month: selectedMonth,
          })
          .eq("id", editingBudget.id);
        if (error) throw error;
        toast.success("Orçamento atualizado!");
      } else {
        const months = getMonthsForScope();
        const rows = months.map((m) => ({
          user_id: user.id,
          category_id: selectedCategory,
          month: m,
          limit_amount: amount,
        }));
        const { error } = await supabase
          .from("budgets")
          .upsert(rows, { onConflict: "user_id,category_id,month" });
        if (error) throw error;
        const label = months.length > 1 ? `Orçamento criado para ${months.length} meses!` : "Orçamento criado!";
        toast.success(label);
      }
      closeModal();
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(msg);
    }
  }

  async function handleCopyToNextMonth() {
    if (!user?.id || monthBudgets.length === 0) return;
    const nextDate = new Date(vYear, vMonthNum, 1);
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    const rows = monthBudgets.map((b) => ({
      user_id: user.id,
      category_id: b.category_id,
      month: nextMonth,
      limit_amount: b.limit_amount,
    }));
    try {
      const { error } = await supabase
        .from("budgets")
        .upsert(rows, { onConflict: "user_id,category_id,month" });
      if (error) throw error;
      const nextLabel = `${MONTHS[nextDate.getMonth()]} ${nextDate.getFullYear()}`;
      toast.success(`Orçamentos copiados para ${nextLabel}!`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao copiar";
      toast.error(msg);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
      toast.success("Orçamento removido!");
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir";
      toast.error(msg);
    }
  }

  const getCatName = (catId: string | null) => {
    if (!catId) return "Geral";
    return categories.find((c) => c.id === catId)?.name || "—";
  };

  const getCatColor = (catId: string | null) => {
    if (!catId) return "#64748b";
    return categories.find((c) => c.id === catId)?.color || "#64748b";
  };

  // Parse viewMonth for display
  const [vYear, vMonthNum] = viewMonth.split("-").map(Number);
  const viewLabel = `${MONTHS[vMonthNum - 1]} ${vYear}`;

  function shiftMonth(delta: number) {
    const d = new Date(vYear, vMonthNum - 1 + delta, 1);
    setViewMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <FiLoader className="animate-spin mb-4" size={32} />
        <p className="font-bold text-sm uppercase tracking-widest italic">
          Carregando orçamentos...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header com navegação de mês */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
          >
            ‹
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight min-w-45 text-center">
            {viewLabel}
          </h2>
          <button
            onClick={() => shiftMonth(1)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
          >
            ›
          </button>
        </div>
        <div className="flex items-center gap-2">
          {monthBudgets.length > 0 && (
            <button
              onClick={handleCopyToNextMonth}
              className="flex items-center gap-2 px-4 py-3 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-2xl font-black text-sm transition-all active:scale-95"
              title="Copiar orçamentos para o próximo mês"
            >
              <FiCopy size={16} /> <span className="hidden sm:inline">Copiar Mês</span>
            </button>
          )}
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            <FiPlus size={18} /> Novo Orçamento
          </button>
        </div>
      </div>

      {/* Resumo geral */}
      {monthBudgets.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Total do Mês
            </span>
            <span className="text-sm font-black text-slate-900">
              {fmt(totalSpent)} / {fmt(totalBudget)}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalSpent / totalBudget > 0.9
                  ? "bg-red-500"
                  : totalSpent / totalBudget > 0.7
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{
                width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs font-bold text-slate-400 mt-2">
            {totalBudget - totalSpent > 0
              ? `${fmt(totalBudget - totalSpent)} restantes`
              : `${fmt(totalSpent - totalBudget)} acima do orçamento`}
          </p>
        </div>
      )}

      {/* Grid de orçamentos */}
      {monthBudgets.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="inline-flex p-4 bg-slate-50 rounded-2xl mb-4">
            <FiTarget className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-400 mb-2">
            Nenhum orçamento para {viewLabel}
          </h3>
          <p className="text-sm text-slate-400 font-medium mb-6">
            Defina limites de gastos por categoria para ter controle total.
          </p>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all active:scale-95"
          >
            Criar Primeiro Orçamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {monthBudgets.map((budget) => {
            const spent = spentByCategory.get(budget.category_id || "") || 0;
            const pct =
              budget.limit_amount > 0 ? spent / budget.limit_amount : 0;
            const isOver = pct > 1;
            const isWarning = pct > 0.7 && !isOver;

            return (
              <div
                key={budget.id}
                onClick={() => setDetailBudget(budget)}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: getCatColor(budget.category_id) + "22",
                      }}
                    >
                      <FiTarget
                        size={18}
                        style={{ color: getCatColor(budget.category_id) }}
                      />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        {getCatName(budget.category_id)}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isOver
                          ? "Estourado"
                          : isWarning
                            ? "Atenção"
                            : "No controle"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(budget); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(budget.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-slate-900">
                      {fmt(spent)}
                    </span>
                    <span className="text-sm font-bold text-slate-400">
                      / {fmt(budget.limit_amount)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? "bg-red-500"
                          : isWarning
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(pct * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {Math.round(pct * 100)}% usado
                    </span>
                    {isOver && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-red-500">
                        <FiAlertCircle size={10} />+{" "}
                        {fmt(spent - budget.limit_amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl sm:rounded-4xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-tight italic">
                {editingBudget ? "Editar Orçamento" : "Novo Orçamento"}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="category"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1"
                >
                  Categoria
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl py-3 px-4 font-bold text-slate-900 transition-all outline-none"
                  required
                >
                  <option value="">Selecione...</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="limitAmount"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1"
                >
                  Limite Mensal (R$)
                </label>
                <input
                  id="limitAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl py-3 px-4 font-bold text-slate-900 transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="selectedMonth"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1"
                >
                  Mês Inicial
                </label>
                <input
                  id="selectedMonth"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl py-3 px-4 font-bold text-slate-900 transition-all outline-none"
                  required
                />
              </div>

              {!editingBudget && (
                <div className="space-y-2">
                  <label htmlFor="budgetScope" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Aplicar em
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "single" as const, label: "Este mês" },
                      { value: "from_month" as const, label: "Até Dez" },
                      { value: "full_year" as const, label: "Ano inteiro" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBudgetScope(opt.value)}
                        className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                          budgetScope === opt.value
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {budgetScope !== "single" && (
                    <p className="text-[10px] font-bold text-blue-500 ml-1">
                      {budgetScope === "full_year"
                        ? `Será criado para os 12 meses de ${selectedMonth.split("-")[0]}`
                        : `Será criado de ${MONTHS[Number(selectedMonth.split("-")[1]) - 1]} até Dezembro de ${selectedMonth.split("-")[0]}`}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95"
              >
                {editingBudget ? "Salvar Alterações" : "Criar Orçamento"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailBudget && (() => {
        const txs = txsByParentCategory.get(detailBudget.category_id || "") || [];
        const spent = spentByCategory.get(detailBudget.category_id || "") || 0;
        const pct = detailBudget.limit_amount > 0 ? spent / detailBudget.limit_amount : 0;
        const isOver = pct > 1;
        const catName = getCatName(detailBudget.category_id);
        const catColor = getCatColor(detailBudget.category_id);

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full sm:max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: catColor + "22" }}
                  >
                    <FiTarget size={18} style={{ color: catColor }} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{catName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {viewLabel} · {txs.length} transaç{txs.length === 1 ? "ão" : "ões"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailBudget(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Progress summary */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 shrink-0">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-black text-slate-900">{fmt(spent)}</span>
                  <span className="text-sm font-bold text-slate-400">/ {fmt(detailBudget.limit_amount)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? "bg-red-500" : pct > 0.7 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(pct * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase">{Math.round(pct * 100)}% usado</span>
                  {isOver ? (
                    <span className="text-[10px] font-black text-red-500">+ {fmt(spent - detailBudget.limit_amount)} acima</span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">{fmt(detailBudget.limit_amount - spent)} restante</span>
                  )}
                </div>
              </div>

              {/* Transaction list */}
              <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                {txs.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium italic text-center py-8">
                    Nenhuma transação paga neste mês.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {txs.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {tx.description || "Sem descrição"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {getCatNameById(tx.category)} · {tx.due_date ? new Date(tx.due_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                          </p>
                        </div>
                        <span className="text-sm font-black text-red-500 ml-4 whitespace-nowrap">
                          -{fmt(Math.abs(tx.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer total */}
              {txs.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center shrink-0">
                  <span className="text-xs font-black text-slate-400 uppercase">
                    Total
                  </span>
                  <span className="text-base font-black text-slate-900">
                    {fmt(txs.reduce((s, t) => s + Math.abs(t.amount), 0))}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
