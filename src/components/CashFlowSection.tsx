"use client";

import { FiDollarSign } from "react-icons/fi";
import TransactionCard from "./TransactionCard";
import type { Tx } from "@/hooks/useDashboardData";

interface CashFlowProps {
  recent: Tx[];
  upcoming: Tx[];
  empty: boolean;
}

export function CashFlowSection({
  recent,
  upcoming,
  empty,
}: Readonly<CashFlowProps>) {
  return (
    <section className="bg-white rounded-4xl sm:rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
        <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-widest italic">
          Fluxo de Caixa Rápido
        </h3>
        <button
          className="px-5 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest"
          onClick={() => (globalThis.location.href = "/dashboard/transactions")}
        >
          Histórico Completo
        </button>
      </div>

      <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 sm:mb-6 tracking-[0.2em] ml-1">
            Últimos Lançamentos
          </h4>
          <div className="space-y-3 sm:space-y-4">
            {empty ? (
              <EmptyState />
            ) : (
              recent.map((t) => <TransactionCard key={t.id} t={t} />)
            )}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-black text-blue-600 uppercase mb-4 sm:mb-6 tracking-[0.2em] ml-1">
            Próximos Compromissos
          </h4>
          <div className="space-y-3 sm:space-y-4">
            {upcoming.length === 0 ? (
              <EmptyState message="Tudo em dia por aqui!" />
            ) : (
              upcoming.map((t) => <TransactionCard key={t.id} t={t} />)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyState({ message = "Nenhuma transação encontrada." }) {
  return (
    <div className="py-8 sm:py-10 text-center bg-slate-50/50 rounded-3xl sm:rounded-4xl border-2 border-dashed border-slate-100">
      <FiDollarSign className="text-slate-200 mx-auto mb-2" size={32} />
      <p className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest italic">
        {message}
      </p>
    </div>
  );
}
