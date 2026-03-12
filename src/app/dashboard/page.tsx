"use client";

import Sidebar from "../../components/Sidebar";
import { DashboardSummary } from "@/components/DashboardSummary";
import { CashFlowSection } from "@/components/CashFlowSection";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function DashboardPage() {
  const { summaries, recent, upcoming, txs } = useDashboardData();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 pt-18 sm:p-8 lg:p-12 lg:pt-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter italic">
              Dashboard<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 font-bold mt-1 sm:mt-2 text-sm sm:text-lg">
              Resumo do seu patrimônio em tempo real.
            </p>
          </header>

          <DashboardSummary summaries={summaries} />
          <CashFlowSection
            recent={recent}
            upcoming={upcoming}
            empty={txs.length === 0}
          />
        </div>
      </main>
    </div>
  );
}
