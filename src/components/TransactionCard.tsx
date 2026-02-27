"use client";

import {
  FiArrowUpRight,
  FiArrowDownLeft,
  FiTag,
  FiCalendar,
  FiShoppingBag,
  FiCoffee,
  FiTruck,
} from "react-icons/fi";

type Transaction = {
  id: string;
  date?: string;
  description: string;
  amount: number;
  category?: string;
};

// Helper para ícones baseados em categoria (extensível)
const getCategoryIcon = (category?: string) => {
  const c = category?.toLowerCase() || "";
  if (c.includes("comida") || c.includes("restaurante")) return <FiCoffee />;
  if (c.includes("compras") || c.includes("mercado")) return <FiShoppingBag />;
  if (c.includes("transporte") || c.includes("uber")) return <FiTruck />;
  return <FiTag />;
};

export default function TransactionCard({ t }: { t: Transaction }) {
  const isNegative = t.amount < 0;

  return (
    <div className="group flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md">
      <div className="flex items-center gap-4">
        {/* Ícone de Categoria com Indicador de Fluxo */}
        <div
          className={`
          relative flex items-center justify-center w-12 h-12 rounded-xl text-lg transition-colors
          ${
            isNegative
              ? "bg-slate-100 text-slate-600 group-hover:bg-red-50 group-hover:text-red-600"
              : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
          }
        `}
        >
          {getCategoryIcon(t.category)}

          {/* Mini Badge de Direção */}
          <span
            className={`
            absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px]
            ${isNegative ? "bg-slate-400 text-white" : "bg-emerald-500 text-white"}
          `}
          >
            {isNegative ? <FiArrowDownLeft /> : <FiArrowUpRight />}
          </span>
        </div>

        {/* Info da Transação */}
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
            {t.description}
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <FiCalendar size={12} />
              {t.date ?? "Hoje"}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full group-hover:bg-white transition-colors">
              {t.category ?? "Geral"}
            </span>
          </div>
        </div>
      </div>

      {/* Valor Financeiro */}
      <div className="text-right flex flex-col items-end">
        <span
          className={`
          text-base font-bold tracking-tight
          ${isNegative ? "text-slate-700" : "text-emerald-600"}
        `}
        >
          {/* Exibimos o sinal de forma elegante */}
          {isNegative ? "- " : "+ "}
          {Math.abs(t.amount).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
          {isNegative ? "Débito" : "Crédito"}
        </span>
      </div>
    </div>
  );
}
