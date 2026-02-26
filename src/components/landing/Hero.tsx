"use client";

import Link from "next/link";
import {
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";

export default function Hero() {
  return (
    <div className="space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left duration-1000">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-blue-100 shadow-sm">
        <FiTrendingUp className="animate-pulse" /> Novo: Importação Inteligente
      </div>
      <h1 className="text-6xl md:text-8xl leading-[0.85] font-black tracking-tighter italic">
        Suas finanças <br />
        <span className="text-transparent line-clamp-none bg-clip-text bg-linear-to-r from-blue-600 to-indigo-500">
          sob controle.
        </span>
      </h1>
      <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
        Organize seus gastos, importe extratos e visualize sua evolução com a
        interface mais rápida do mercado.
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
  );
}
