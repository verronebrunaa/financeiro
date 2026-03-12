"use client";

import ImportManager from "@/components/ImportManager";
import Sidebar from "@/components/Sidebar";
import UpgradeGate from "@/components/UpgradeGate";

export default function Page() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 pt-18 sm:p-8 lg:p-12 lg:pt-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter italic">
              Importar Dados<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2 text-base sm:text-lg">
              Alimente seu sistema com arquivos CSV ou PDF.
            </p>
          </header>

          <UpgradeGate feature="import_csv" label="A importação de dados está disponível nos planos pagos">
            <ImportManager />
          </UpgradeGate>
        </div>
      </main>
    </div>
  );
}
