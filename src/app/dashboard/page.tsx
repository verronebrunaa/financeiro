"use client";

import React, { useEffect, useState } from "react";
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
  due_date: string;
  id: string;
  date?: string;
  description: string;
  amount: number;
  category?: string;
  metadata?: any;
};

export default function DashboardPage() {
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false })
          .limit(100);
        if (error) throw error;
        if (!isMounted) return;
        setTxs((data as any) || []);
      } catch (err) {
        console.error("Erro ao carregar transações:", err);
      }
    }

    load();

    // realtime listener for transactions
    const channel = supabase
      .channel("public:transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          // Use correct property for each event type
          setTxs((prev) => {
            if (payload.eventType === "INSERT") {
              const rec = (payload as any).new;
              return [rec, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const rec = (payload as any).new;
              return prev.map((p) => (p.id === rec.id ? rec : p));
            }
            if (payload.eventType === "DELETE") {
              const rec = (payload as any).old;
              return prev.filter((p) => p.id !== rec.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      try {
        channel.unsubscribe();
      } catch (e) {}
    };
  }, []);

  function handleFile(f: File) {
    console.log("Arquivo recebido:", f.name);
  }

  // compute summaries from transactions
  const summaries = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let debts = 0;
    let monthlyExpenses = 0;
    let receipts = 0;
    let overdue = 0;

    txs.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const date = t.date ? new Date(t.date) : null;

      // debts: categoria 'Divida' ou negative amounts older than 30 days (fallback)
      if (
        t.category === "Divida" ||
        (amt < 0 &&
          date &&
          (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24) > 30)
      ) {
        debts += amt;
      }

      // overdue detection: prefer explicit due_date / paid flag in metadata
      try {
        const meta = (t as any).metadata;
        const paid = meta?.paid;
        const dueStr = meta?.due_date;
        const dueDate = dueStr ? new Date(dueStr) : null;
        if (amt < 0) {
          if (dueDate && dueDate.getTime() < Date.now() && !paid) {
            overdue += amt;
          } else if (!dueDate) {
            // fallback: consider older than 30 days as overdue
            if (date) {
              const ageDays =
                (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
              if (ageDays > 30) overdue += amt;
            }
          }
        }
      } catch (e) {}

      // monthly expenses and receipts (current month)
      if (
        date &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      ) {
        if (amt < 0) monthlyExpenses += amt;
        else receipts += amt;
      }
    });

    return {
      debts: Math.abs(debts),
      monthlyExpenses: Math.abs(monthlyExpenses),
      receipts: receipts,
      overdue: Math.abs(overdue),
    };
  }, [txs]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
              Dashboard<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2 text-lg">
              Bem-vindo ao seu controle financeiro.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryCard
                title="Dívidas"
                value={new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(summaries.debts)}
                icon={<FiTrendingDown />}
                color="text-red-600"
                bg="bg-red-50"
              />
              <SummaryCard
                title="Gastos Mensais"
                value={new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(summaries.monthlyExpenses)}
                icon={<FiDollarSign />}
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <SummaryCard
                title="Recebimentos"
                value={new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(summaries.receipts)}
                icon={<FiTrendingUp />}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
              <SummaryCard
                title="Em Atraso"
                value={new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(summaries.overdue)}
                icon={<FiAlertCircle />}
                color="text-amber-600"
                bg="bg-amber-50"
              />
            </div>
          </div>

          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                Últimas transações
              </h3>
              <button
                className="text-blue-600 font-bold text-sm hover:underline"
                onClick={() =>
                  (window.location.href = "/dashboard/transactions")
                }
              >
                Ver todas
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recentes */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
                  Recentes
                </h4>
                {txs.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <FiDollarSign className="text-slate-300" size={24} />
                    </div>
                    <p className="text-slate-500 font-medium text-sm">
                      Nenhuma transação encontrada.
                    </p>
                  </div>
                ) : (
                  txs
                    .slice(0, 3)
                    .map((t) => <TransactionCard key={t.id} t={t} />)
                )}
              </div>

              {/* Próximas a vencer/receber */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
                  Próximas a vencer/receber
                </h4>
                {txs.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <FiDollarSign className="text-slate-300" size={24} />
                    </div>
                    <p className="text-slate-500 font-medium text-sm">
                      Nenhuma transação encontrada.
                    </p>
                  </div>
                ) : (
                  txs
                    .filter(
                      (t) => t.due_date && new Date(t.due_date) > new Date(),
                    )
                    .sort(
                      (a, b) =>
                        new Date(a.due_date!).getTime() -
                        new Date(b.due_date!).getTime(),
                    )
                    .slice(0, 3)
                    .map((t) => <TransactionCard key={t.id} t={t} />)
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
