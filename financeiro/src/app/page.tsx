"use client";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiTrendingUp,
  FiPieChart,
  FiLock,
} from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white italic shadow-lg shadow-blue-200">
            $
          </div>
          <span className="font-black text-2xl tracking-tighter italic">
            Finan.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
          <a
            href="#funcionalidades"
            className="hover:text-blue-600 transition-colors"
          >
            Funcionalidades
          </a>
          <a
            href="#seguranca"
            className="hover:text-blue-600 transition-colors"
          >
            Segurança
          </a>
        </div>
        <Link
          href="/login"
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          Acessar Painel
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest animate-bounce">
              <FiTrendingUp /> Novo: Importação de PDF inteligente
            </div>

            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] italic">
              Suas finanças <br />
              <span className="text-blue-600">sob controle.</span>
            </h1>

            <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Organize seus gastos, importe extratos bancários e visualize sua
              evolução financeira com uma interface pensada para sua
              produtividade.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/login"
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
              >
                Começar agora{" "}
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-3xl font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
              >
                Ver Demo
              </Link>
            </div>

            <div className="flex items-center gap-6 justify-center lg:justify-start pt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <FiCheckCircle className="text-emerald-500" /> Grátis para
                começar
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <FiShield className="text-emerald-500" /> 100% Seguro
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 bg-linear-to-tr from-blue-500 to-indigo-600 rounded-[40px] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white rounded-[40px] border border-slate-200 shadow-2xl p-4 transform lg:rotate-2 group-hover:rotate-0 transition-transform duration-700">
              <div className="bg-slate-50 rounded-4xl p-6 space-y-6">
                {/* Mockup Simples da Tabela Interna */}
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-slate-200 rounded-full animate-pulse"></div>
                  <div className="h-8 w-8 bg-blue-100 rounded-lg"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                        <div className="space-y-1">
                          <div className="h-3 w-20 bg-slate-200 rounded-full"></div>
                          <div className="h-2 w-12 bg-slate-100 rounded-full"></div>
                        </div>
                      </div>
                      <div className="h-4 w-16 bg-emerald-50 rounded-full"></div>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <div className="h-10 w-full bg-slate-900 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Seção de Features Rápidas */}
      <section
        id="funcionalidades"
        className="bg-white border-y border-slate-200 py-24"
      >
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-12">
          <Feature
            icon={<FiPieChart size={32} />}
            title="Relatórios Visuais"
            desc="Entenda para onde vai cada centavo com gráficos gerados automaticamente."
          />
          <Feature
            icon={<FiUpload size={32} />}
            title="Importação Inteligente"
            desc="Arraste seu PDF ou CSV e deixe que o Finna categorize tudo para você."
          />
          <Feature
            icon={<FiLock size={32} />}
            title="Dados Protegidos"
            desc="Criptografia de ponta a ponta e segurança baseada no Supabase Auth."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="space-y-4 group">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-900 tracking-tight">
        {title}
      </h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

import { FiUpload } from "react-icons/fi";
