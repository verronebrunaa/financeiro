"use client";

import {
  FiTrendingDown,
  FiTrendingUp,
  FiDollarSign,
  FiAlertCircle,
} from "react-icons/fi";
import { SummaryCard } from "./SummaryCard";

interface Summaries {
  debts: number;
  monthlyExpenses: number;
  receipts: number;
  overdue: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function DashboardSummary({ summaries }: Readonly<{ summaries: Summaries }>) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
      <SummaryCard
        title="Total em Dívidas"
        value={fmt(summaries.debts)}
        icon={<FiTrendingDown />}
        color="text-red-600"
        bg="bg-red-50"
      />
      <SummaryCard
        title="Gastos do Mês"
        value={fmt(summaries.monthlyExpenses)}
        icon={<FiDollarSign />}
        color="text-blue-600"
        bg="bg-blue-50"
      />
      <SummaryCard
        title="Recebimentos"
        value={fmt(summaries.receipts)}
        icon={<FiTrendingUp />}
        color="text-emerald-600"
        bg="bg-emerald-50"
      />
      <SummaryCard
        title="Total em Atraso"
        value={fmt(summaries.overdue)}
        icon={<FiAlertCircle />}
        color="text-amber-600"
        bg="bg-amber-50"
      />
    </div>
  );
}
