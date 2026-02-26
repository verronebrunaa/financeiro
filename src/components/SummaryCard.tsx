"use client";

import React from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

export function SummaryCard({
  title,
  value,
  icon,
  color,
  bg,
}: SummaryCardProps) {
  return (
    <div className="group relative bg-white p-6 rounded-4xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 ease-in-out hover:-translate-y-1 overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-240 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${bg}`}
      />

      <div className="flex flex-col h-full  justify-between">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-transform duration-500 group-hover:rotate-[10deg]`}
          >
            {icon}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-2">
            {title}
          </p>
        </div>

        <div>
          <h3 className={`text-2xl font-black tracking-tighter ${color}`}>
            {value}
          </h3>
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ${bg.replace("bg-", "bg-").replace("-50", "-500")}`}
      />
    </div>
  );
}
