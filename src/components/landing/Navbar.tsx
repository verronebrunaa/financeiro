"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white italic shadow-lg shadow-blue-200">
            $
          </div>
          <span className="font-black text-2xl tracking-tighter italic">
            Finnan<span className="text-blue-600">.</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <a
            href="#funcionalidades"
            className="hover:text-blue-600 transition-colors"
          >
            Funcionalidades
          </a>
          {/*<a href="#seguranca" className="hover:text-blue-600 transition-colors">Segurança</a>*/}
        </div>
        <Link
          href="/login"
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          Acessar Painel
        </Link>
      </div>
    </nav>
  );
}
