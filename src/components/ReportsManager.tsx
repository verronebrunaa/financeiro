"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiFilter,
  FiLoader,
  FiZap,
  FiBarChart2,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiTarget,
  FiCloudRain,
  FiCloudLightning,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
  FiCreditCard,
  FiFileText,
} from "react-icons/fi";
import supabase from "../lib/supabaseClient";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
);

export default function ReportsManager() {
  const [data, setData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [categoriesDb, setCategoriesDb] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showDebtList, setShowDebtList] = useState(false);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

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

  // 2. Carregar Transações (todas + filtradas)
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: txs } = await supabase.from("transactions").select("*");

    if (txs) {
      setAllData(txs);
      const filtered = txs.filter((tx) => {
        // Dívidas não dependem de mês — são tratadas separadamente
        if (tx.category === "Divida") return false;
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

  // ── DÍVIDAS (atemporal — a "nuvem" sobre as finanças) ──
  const debtData = useMemo(() => {
    const isDebtCategory = (catName: string) => {
      const cat = categoriesDb.find(
        (c) => c.name === catName || c.id === catName,
      );
      if (!cat) return catName === "Divida";
      if (cat.name === "Divida") return true;
      if (cat.parent_id) {
        const parent = categoriesDb.find((c) => c.id === cat.parent_id);
        return parent?.name === "Divida";
      }
      return false;
    };

    const debts = allData.filter((tx) => isDebtCategory(tx.category));
    const totalDebt = debts.reduce(
      (acc, tx) => acc + Math.abs(Number(tx.amount) || 0),
      0,
    );
    const paidDebts = debts.filter((tx) => tx.status === "Pago");
    const unpaidDebts = debts.filter((tx) => tx.status !== "Pago");
    const totalPaid = paidDebts.reduce(
      (acc, tx) => acc + Math.abs(Number(tx.amount) || 0),
      0,
    );
    const totalUnpaid = unpaidDebts.reduce(
      (acc, tx) => acc + Math.abs(Number(tx.amount) || 0),
      0,
    );
    const paidPercent = totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 0;

    return {
      debts,
      totalDebt,
      totalPaid,
      totalUnpaid,
      paidPercent,
      unpaidDebts,
      paidDebts,
    };
  }, [allData, categoriesDb]);

  // 3. LÓGICA DE AGRUPAMENTO (Pai > Filho) — exclui dívidas
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
    (acc: number, c: any) => acc + c.total,
    0 as number,
  );
  const balance = totalIncomes - totalExpenses;

  const pieLabels = Object.keys(gastosPorCategoria);

  // ── DADOS DE TENDÊNCIA (últimos 6 meses) ──
  const trendData = useMemo(() => {
    const months: {
      label: string;
      key: string;
      income: number;
      expense: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(filterYear, filterMonth - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d
        .toLocaleString("pt-BR", { month: "short" })
        .replace(".", "");
      months.push({ label, key, income: 0, expense: 0 });
    }
    allData.forEach((tx) => {
      // Exclui dívidas dos gráficos de tendência (são atemporais)
      if (tx.category === "Divida") return;
      const dateStr = tx.due_date || tx.competence_date;
      if (!dateStr) return;
      const txKey = dateStr.substring(0, 7);
      const mo = months.find((m) => m.key === txKey);
      if (!mo) return;
      const amt = Number(tx.amount) || 0;
      if (amt > 0) mo.income += amt;
      else mo.expense += Math.abs(amt);
    });
    return months;
  }, [allData, filterMonth, filterYear]);

  // ── INSIGHTS INTELIGENTES ──
  const insights = useMemo(() => {
    const result: { icon: any; color: string; title: string; text: string }[] =
      [];

    // 1. Taxa de economia
    if (totalIncomes > 0) {
      const savingsRate = ((totalIncomes - totalExpenses) / totalIncomes) * 100;
      if (savingsRate > 20) {
        result.push({
          icon: FiCheckCircle,
          color: "text-emerald-500",
          title: "Taxa de Economia",
          text: `Excelente! Você economizou ${savingsRate.toFixed(0)}% da sua renda este mês.`,
        });
      } else if (savingsRate > 0) {
        result.push({
          icon: FiTarget,
          color: "text-amber-500",
          title: "Taxa de Economia",
          text: `Você economizou ${savingsRate.toFixed(0)}% da renda. Tente aumentar para pelo menos 20%.`,
        });
      } else {
        result.push({
          icon: FiAlertTriangle,
          color: "text-red-500",
          title: "Alerta de Gastos",
          text: `Você gastou mais do que ganhou. Déficit de ${Math.abs(balance).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
        });
      }
    }

    // 2. Categoria dominante
    if (pieLabels.length > 0) {
      const sorted = pieLabels
        .slice()
        .sort(
          (a, b) => gastosPorCategoria[b].total - gastosPorCategoria[a].total,
        );
      const topCat = sorted[0];
      const pct =
        totalExpenses > 0
          ? ((gastosPorCategoria[topCat].total / totalExpenses) * 100).toFixed(
              0,
            )
          : 0;
      result.push({
        icon: FiPieChart,
        color: "text-blue-500",
        title: "Gasto Dominante",
        text: `"${topCat}" representa ${pct}% dos seus gastos totais (${gastosPorCategoria[topCat].total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}).`,
      });
    }

    // 3. Comparação com mês anterior
    if (trendData.length >= 2) {
      const current = trendData.at(-1)!;
      const previous = trendData.at(-2)!;
      if (previous.expense > 0) {
        const change =
          ((current.expense - previous.expense) / previous.expense) * 100;
        if (change > 10) {
          result.push({
            icon: FiTrendingUp,
            color: "text-red-500",
            title: "Gastos em Alta",
            text: `Seus gastos subiram ${change.toFixed(0)}% em relação ao mês anterior. Fique atento!`,
          });
        } else if (change < -10) {
          result.push({
            icon: FiTrendingDown,
            color: "text-emerald-500",
            title: "Gastos em Queda",
            text: `Ótimo! Seus gastos caíram ${Math.abs(change).toFixed(0)}% em relação ao mês anterior.`,
          });
        } else {
          result.push({
            icon: FiActivity,
            color: "text-slate-500",
            title: "Gastos Estáveis",
            text: `Seus gastos se mantiveram estáveis em relação ao mês passado (variação de ${change > 0 ? "+" : ""}${change.toFixed(0)}%).`,
          });
        }
      }
    }

    // 4. Velocidade de gastos (projeção)
    const today = new Date();
    if (
      filterMonth === today.getMonth() + 1 &&
      filterYear === today.getFullYear()
    ) {
      const dayOfMonth = today.getDate();
      const daysInMonth = new Date(filterYear, filterMonth, 0).getDate();
      if (dayOfMonth > 1 && totalExpenses > 0) {
        const dailyAvg = totalExpenses / dayOfMonth;
        const projected = dailyAvg * daysInMonth;
        result.push({
          icon: FiZap,
          color: "text-purple-500",
          title: "Projeção do Mês",
          text: `No ritmo atual (${dailyAvg.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/dia), você deve gastar ${projected.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} até o fim do mês.`,
        });
      }
    }

    // 5. Número de transações
    const numTx = data.length;
    const numExpenses = data.filter((t) => Number(t.amount) < 0).length;
    if (numTx > 0) {
      const avgExpense = numExpenses > 0 ? totalExpenses / numExpenses : 0;
      result.push({
        icon: FiBarChart2,
        color: "text-indigo-500",
        title: "Resumo de Transações",
        text: `${numTx} transações no mês (${numExpenses} despesas). Ticket médio de gasto: ${avgExpense.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
      });
    }

    // 6. Insight de dívidas (sugestão de quitação)
    if (debtData.totalUnpaid > 0) {
      const monthlyFree = totalIncomes - totalExpenses;
      if (monthlyFree > 0) {
        const monthsToPayOff = Math.ceil(debtData.totalUnpaid / monthlyFree);
        if (monthsToPayOff <= 3) {
          result.push({
            icon: FiCloudLightning,
            color: "text-emerald-400",
            title: "Hora de Limpar Dívidas",
            text: `Com a sobra mensal de ${monthlyFree.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}, você quitaria suas dívidas em ~${monthsToPayOff} ${monthsToPayOff === 1 ? "mês" : "meses"}. Considere começar!`,
          });
        } else if (monthsToPayOff <= 12) {
          result.push({
            icon: FiCloudRain,
            color: "text-amber-400",
            title: "Plano de Quitação",
            text: `Suas dívidas levariam ~${monthsToPayOff} meses para quitar com a sobra atual. Foque em reduzir gastos variáveis para acelerar.`,
          });
        } else {
          result.push({
            icon: FiCloudRain,
            color: "text-red-400",
            title: "Dívidas Acumuladas",
            text: `No ritmo atual, levaria +${monthsToPayOff} meses para quitar. Priorize organizar o dia a dia antes de atacar as dívidas.`,
          });
        }
      } else {
        result.push({
          icon: FiCloudRain,
          color: "text-red-400",
          title: "Organize Primeiro",
          text: `Você tem ${debtData.totalUnpaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em dívidas, mas este mês os gastos superaram a renda. Foque em equilibrar o dia a dia primeiro.`,
        });
      }
    }

    if (debtData.paidPercent > 0 && debtData.paidPercent < 100) {
      result.push({
        icon: FiCheckCircle,
        color: "text-emerald-400",
        title: "Progresso nas Dívidas",
        text: `Você já quitou ${debtData.paidPercent.toFixed(0)}% das dívidas (${debtData.totalPaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}). Continue assim!`,
      });
    }

    return result;
  }, [
    data,
    totalIncomes,
    totalExpenses,
    balance,
    pieLabels,
    gastosPorCategoria,
    trendData,
    filterMonth,
    filterYear,
    debtData,
  ]);

  // Configuração do Gráfico Pie
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

  // Configuração do Gráfico de Barras (Receitas vs Despesas)
  const barChartData = {
    labels: trendData.map((m) => m.label),
    datasets: [
      {
        label: "Receitas",
        data: trendData.map((m) => m.income),
        backgroundColor: "#10b981",
        borderRadius: 8,
        barPercentage: 0.6,
      },
      {
        label: "Despesas",
        data: trendData.map((m) => m.expense),
        backgroundColor: "#ef4444",
        borderRadius: 8,
        barPercentage: 0.6,
      },
    ],
  };

  // Configuração do Gráfico de Linha (Evolução do Saldo)
  const lineChartData = {
    labels: trendData.map((m) => m.label),
    datasets: [
      {
        label: "Saldo Mensal",
        data: trendData.map((m) => m.income - m.expense),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.08)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: { font: { weight: "bold" as const, size: 11 }, padding: 20 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f9" },
        ticks: {
          font: { weight: "bold" as const, size: 10 },
          callback: (v: any) => (v / 1000).toFixed(0) + "k",
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { weight: "bold" as const, size: 11 } },
      },
    },
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

      {/* ── GRÁFICOS DE TENDÊNCIA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <FiBarChart2 className="text-blue-600" /> Receitas vs Despesas
          </h3>
          <Bar data={barChartData} options={chartOptions} />
        </section>

        <section className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <FiActivity className="text-blue-600" /> Evolução do Saldo
          </h3>
          <Line data={lineChartData} options={chartOptions} />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico Pie e Lista Detalhada */}
        <section className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center gap-2">
            <FiPieChart className="text-blue-600" /> Distribuição de Gastos
          </h3>

          <div className="flex flex-col items-center">
            {pieLabels.length > 0 ? (
              <>
                <div className="w-full max-w-75 mb-12">
                  <Pie
                    data={pieChartData}
                    options={{ plugins: { legend: { display: false } } }}
                  />
                </div>
                <div className="w-full space-y-6">
                  {pieLabels.map((cat) => (
                    <div key={cat} className="group">
                      <div className="flex justify-between items-center mb-1">
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
                      {/* Barra de porcentagem */}
                      <div className="ml-6 mb-2">
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${totalExpenses > 0 ? (gastosPorCategoria[cat].total / totalExpenses) * 100 : 0}%`,
                              backgroundColor: gastosPorCategoria[cat].color,
                            }}
                          />
                        </div>
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

        <section className="space-y-8">
          <div className="bg-slate-900 p-10 rounded-[40px] text-white relative overflow-hidden">
            <FiZap className="absolute -right-10 -top-10 text-white/5 w-64 h-64 rotate-12" />
            <div className="relative z-10">
              <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <FiZap size={14} /> Finnan Intelligence
              </h4>

              {insights.length > 0 ? (
                <div className="space-y-6">
                  {insights.map((insight) => {
                    const Icon = insight.icon;
                    return (
                      <div
                        key={insight.title}
                        className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={insight.color} size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {insight.title}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white/90 leading-relaxed">
                          {insight.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic text-sm">
                  Adicione transações para gerar insights automáticos.
                </p>
              )}
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">
                Maior Categoria de Gasto
              </p>
              <p className="text-3xl font-black text-blue-500">
                {pieLabels.length > 0
                  ? pieLabels
                      .slice()
                      .sort(
                        (a, b) =>
                          gastosPorCategoria[b].total -
                          gastosPorCategoria[a].total,
                      )[0]
                  : "—"}
              </p>
              {pieLabels.length > 0 && (
                <p className="text-slate-500 text-xs font-bold mt-1">
                  {(
                    (gastosPorCategoria[
                      pieLabels
                        .slice()
                        .sort(
                          (a, b) =>
                            gastosPorCategoria[b].total -
                            gastosPorCategoria[a].total,
                        )[0]
                    ].total /
                      totalExpenses) *
                    100
                  ).toFixed(1)}
                  % do total de despesas
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── NUVEM DE DÍVIDAS ── */}
      {debtData.totalDebt > 0 && (
        <section className="relative bg-linear-to-br from-slate-800 via-slate-900 to-slate-950 p-8 rounded-[40px] border border-slate-700/50 shadow-lg overflow-hidden">
          {/* Nuvem decorativa de fundo */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 left-1/4 w-32 h-16 bg-white rounded-full blur-2xl" />
            <div className="absolute top-2 left-1/3 w-40 h-20 bg-white rounded-full blur-3xl" />
            <div className="absolute top-6 right-1/4 w-36 h-14 bg-white rounded-full blur-2xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-700/50 rounded-2xl flex items-center justify-center">
                <FiCloudRain className="text-slate-400" size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Nuvem de Dívidas
                </h3>
                <p className="text-[10px] text-slate-600 font-bold">
                  Valores que pairam sobre suas finanças — independente do mês
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Total em Dívidas
                </p>
                <p className="text-2xl font-black text-red-400 tracking-tighter">
                  {debtData.totalDebt.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Já Quitado
                </p>
                <p className="text-2xl font-black text-emerald-400 tracking-tighter">
                  {debtData.totalPaid.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Falta Quitar
                </p>
                <p className="text-2xl font-black text-amber-400 tracking-tighter">
                  {debtData.totalUnpaid.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
            </div>

            {/* Barra de progresso de quitação */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Progresso de Quitação
                </span>
                <span className="text-xs font-black text-slate-400">
                  {debtData.paidPercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${debtData.paidPercent}%` }}
                />
              </div>
            </div>

            {/* Lista de dívidas pendentes */}
            {debtData.unpaidDebts.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowDebtList((v) => !v)}
                  className="flex items-center gap-2 w-full group mb-3"
                >
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Dívidas Pendentes ({debtData.unpaidDebts.length})
                  </p>
                  <div className="flex-1 border-t border-slate-700/50" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider group-hover:text-slate-400 transition-colors flex items-center gap-1">
                    {showDebtList ? "Ocultar" : "Ver todas"}
                    {showDebtList ? (
                      <FiChevronUp size={12} />
                    ) : (
                      <FiChevronDown size={12} />
                    )}
                  </span>
                </button>

                {showDebtList && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {debtData.unpaidDebts.map((d) => {
                      const isExpanded = expandedDebtId === d.id;
                      return (
                        <div key={d.id}>
                          <button
                            onClick={() =>
                              setExpandedDebtId(isExpanded ? null : d.id)
                            }
                            className="flex justify-between items-center bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 border border-white/5 w-full text-left transition-colors"
                          >
                            <span className="text-sm font-bold text-slate-300 truncate mr-4">
                              {d.description}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-red-400 whitespace-nowrap">
                                {Math.abs(Number(d.amount)).toLocaleString(
                                  "pt-BR",
                                  { style: "currency", currency: "BRL" },
                                )}
                              </span>
                              {isExpanded ? (
                                <FiChevronUp
                                  className="text-slate-500"
                                  size={14}
                                />
                              ) : (
                                <FiChevronDown
                                  className="text-slate-500"
                                  size={14}
                                />
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="bg-white/3 rounded-b-xl border border-t-0 border-white/5 px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                              {d.observation && (
                                <div className="flex items-start gap-2">
                                  <FiFileText
                                    className="text-slate-600 mt-0.5"
                                    size={13}
                                  />
                                  <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                      Observação
                                    </p>
                                    <p className="text-xs text-slate-400 font-bold">
                                      {d.observation}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {d.due_date && (
                                <div className="flex items-center gap-2">
                                  <FiCalendar
                                    className="text-slate-600"
                                    size={13}
                                  />
                                  <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                      Vencimento
                                    </p>
                                    <p className="text-xs text-slate-400 font-bold">
                                      {new Date(
                                        d.due_date + "T12:00:00",
                                      ).toLocaleDateString("pt-BR")}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {d.competence_date && (
                                <div className="flex items-center gap-2">
                                  <FiCalendar
                                    className="text-slate-600"
                                    size={13}
                                  />
                                  <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                      Competência
                                    </p>
                                    <p className="text-xs text-slate-400 font-bold">
                                      {new Date(
                                        d.competence_date + "T12:00:00",
                                      ).toLocaleDateString("pt-BR")}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {d.payment_method && (
                                <div className="flex items-center gap-2">
                                  <FiCreditCard
                                    className="text-slate-600"
                                    size={13}
                                  />
                                  <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                      Forma de Pagamento
                                    </p>
                                    <p className="text-xs text-slate-400 font-bold">
                                      {d.payment_method}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {d.total_installments &&
                                d.total_installments > 1 && (
                                  <div className="flex items-center gap-2">
                                    <FiBarChart2
                                      className="text-slate-600"
                                      size={13}
                                    />
                                    <div>
                                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                        Parcelas
                                      </p>
                                      <p className="text-xs text-slate-400 font-bold">
                                        {d.installment_number || "?"} de{" "}
                                        {d.total_installments}
                                      </p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
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
