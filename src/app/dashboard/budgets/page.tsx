"use client";

import Sidebar from "@/components/Sidebar";
import BudgetManager from "@/components/BudgetManager";

export default function BudgetsPage() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 pt-18 sm:p-8 lg:p-12 lg:pt-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter italic">
              Orçamentos<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2 text-sm sm:text-lg">
              Defina limites mensais por categoria e acompanhe seus gastos.
            </p>
          </header>

          <BudgetManager />
        </div>
      </main>
    </div>
  );
}
