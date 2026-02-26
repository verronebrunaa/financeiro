"use client";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiTrendingUp,
  FiPieChart,
  FiLock,
  FiUpload,
} from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden flex flex-col scroll-smooth">
      {/* Navbar com Blur */}
      <nav className="sticky top-0 z-50 w-full bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white italic shadow-lg shadow-blue-200">
              $
            </div>
            <span className="font-black text-2xl tracking-tighter italic">
              Finan<span className="text-blue-600">.</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
            <a href="#seguranca" className="hover:text-blue-600 transition-colors">Segurança</a>
          </div>
          <Link
            href="/login"
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            Acessar Painel
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-blue-100 shadow-sm">
              <FiTrendingUp className="animate-pulse" /> Novo: Importação Inteligente
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] italic">
              Suas finanças <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                sob controle.
              </span>
            </h1>

            <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Organize seus gastos, importe extratos e visualize sua evolução com a interface mais rápida do mercado.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/login"
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
              >
                Começar agora
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-3xl font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm active:scale-95"
              >
                Ver Demo
              </Link>
            </div>

            <div className="flex items-center gap-6 justify-center lg:justify-start pt-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <FiCheckCircle className="text-emerald-500" /> Grátis para começar
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <FiShield className="text-emerald-500" /> 100% Seguro
              </div>
            </div>
          </div>

          {/* Mockup flutuante */}
          <div className="relative group perspective-1000 hidden md:block">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[40px] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
            <div className="relative bg-white rounded-[40px] border border-slate-200 shadow-2xl p-4 transform lg:rotate-3 group-hover:rotate-0 transition-all duration-1000 hover:scale-[1.02]">
              <div className="bg-slate-50 rounded-[32px] p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-slate-200 rounded-full animate-pulse"></div>
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">$</div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {i === 2 ? <FiTrendingUp /> : <FiTrendingUp className="rotate-180" />}
                        </div>
                        <div className="space-y-1">
                          <div className={`h-3 ${i === 1 ? 'w-24' : 'w-32'} bg-slate-200 rounded-full`}></div>
                          <div className="h-2 w-12 bg-slate-100 rounded-full"></div>
                        </div>
                      </div>
                      <div className={`h-4 w-16 ${i === 2 ? 'bg-emerald-100' : 'bg-slate-100'} rounded-full`}></div>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <div className="h-12 w-full bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                    Processar Extrato
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section id="funcionalidades" className="bg-white border-y border-slate-200 py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Funcionalidades</h2>
            <p className="text-4xl font-black text-slate-900 tracking-tighter italic">Tudo que você precisa em um só lugar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <Feature
              icon={<FiPieChart size={32} />}
              title="Relatórios Visuais"
              desc="Entenda para onde vai cada centavo com gráficos gerados automaticamente e insights inteligentes."
            />
            <Feature
              icon={<FiUpload size={32} />}
              title="Importação IA"
              desc="Nossa tecnologia lê seus PDFs e CSVs categorizando transações em segundos. Zero trabalho manual."
            />
            <Feature
              icon={<FiLock size={32} />}
              title="Dados Blindados"
              desc="Utilizamos os protocolos de segurança mais rígidos do mercado para garantir que seus dados sejam só seus."
            />
          </div>
        </div>
      </section>

      <footer className="w-full bg-slate-900 text-white py-12 px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">$</div>
              <span className="font-black text-xl tracking-tight italic">Finan.</span>
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest italic">
              Simplificando sua vida financeira.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
             <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} Finan - Todos os direitos reservados</span>
             <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Desenvolvido com ❤️ por</span>
                <a href="https://verronebruna.vercel.app/" target="_blank" className="font-black text-blue-400 hover:text-white transition-colors uppercase tracking-tighter italic border-b border-blue-400/30">verrone dev</a>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="space-y-6 group p-8 rounded-[32px] hover:bg-slate-50 transition-all duration-500 border border-transparent hover:border-slate-100">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm shadow-blue-100">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">
        {title}
      </h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}