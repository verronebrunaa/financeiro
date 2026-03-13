"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FiPlus,
  FiSearch,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiRepeat,
  FiLoader,
  FiTrash2,
  FiEdit2,
  FiX,
  FiCheckSquare,
  FiSquare,
  FiMinus,
} from "react-icons/fi";
import toast from "react-hot-toast";
import supabase from "../lib/supabaseClient";
import TransactionModal, { Transaction } from "./TransactionModal";
import TransactionDetailsModal from "./TransactionDetailsModal";
import { useSubscription, FREE_LIMITS } from "@/hooks/useSubscription";
import ConfirmDialog from "@/components/ConfirmDialog";
import Link from "next/link";

const PAGE_SIZE = 20;

const formatSafeDate = (dateStr: string | undefined) => {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

function getRandomColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (id.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 85%)`;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function TransactionManager() {
  const { canUse, subscription } = useSubscription();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<
    { id: string; name: string; color?: string; parent_id?: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("competence_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    transactionId: string | null;
  }>({ isOpen: false, transactionId: null });
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{
    isOpen: boolean;
    count: number;
  }>({ isOpen: false, count: 0 });

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("due_date", { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTransactions();
    const loadCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, color, parent_id");
      setCategories(data || []);
    };
    loadCategories();
  }, [loadTransactions]);

  // Mapa de UUID → nome para busca e filtro
  const catMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const resolveCatName = useCallback(
    (catId?: string) => {
      if (!catId) return "";
      return catMap.get(catId) ?? catId;
    },
    [catMap],
  );

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ isOpen: true, transactionId: id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.transactionId) return;
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deleteConfirm.transactionId);
    if (!error) {
      setSelectedTransaction(null);
      setDeleteConfirm({ isOpen: false, transactionId: null });
      loadTransactions();
    }
  };

  const handleDuplicate = async (tx: {
    id: string;
    amount: number;
    description?: string;
    category?: string;
    payment_method?: string;
    competence_date?: string;
    due_date?: string;
    payment_date?: string;
    type?: "entrada" | "saida";
    is_monthly?: boolean;
    observation?: string;
  }) => {
    if (atFreeLimit) {
      toast.error("Limite de transações do plano Free atingido.");
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        description: tx.description || "",
        amount: tx.amount,
        type: tx.type || "saida",
        category: tx.category || null,
        payment_method: tx.payment_method || null,
        competence_date: tx.competence_date || null,
        due_date: tx.due_date || null,
        payment_date: tx.payment_date || null,
        observation: tx.observation || null,
        is_monthly: false,
        status: "Pendente",
      });

      if (error) {
        console.error("Erro ao duplicar transação:", error);
        toast.error("Erro ao duplicar transação: " + (error.message || error.code));
      } else {
        toast.success("Transação duplicada com sucesso!");
        setSelectedTransaction(null);
        await loadTransactions();
      }
    } catch (err) {
      console.error("Erro ao duplicar:", err);
      toast.error("Erro ao duplicar transação");
    }
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortField(field);
    setSortDirection(isAsc ? "desc" : "asc");
  };

  // ── Seleção em massa ──
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedTransactions.map((tx) => String(tx.id));
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleteConfirm({ isOpen: true, count: selected.size });
  };

  const confirmBulkDelete = async () => {
    const ids = [...selected];
    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", ids);
    if (error) {
      toast.error("Erro ao excluir transações");
    } else {
      toast.success(`${ids.length} transação(ões) excluída(s)`);
      setSelected(new Set());
      setBulkDeleteConfirm({ isOpen: false, count: 0 });
      loadTransactions();
    }
  };

  const handleBulkEdit = async (fields: {
    category?: string;
    description?: string;
    payment_method?: string;
    amount?: number;
  }) => {
    if (selected.size === 0) return;
    setBulkSaving(true);
    const updates: Record<string, unknown> = {};
    if (fields.category !== undefined) updates.category = fields.category;
    if (fields.description?.trim())
      updates.description = fields.description.trim();
    if (fields.payment_method !== undefined)
      updates.payment_method = fields.payment_method;
    if (fields.amount !== undefined && !Number.isNaN(fields.amount))
      updates.amount = fields.amount;

    if (Object.keys(updates).length === 0) {
      setBulkSaving(false);
      return;
    }

    const ids = [...selected];
    const { error } = await supabase
      .from("transactions")
      .update(updates)
      .in("id", ids);
    setBulkSaving(false);
    if (error) {
      toast.error("Erro ao atualizar transações");
    } else {
      toast.success(`${ids.length} transação(ões) atualizada(s)`);
      setSelected(new Set());
      setBulkEditOpen(false);
      loadTransactions();
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterMonth, filterYear, filterCategory, search]);

  const filteredTransactions = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    return transactions
      .filter((tx) => {
        const getYearMonth = (dateStr: string | undefined) => {
          if (!dateStr) return { year: null, month: null };
          const parts = dateStr.split("-");
          return { year: Number(parts[0]), month: Number(parts[1]) };
        };

        const { month: m, year: y } = getYearMonth(
          tx.due_date || tx.competence_date,
        );

        // Compara UUID→UUID, e se for categoria pai, inclui subcategorias
        const matchesCategory =
          !filterCategory ||
          tx.category === filterCategory ||
          categories.find((c) => c.id === tx.category)?.parent_id ===
            filterCategory;

        // FIX: resolve nome para busca textual
        const resolvedName = resolveCatName(tx.category);
        const matchesSearch =
          !search ||
          tx.description?.toLowerCase().includes(lowerSearch) ||
          resolvedName.toLowerCase().includes(lowerSearch);

        return (
          (!filterMonth || m === Number(filterMonth)) &&
          (!filterYear || y === Number(filterYear)) &&
          matchesCategory &&
          matchesSearch
        );
      })
      .sort((a, b) => {
        const aRec = a as Record<string, unknown>;
        const bRec = b as Record<string, unknown>;
        let aV = aRec[sortField];
        let bV = bRec[sortField];
        if (sortField === "amount") {
          aV = Number(aV);
          bV = Number(bV);
        }
        if ((aV ?? "") < (bV ?? "")) return sortDirection === "asc" ? -1 : 1;
        if ((aV ?? "") > (bV ?? "")) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [
    transactions,
    filterMonth,
    filterYear,
    filterCategory,
    search,
    sortField,
    sortDirection,
    resolveCatName,
    categories,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / PAGE_SIZE),
  );
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const today = new Date().toLocaleDateString("en-CA");

  const getStatusLabel = (tx: Transaction) => {
    const isPaid = tx.status === "Pago";
    if (isPaid) return "Pago";
    return tx.due_date && tx.due_date < today ? "Atrasado" : "Pendente";
  };

  const getCategoryDisplay = (catId?: string) => {
    if (!catId) return { name: "—", color: "" };
    const found = categories.find((c) => c.id === catId);
    const color = found
      ? found.color || getRandomColor(found.id)
      : getRandomColor(catId);
    let name = found ? found.name : catId;
    if (found?.parent_id) {
      const parent = categories.find((c) => c.id === found.parent_id);
      if (parent) name = `${parent.name} / ${found.name}`;
    }
    return { name, color };
  };

  // Free plan: count this month's transactions
  const monthlyTxCount = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return transactions.filter((t) => {
      const d = t.due_date || t.competence_date || "";
      return d.startsWith(ym);
    }).length;
  }, [transactions]);

  const atFreeLimit =
    subscription.plan === "free" &&
    monthlyTxCount >= FREE_LIMITS.transactions_per_month;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Free plan limit warning */}
      {subscription.plan === "free" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-sm font-bold text-amber-800">
            {atFreeLimit
              ? `Limite atingido! ${monthlyTxCount}/${FREE_LIMITS.transactions_per_month} transações neste mês.`
              : `${monthlyTxCount}/${FREE_LIMITS.transactions_per_month} transações neste mês na Assinatura Free.`}
          </span>
          <Link
            href="/dashboard/plans"
            className="px-4 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            Fazer Upgrade
          </Link>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
          <div className="relative flex-1 group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar por descrição ou categoria..."
              className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-xl sm:rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => !atFreeLimit && setIsModalOpen(true)}
            disabled={atFreeLimit}
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlus size={20} /> Nova Transação
          </button>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 items-center pt-1 sm:pt-2">
          <select
            className="bg-slate-50 border-2 border-slate-100 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="">Mês</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            className="bg-slate-50 border-2 border-slate-100 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="">Ano</option>
            {[
              ...new Set(
                transactions
                  .map((tx) => {
                    const dateStr = tx.due_date || tx.competence_date;
                    return dateStr ? Number(dateStr.split("-")[0]) : null;
                  })
                  .filter((y): y is number => y !== null),
              ),
            ]
              .sort((a, b) => a - b)
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </select>
          <select
            className="bg-slate-50 border-2 border-slate-100 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Categoria</option>
            {categories
              .filter((c) => !c.parent_id)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((parent) => {
                const subs = categories
                  .filter((c) => c.parent_id === parent.id)
                  .sort((a, b) => a.name.localeCompare(b.name));
                return (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>Todas de {parent.name}</option>
                    {subs.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
          </select>

          {(filterMonth || filterYear || filterCategory || search) && (
            <button
              onClick={() => {
                setFilterMonth("");
                setFilterYear("");
                setFilterCategory("");
                setSearch("");
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors ml-1"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Barra de ações em massa */}
      {selected.size > 0 && canUse("bulk_operations") && (
        <div className="bg-blue-600 text-white rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="p-1.5 rounded-lg hover:bg-blue-500 transition-colors"
            >
              <FiX size={16} />
            </button>
            <span className="text-sm font-black">
              {selected.size} selecionada{selected.size === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkEditOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-black transition-colors"
            >
              <FiEdit2 size={14} /> Editar
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-black transition-colors"
            >
              <FiTrash2 size={14} /> Excluir
            </button>
          </div>
        </div>
      )}

      {selected.size > 0 && !canUse("bulk_operations") && (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <span className="text-sm font-bold text-slate-600">
            Operações em lote são um recurso Pro
          </span>
          <Link
            href="/dashboard/plans"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-colors"
          >
            Ver Assinatura
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="bg-white rounded-2xl sm:rounded-4xl border border-slate-200 shadow-sm p-8 sm:p-12">
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <FiLoader className="animate-spin" size={20} />
            <span className="text-sm font-bold">Carregando transações...</span>
          </div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-4xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center">
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest italic">
            Nenhuma transação encontrada.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: Tabela */}
          <div className="hidden lg:block bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    <th className="p-5 w-12">
                      <button
                        onClick={toggleSelectAll}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <SelectAllIcon
                          transactions={paginatedTransactions}
                          selected={selected}
                        />
                      </button>
                    </th>
                    <SortHeader
                      label="Data de Competência"
                      field="competence_date"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Data de Vencimento"
                      field="due_date"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <th className="p-5">Status</th>
                    <SortHeader
                      label="Descrição"
                      field="description"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Categoria"
                      field="category"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Valor"
                      field="amount"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                      className="text-right px-8"
                    />
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-slate-900">
                  {paginatedTransactions.map((tx) => {
                    const statusLabel = getStatusLabel(tx);
                    const { name: catName, color: catColor } =
                      getCategoryDisplay(tx.category);

                    return (
                      <tr
                        key={tx.id}
                        className={`border-b border-slate-50 hover:bg-slate-50/50 transition-all group cursor-pointer ${selected.has(String(tx.id)) ? "bg-blue-50/60" : ""}`}
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        <td
                          className="p-5 w-12"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => toggleSelect(String(tx.id))}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            {selected.has(String(tx.id)) ? (
                              <FiCheckSquare
                                size={16}
                                className="text-blue-600"
                              />
                            ) : (
                              <FiSquare size={16} />
                            )}
                          </button>
                        </td>
                        <td className="p-5 whitespace-nowrap text-slate-500">
                          {formatSafeDate(tx.competence_date)}
                        </td>
                        <td className="p-5 whitespace-nowrap text-slate-700">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="text-slate-300" />
                            {formatSafeDate(tx.due_date)}
                          </div>
                        </td>
                        <td className="p-5">
                          <StatusBadge status={statusLabel} />
                        </td>
                        <td className="p-5 max-w-50 truncate">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${Number(tx.amount) < 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                            >
                              {Number(tx.amount) < 0 ? (
                                <FiArrowDownLeft />
                              ) : (
                                <FiArrowUpRight />
                              )}
                            </div>
                            <span className="truncate group-hover:text-blue-600 transition-colors">
                              {tx.description}
                            </span>
                            {tx.recurrence_group_id && (
                              <FiRepeat
                                className="text-slate-300 shrink-0"
                                title="Transação Recorrente"
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          {catColor ? (
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: catColor,
                                color: "#334155",
                                display: "inline-block",
                                minWidth: "60px",
                                textAlign: "center",
                              }}
                            >
                              {catName}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          className={`p-5 text-right px-8 font-black text-base tracking-tighter ${Number(tx.amount) < 0 ? "text-slate-900" : "text-emerald-600"}`}
                        >
                          {fmt(Number(tx.amount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Cards */}
          <div className="lg:hidden space-y-3">
            {paginatedTransactions.map((tx) => {
              const statusLabel = getStatusLabel(tx);
              const { name: catName, color: catColor } = getCategoryDisplay(
                tx.category,
              );
              const amt = Number(tx.amount);

              return (
                <div
                  key={tx.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 active:scale-[0.98] transition-all cursor-pointer ${selected.has(String(tx.id)) ? "border-blue-300 bg-blue-50/40" : "border-slate-200"}`}
                  onClick={() => setSelectedTransaction(tx)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(String(tx.id));
                      }}
                      className="mt-1 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    >
                      {selected.has(String(tx.id)) ? (
                        <FiCheckSquare size={18} className="text-blue-600" />
                      ) : (
                        <FiSquare size={18} />
                      )}
                    </button>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${amt < 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                      >
                        {amt < 0 ? (
                          <FiArrowDownLeft size={18} />
                        ) : (
                          <FiArrowUpRight size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-sm">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <FiCalendar size={10} />
                            {formatSafeDate(tx.due_date)}
                          </span>
                          {tx.recurrence_group_id && (
                            <FiRepeat className="text-slate-300" size={10} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-black text-sm tracking-tight ${amt < 0 ? "text-slate-900" : "text-emerald-600"}`}
                      >
                        {fmt(amt)}
                      </p>
                      <StatusBadge status={statusLabel} />
                    </div>
                  </div>
                  {catColor && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: catColor, color: "#334155" }}
                      >
                        {catName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Comp. {formatSafeDate(tx.competence_date)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm px-4 sm:px-6 py-3">
              <span className="text-xs font-bold text-slate-400">
                {filteredTransactions.length} transação
                {filteredTransactions.length === 1 ? "" : "ões"} · Página {page}{" "}
                de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-slate-300 text-xs px-1">…</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-colors ${p === page ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-600"}`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <TransactionModal
          onCloseAction={() => setIsModalOpen(false)}
          onSuccessAction={() => {
            setIsModalOpen(false);
            loadTransactions();
          }}
        />
      )}

      {editTransaction && (
        <TransactionModal
          initialData={editTransaction}
          onCloseAction={() => setEditTransaction(null)}
          onSuccessAction={() => {
            setEditTransaction(null);
            loadTransactions();
          }}
        />
      )}

      {selectedTransaction?.id && (
        <TransactionDetailsModal
          transaction={{
            ...selectedTransaction,
            id: selectedTransaction.id as string,
            amount: Number(selectedTransaction.amount),
          }}
          onClose={() => setSelectedTransaction(null)}
          onDelete={(id) => handleDelete(id)}
          onDuplicate={(tx) => handleDuplicate(tx)}
          onEdit={(tx) => {
            setEditTransaction({
              ...tx,
              description: tx.description || "",
              type: tx.type || "saida",
              competence_date: tx.competence_date || "",
              due_date: tx.due_date || "",
              category: tx.category || "",
              amount: Number(tx.amount) || 0,
              payment_method: tx.payment_method || "",
              observation: tx.observation || "",
              is_monthly: tx.is_monthly || false,
              payment_date: tx.payment_date || "",
            });
            setSelectedTransaction(null);
          }}
          categories={categories}
        />
      )}

      {bulkEditOpen && (
        <BulkEditModal
          count={selected.size}
          categories={categories}
          saving={bulkSaving}
          onClose={() => setBulkEditOpen(false)}
          onSave={handleBulkEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteConfirm({ isOpen: false, transactionId: null })
        }
        isDangerous={true}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirm.isOpen}
        title="Excluir Transações"
        message={`Tem certeza que deseja excluir ${bulkDeleteConfirm.count} transação(ões)? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteConfirm({ isOpen: false, count: 0 })}
        isDangerous={true}
      />
    </div>
  );
}

function BulkEditModal({
  count,
  categories,
  saving,
  onClose,
  onSave,
}: Readonly<{
  count: number;
  categories: {
    id: string;
    name: string;
    color?: string;
    parent_id?: string | null;
  }[];
  saving: boolean;
  onClose: () => void;
  onSave: (fields: {
    category?: string;
    description?: string;
    payment_method?: string;
    amount?: number;
  }) => void;
}>) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [editCategory, setEditCategory] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const [editPayment, setEditPayment] = useState(false);
  const [editAmount, setEditAmount] = useState(false);

  const handleSave = () => {
    const fields: {
      category?: string;
      description?: string;
      payment_method?: string;
      amount?: number;
    } = {};
    if (editCategory) fields.category = category;
    if (editDescription && description.trim())
      fields.description = description.trim();
    if (editPayment) fields.payment_method = paymentMethod;
    if (editAmount && amount) fields.amount = Number(amount);
    onSave(fields);
  };

  const hasAnyField =
    editCategory || editDescription || editPayment || editAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-sm cursor-default"
        aria-label="Fechar"
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Edição em Massa
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              {count} transação(ões) selecionada(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-500 font-bold mb-4">
          Marque os campos que deseja alterar. Campos desmarcados não serão
          modificados.
        </p>

        <div className="space-y-4">
          {/* Categoria */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editCategory}
                onChange={(e) => setEditCategory(e.target.checked)}
                className="accent-blue-600 w-4 h-4"
              />
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Categoria
              </span>
            </label>
            {editCategory && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 outline-none transition-colors"
              >
                <option value="">Selecione...</option>
                {categories
                  .filter((c) => !c.parent_id)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((parent) => {
                    const subs = categories
                      .filter((c) => c.parent_id === parent.id)
                      .sort((a, b) => a.name.localeCompare(b.name));
                    return (
                      <optgroup key={parent.id} label={parent.name}>
                        <option value={parent.id}>{parent.name}</option>
                        {subs.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
              </select>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editDescription}
                onChange={(e) => setEditDescription(e.target.checked)}
                className="accent-blue-600 w-4 h-4"
              />
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Descrição
              </span>
            </label>
            {editDescription && (
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nova descrição..."
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 outline-none transition-colors"
              />
            )}
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editPayment}
                onChange={(e) => setEditPayment(e.target.checked)}
                className="accent-blue-600 w-4 h-4"
              />
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Método de Pagamento
              </span>
            </label>
            {editPayment && (
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 outline-none transition-colors"
              >
                <option value="">Selecione...</option>
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Boleto">Boleto</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência</option>
              </select>
            )}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editAmount}
                onChange={(e) => setEditAmount(e.target.checked)}
                className="accent-blue-600 w-4 h-4"
              />
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Valor
              </span>
            </label>
            {editAmount && (
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 outline-none transition-colors"
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasAnyField}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <FiLoader className="animate-spin" size={16} />
            ) : (
              <FiEdit2 size={16} />
            )}
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectAllIcon({
  transactions,
  selected,
}: Readonly<{ transactions: Transaction[]; selected: Set<string> }>) {
  if (
    transactions.length > 0 &&
    transactions.every((tx) => selected.has(String(tx.id)))
  ) {
    return <FiCheckSquare size={16} className="text-blue-600" />;
  }
  if (transactions.some((tx) => selected.has(String(tx.id)))) {
    return <FiMinus size={16} className="text-blue-400" />;
  }
  return <FiSquare size={16} />;
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  let cls = "bg-slate-100 text-slate-500";
  if (status === "Pago") cls = "bg-emerald-100 text-emerald-700";
  else if (status === "Atrasado") cls = "bg-red-100 text-red-700";
  return (
    <span
      className={`px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${cls}`}
    >
      {status}
    </span>
  );
}

function SortHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
  className = "",
}: Readonly<{
  label: string;
  field: string;
  currentField: string;
  direction: "asc" | "desc";
  onSort: (field: string) => void;
  className?: string;
}>) {
  return (
    <th
      className={`p-5 cursor-pointer select-none group/h ${className}`}
      onClick={() => onSort(field)}
    >
      <div
        className={`flex items-center gap-1 ${className.includes("right") ? "justify-end" : ""}`}
      >
        {label}
        <div className="flex flex-col text-[8px] opacity-30 group-hover/h:opacity-100 transition-opacity">
          <FiChevronUp
            className={
              currentField === field && direction === "asc"
                ? "text-blue-600 opacity-100"
                : ""
            }
          />
          <FiChevronDown
            className={
              currentField === field && direction === "desc"
                ? "text-blue-600 opacity-100"
                : ""
            }
          />
        </div>
      </div>
    </th>
  );
}
