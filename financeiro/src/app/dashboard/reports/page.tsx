import Sidebar from "@/components/Sidebar";
import ReportsManager from "@/components/ReportsManager";

export default function ReportsPage() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
              Relatórios<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2 text-lg">
              Analise seu comportamento financeiro e tome decisões melhores.
            </p>
          </header>

          <ReportsManager />
        </div>
      </main>
    </div>
  );
}
