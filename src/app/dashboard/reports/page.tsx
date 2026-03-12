"use client";

import Sidebar from "@/components/Sidebar";
import ReportsManager from "@/components/ReportsManager";
import UpgradeGate from "@/components/UpgradeGate";

export default function ReportsPage() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 pt-18 sm:p-8 lg:p-12 lg:pt-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter italic">
              Relatórios<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2 text-base sm:text-lg">
              Analise seu comportamento financeiro e tome decisões melhores.
            </p>
          </header>

          <UpgradeGate feature="all_charts" label="Relatórios avançados, gráficos e Finnan Intelligence estão disponíveis nos planos pagos">
            <ReportsManager />
          </UpgradeGate>
        </div>
      </main>
    </div>
  );
}
