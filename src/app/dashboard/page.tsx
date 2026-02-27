"use client";

import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/Sidebar";
import TransactionCard from "../../components/TransactionCard";
import supabase from "../../lib/supabaseClient";
import {
  FiTrendingDown,
  FiTrendingUp,
  FiDollarSign,
  FiAlertCircle,
} from "react-icons/fi";
import { SummaryCard } from "@/components/SummaryCard";

type Tx = {
  id: string;
  description: string;
  amount: number;
  category?: string;
  due_date: string;
  competence_date: string;
  status?: string;
  type: "entrada" | "saida";
};

export default function DashboardPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  // Pega a data de hoje no formato YYYY-MM-DD para comparações seguras
  const todayStr = new Date().toLocaleDateString('en-CA'); 

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("due_date", { ascending: false })
          .limit(100);
        
        if (error) throw error;
        if (isMounted) setTxs((data as Tx[]) || []);
      } catch (err) {
        console.error("Erro ao carregar transações:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("public:transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const rec = payload.new as Tx;
            setTxs((prev) => [rec, ...prev]);
          }
          if (payload.eventType === "UPDATE") {
            const rec = payload.new as Tx;
            setTxs((prev) => prev.map((p) => (p.id === rec.id ? rec : p)));
          }
          if (payload.eventType === "DELETE") {
            const rec = payload.old as Tx;
            setTxs((prev) => prev.filter((p) => p.id !== rec.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, []);

  const summaries = useMemo(() => {
    const currentYearMonth = todayStr.substring(0, 7); // "YYYY-MM"

    let debts = 0;
    let monthlyExpenses = 0;
    let receipts = 0;
    let overdue = 0;

    txs.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const txMonth = t.due_date?.substring(0, 7);
      const isPaid = t.status === "Pago";

      // 1. Dívidas: Apenas se a categoria for 'Divida' (Valor absoluto para o card)
      if (t.category === "Divida") {
        debts += Math.abs(amt);
      }

      // 2. Em Atraso: Se a data de vencimento for menor que hoje E não estiver pago
      if (t.due_date && t.due_date < todayStr && !isPaid && amt < 0) {
        overdue += Math.abs(amt);
      }

      // 3. Métricas do Mês Atual (Baseado no vencimento)
      if (txMonth === currentYearMonth) {
        if (amt < 0) {
          monthlyExpenses += Math.abs(amt);
        } else {
          receipts += amt;
        }
      }
    });

    return { debts, monthlyExpenses, receipts, overdue };
  }, [txs, todayStr]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
              Dashboard<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2 text-lg">
              Resumo do seu patrimônio em tempo real.
            </p>
          </header>

          {/* Grid de SummaryCards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <SummaryCard
              title="Total em Dívidas"
              value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summaries.debts)}
              icon={<FiTrendingDown />}
              color="text-red-600"
              bg="bg-red-50"
            />
            <SummaryCard
              title="Gastos do Mês"
              value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summaries.monthlyExpenses)}
              icon={<FiDollarSign />}
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <SummaryCard
              title="Recebimentos"
              value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summaries.receipts)}
              icon={<FiTrendingUp />}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <SummaryCard
              title="Total em Atraso"
              value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summaries.overdue)}
              icon={<FiAlertCircle />}
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </div>

          <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest italic">
                Fluxo de Caixa Rápido
              </h3>
              <button
                className="px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest"
                onClick={() => (globalThis.location.href = "/dashboard/transactions")}
              >
                Histórico Completo
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Coluna 1: Recentes (Últimos lançamentos) */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-[0.2em] ml-1">
                  Últimos Lançamentos
                </h4>
                <div className="space-y-4">
                  {txs.length === 0 ? (
                    <EmptyState />
                  ) : (
                    txs.slice(0, 4).map((t) => <TransactionCard key={t.id} t={t} />)
                  )}
                </div>
              </div>

              {/* Coluna 2: Futuro (Próximos vencimentos) */}
              <div>
                <h4 className="text-[10px] font-black text-blue-600 uppercase mb-6 tracking-[0.2em] ml-1">
                  Próximos Compromissos
                </h4>
                <div className="space-y-4">
                  {txs.filter(t => t.due_date >= todayStr && t.status !== "Pago").length === 0 ? (
                    <EmptyState message="Tudo em dia por aqui!" />
                  ) : (
                    txs
                      .filter(t => t.due_date >= todayStr && t.status !== "Pago")
                      .sort((a, b) => a.due_date.localeCompare(b.due_date))
                      .slice(0, 4)
                      .map((t) => <TransactionCard key={t.id} t={t} />)
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ message = "Nenhuma transação encontrada." }) {
  return (
    <div className="py-10 text-center bg-slate-50/50 rounded-4xl border-2 border-dashed border-slate-100">
      <FiDollarSign className="text-slate-200 mx-auto mb-2" size={32} />
      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest italic">{message}</p>
    </div>
  );
}