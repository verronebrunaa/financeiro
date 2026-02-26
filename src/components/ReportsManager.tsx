"use client";
import { useState, useEffect } from "react";
import {
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiFilter,
} from "react-icons/fi";
import supabase from "../lib/supabaseClient";

export default function ReportsManager() {
  const [data, setData] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    const { data: txs } = await supabase.from("transactions").select("*");

    if (txs) {
      // Filtrar no lado do cliente para este exemplo
      const filtered = txs.filter((tx) => {
        const d = new Date(tx.date);
        return (
          d.getUTCMonth() + 1 === Number(filterMonth) &&
          d.getUTCFullYear() === Number(filterYear)
        );
      });
      setData(filtered);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterMonth, filterYear]);

  // Cálculos de métricas
  const totalIncomes = data
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpenses = data
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
  const balance = totalIncomes - totalExpenses;

  // Agrupamento por Categoria (para o gráfico de barras/lista)
  const categories = data
    .filter((t) => t.amount < 0)
    .reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(Number(t.amount));
      return acc;
    }, {});

  const sortedCategories = Object.entries(categories).sort(
    ([, a]: any, [, b]: any) => b - a,
  );

  return (
    <div className="space-y-10">
      {/* Controles de Filtro */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm w-fit">
        <div className="flex items-center gap-2 px-3 text-slate-400">
          <FiFilter size={18} />
          <span className="text-xs font-black uppercase tracking-widest">
            Período:
          </span>
        </div>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(Number(e.target.value))}
          className="bg-slate-50 border-none rounded-xl py-2 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(Number(e.target.value))}
          className="bg-slate-50 border-none rounded-xl py-2 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Cards de Resumo de Alto Impacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard
          title="Entradas"
          value={totalIncomes}
          icon={<FiTrendingUp />}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <ReportCard
          title="Saídas"
          value={totalExpenses}
          icon={<FiTrendingDown />}
          color="text-red-600"
          bg="bg-red-50"
        />
        <ReportCard
          title="Saldo Final"
          value={balance}
          icon={<FiDollarSign />}
          color="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      {/* Distribuição por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <FiPieChart className="text-blue-600" /> Gastos por Categoria
            </h3>
            <span className="text-[10px] font-bold text-slate-400">
              TOTAL EM SAÍDAS
            </span>
          </div>

          <div className="space-y-6">
            {sortedCategories.length > 0 ? (
              sortedCategories.map(([cat, val]: any) => {
                const percentage = ((val / totalExpenses) * 100).toFixed(1);
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-black text-slate-700">
                        {cat}
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {val.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 text-right">
                      {percentage}% do total de gastos
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-10 text-slate-400 font-medium italic text-sm">
                Nenhum gasto registrado no período.
              </p>
            )}
          </div>
        </section>

        {/* Card Informativo de Destaque */}
        <section className="bg-slate-900 p-8 rounded-[32px] text-white flex flex-col justify-between overflow-hidden relative group">
          <FiDollarSign className="absolute -right-10 -top-10 text-white/5 w-64 h-64 rotate-12 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <h3 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-2">
              Insight do Mês
            </h3>
            <p className="text-xl font-bold leading-tight">
              {balance >= 0
                ? "Parabéns! Você está operando no azul este mês. Considere investir o excedente."
                : "Atenção: Suas despesas superaram suas receitas. Revise seus gastos em categorias não essenciais."}
            </p>
          </div>
          <div className="relative z-10 mt-10">
            <p className="text-slate-400 text-xs font-bold uppercase mb-1">
              Maior Gasto em:
            </p>
            <p className="text-2xl font-black">
              {sortedCategories[0]?.[0] || "—"}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

// Sub-componente de Card
function ReportCard({ title, value, icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center mb-6 text-2xl`}
      >
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {title}
      </p>
      <p className={`text-3xl font-black mt-1 tracking-tighter ${color}`}>
        {value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </p>
    </div>
  );
}
