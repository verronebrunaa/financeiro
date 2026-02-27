"use client";
import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiSearch,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiChevronUp,
  FiChevronDown,
  FiCalendar,
  FiRepeat,
} from "react-icons/fi";
import supabase from "../lib/supabaseClient";
import TransactionModal, { Transaction } from "./TransactionModal";
import TransactionDetailsModal from "./TransactionDetailsModal";

const formatSafeDate = (dateStr: string | undefined) => {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export default function TransactionManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sortField, setSortField] = useState<string>("competence_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null,
  );

  const loadTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("due_date", { ascending: false });
    setTransactions(data || []);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (!error) {
        setSelectedTransaction(null);
        loadTransactions();
      }
    }
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortField(field);
    setSortDirection(isAsc ? "desc" : "asc");
  };

  // --- FILTRO CORRIGIDO PARA IGNORAR TIMEZONE ---
  const filteredTransactions = transactions
    .filter((tx) => {
      // Extrai o mês e ano diretamente da string (YYYY-MM-DD)
      const getYearMonth = (dateStr: string | undefined) => {
        if (!dateStr) return { year: null, month: null };
        const parts = dateStr.split("-");
        return { year: Number(parts[0]), month: Number(parts[1]) };
      };

      // Usa a due_date como base primária para filtragem mensal
      const { month: m, year: y } = getYearMonth(
        tx.due_date || tx.competence_date,
      );

      return (
        (!filterMonth || m === Number(filterMonth)) &&
        (!filterYear || y === Number(filterYear)) &&
        (!filterCategory || tx.category === filterCategory) &&
        (!search ||
          tx.description?.toLowerCase().includes(search.toLowerCase()) ||
          tx.category?.toLowerCase().includes(search.toLowerCase()))
      );
    })
    .sort((a: any, b: any) => {
      let aV = a[sortField];
      let bV = b[sortField];
      if (sortField === "amount") {
        aV = Number(aV);
        bV = Number(bV);
      }
      if (aV < bV) return sortDirection === "asc" ? -1 : 1;
      if (aV > bV) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Barra de Filtros (Mantida igual a sua) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="relative flex-1 group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            <FiPlus size={20} /> Nova Transação
          </button>
        </div>

        {/* Seus Filtros Originais Aqui... */}
        {/* Adicionei os anos de 2024 a 2026 como você pediu */}
        <div className="flex flex-wrap gap-3 items-center pt-2">
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
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="p-5">Data</th>
                <th className="p-5">Vencimento</th>
                <th className="p-5">Status</th>
                <th className="p-5">Descrição</th>
                <th className="p-5 text-right px-8">Valor</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-slate-900">
              {filteredTransactions.map((tx) => {
                // Cálculo de status seguro ignorando fuso
                const today = new Date().toLocaleDateString("en-CA");
                const isPaid = tx.status === "Pago";
                const isOverdue = tx.due_date && tx.due_date < today && !isPaid;
                const statusLabel = isPaid
                  ? "Pago"
                  : isOverdue
                    ? "Atrasado"
                    : "Pendente";

                return (
                  <tr
                    key={tx.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group cursor-pointer"
                    onClick={() => setSelectedTransaction(tx)}
                  >
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
                      <span
                        className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest uppercase ${statusLabel === "Pago" ? "bg-emerald-100 text-emerald-700" : statusLabel === "Atrasado" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {statusLabel}
                      </span>
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
                        {/* Ícone sutil se fizer parte de uma recorrência */}
                        {tx.recurrence_group_id && (
                          <FiRepeat
                            className="text-slate-300 shrink-0"
                            title="Transação Recorrente"
                          />
                        )}
                      </div>
                    </td>
                    <td
                      className={`p-5 text-right px-8 font-black text-base tracking-tighter ${Number(tx.amount) < 0 ? "text-slate-900" : "text-emerald-600"}`}
                    >
                      {Number(tx.amount).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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

      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onDelete={(id) => handleDelete(id)}
          onEdit={(tx) => {
            setEditTransaction(tx);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
}

const SortHeader = ({
  label,
  field,
  currentField,
  direction,
  onSort,
  className = "",
}: any) => (
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
