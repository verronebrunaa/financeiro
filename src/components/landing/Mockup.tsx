"use client";

import { FiTrendingUp } from "react-icons/fi";

export default function Mockup() {
  return (
    <div className="relative group perspective-1000 hidden md:block">
      <div className="absolute -inset-4 bg-linear-to-tr from-blue-500 to-indigo-600 rounded-[40px] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
      <div className="relative bg-white rounded-[40px] border border-slate-200 shadow-2xl p-4 transform lg:rotate-3 group-hover:rotate-0 transition-all duration-1000 hover:scale-[1.02]">
        <div className="bg-slate-50 rounded-4xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 bg-slate-200 rounded-full animate-pulse"></div>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              $
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 2 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                  >
                    {i === 2 ? (
                      <FiTrendingUp />
                    ) : (
                      <FiTrendingUp className="rotate-180" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`h-3 ${i === 1 ? "w-24" : "w-32"} bg-slate-200 rounded-full`}
                    ></div>
                    <div className="h-2 w-12 bg-slate-100 rounded-full"></div>
                  </div>
                </div>
                <div
                  className={`h-4 w-16 ${i === 2 ? "bg-emerald-100" : "bg-slate-100"} rounded-full`}
                ></div>
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
  );
}
