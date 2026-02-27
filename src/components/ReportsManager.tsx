"use client";
import { useState, useEffect, useCallback } from "react";
import {
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiFilter,
  FiLoader,
} from "react-icons/fi";
import supabase from "../lib/supabaseClient";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ReportsManager() {
  const [data, setData] = useState<any[]>([]);
  const [categoriesDb, setCategoriesDb] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // 1. Buscar todas as categorias (Pai e Filhas) para mapeamento
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id, color, type");
      if (!error) setCategoriesDb(data || []);
    }
    fetchCategories();
  }, []);

  // 2. Carregar Transações com filtro seguro de fuso horário
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: txs, error } = await supabase
      .from("transactions")
      .select("*");

    if (txs) {
      const filtered = txs.filter((tx) => {
        // Usa due_date como verdade absoluta para competência mensal
        const dateStr = tx.due_date || tx.competence_date;
        if (!dateStr) return false;
        const [year, month] = dateStr.split("-").map(Number);
        return month === filterMonth && year === filterYear;
      });
      setData(filtered);
    }
    setLoading(false);
  }, [filterMonth, filterYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 3. LÓGICA DE AGRUPAMENTO (Pai > Filho)
  const gastosPorCategoria: any = {};

  data
    .filter((t) => Number(t.amount) < 0)
    .forEach((t) => {
      // Procura a categoria salva na transação dentro do banco de categorias
      const cat = categoriesDb.find(
        (c) => c.name === t.category || c.id === t.category,
      );

      if (!cat) {
        // Fallback para caso a categoria não seja encontrada
        const name = t.category || "Geral";
        if (!gastosPorCategoria[name])
          gastosPorCategoria[name] = {
            total: 0,
            color: "#cbd5e1",
            subcategorias: {},
          };
        gastosPorCategoria[name].total += Math.abs(Number(t.amount));
        return;
      }

      // Identifica quem é o Pai (Categoria Principal)
      const principal = cat.parent_id
        ? categoriesDb.find((c) => c.id === cat.parent_id)
        : cat;
      const principalName = principal?.name || "Geral";
      const principalColor = principal?.color || "#3b82f6";

      if (!gastosPorCategoria[principalName]) {
        gastosPorCategoria[principalName] = {
          total: 0,
          color: principalColor,
          subcategorias: {},
        };
      }

      const valorAbsoluto = Math.abs(Number(t.amount));
      gastosPorCategoria[principalName].total += valorAbsoluto;

      // Se a categoria da transação era uma subcategoria, adiciona na lista interna
      if (cat.parent_id) {
        gastosPorCategoria[principalName].subcategorias[cat.name] =
          (gastosPorCategoria[principalName].subcategorias[cat.name] || 0) +
          valorAbsoluto;
      }
    });

  // Métricas Globais
  const totalIncomes = data
    .filter((t) => Number(t.amount) > 0)
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpenses = Object.values(gastosPorCategoria).reduce(
    (acc: any, c: any) => acc + c.total,
    0,
  );
  const balance = totalIncomes - totalExpenses;

  // Configuração do Gráfico
  const pieLabels = Object.keys(gastosPorCategoria);
  const pieChartData = {
    labels: pieLabels,
    datasets: [
      {
        data: pieLabels.map((cat) => gastosPorCategoria[cat].total),
        backgroundColor: pieLabels.map((cat) => gastosPorCategoria[cat].color),
        borderWidth: 0,
        hoverOffset: 20,
      },
    ],
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <FiLoader className="animate-spin text-blue-600" size={40} />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Filtros */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm w-fit">
        <FiFilter className="ml-2 text-slate-400" />
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(Number(e.target.value))}
          className="bg-slate-50 rounded-xl py-2 px-4 font-bold outline-none"
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
          className="bg-slate-50 rounded-xl py-2 px-4 font-bold outline-none"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard
          title="Receitas"
          value={totalIncomes}
          color="text-emerald-600"
          bg="bg-emerald-50"
          icon={<FiTrendingUp />}
        />
        <ReportCard
          title="Despesas"
          value={totalExpenses}
          color="text-red-600"
          bg="bg-red-50"
          icon={<FiTrendingDown />}
        />
        <ReportCard
          title="Saldo"
          value={balance}
          color="text-blue-600"
          bg="bg-blue-50"
          icon={<FiDollarSign />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico e Lista Detalhada */}
        <section className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center gap-2">
            <FiPieChart className="text-blue-600" /> Distribuição de Gastos
          </h3>

          <div className="flex flex-col items-center">
            {pieLabels.length > 0 ? (
              <>
                <div className="w-full max-w-[300px] mb-12">
                  <Pie
                    data={pieChartData}
                    options={{ plugins: { legend: { display: false } } }}
                  />
                </div>
                <div className="w-full space-y-6">
                  {pieLabels.map((cat) => (
                    <div key={cat} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: gastosPorCategoria[cat].color,
                            }}
                          />
                          <span className="font-black text-slate-700">
                            {cat}
                          </span>
                        </div>
                        <span className="font-black text-slate-900">
                          {gastosPorCategoria[cat].total.toLocaleString(
                            "pt-BR",
                            { style: "currency", currency: "BRL" },
                          )}
                        </span>
                      </div>
                      {/* Subcategorias lógicas ↳ */}
                      {Object.entries(
                        gastosPorCategoria[cat].subcategorias,
                      ).map(([sub, val]: any) => (
                        <div
                          key={sub}
                          className="ml-6 flex justify-between text-xs font-bold text-slate-400 mb-1 italic"
                        >
                          <span>↳ {sub}</span>
                          <span>
                            {val.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-20 text-slate-400 italic">
                Sem movimentações este mês.
              </p>
            )}
          </div>
        </section>

        {/* Insight e Destaque */}
        <section className="space-y-8">
          <div className="bg-slate-900 p-10 rounded-[40px] text-white relative overflow-hidden h-full flex flex-col justify-between">
            <FiDollarSign className="absolute -right-10 -top-10 text-white/5 w-64 h-64 rotate-12" />
            <div className="relative z-10">
              <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                Finnan Intelligence
              </h4>
              <p className="text-2xl font-bold leading-tight tracking-tighter italic">
                {balance < 0
                  ? "Atenção! Suas despesas ultrapassaram suas receitas. Revise seus custos fixos."
                  : "Ótimo trabalho! Você manteve seu orçamento sob controle este mês."}
              </p>
            </div>
            <div className="relative z-10 mt-20 pt-8 border-t border-white/10">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">
                Maior Categoria de Gasto
              </p>
              <p className="text-3xl font-black text-blue-500">
                {pieLabels.length > 0 ? pieLabels[0] : "—"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportCard({ title, value, icon, color, bg }: any) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
      <div
        className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center mb-6 text-xl shadow-inner`}
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
