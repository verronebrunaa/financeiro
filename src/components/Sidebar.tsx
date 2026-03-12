"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiHome,
  FiUpload,
  FiList,
  FiPieChart,
  FiSettings,
  FiLogOut,
  FiBell,
  FiSearch,
  FiGrid,
  FiMenu,
  FiX,
  FiZap,
  FiTarget,
  FiFlag,
} from "react-icons/fi";
import supabase from "../lib/supabaseClient";
import { useAuth } from "./AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [open, setOpen] = useState(false);
  const isActive = (path: string) => pathname === path;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const email = user?.email ?? "Convidado";
  const initials = email.charAt(0).toUpperCase();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: FiHome },
    { name: "Importar", href: "/dashboard/import", icon: FiUpload },
    { name: "Transações", href: "/dashboard/transactions", icon: FiList },
    { name: "Relatórios", href: "/dashboard/reports", icon: FiPieChart },
    { name: "Categorias", href: "/dashboard/categories", icon: FiGrid },
    { name: "Orçamentos", href: "/dashboard/budgets", icon: FiTarget },
    { name: "Metas", href: "/dashboard/goals", icon: FiFlag },
    { name: "Assinatura", href: "/dashboard/plans", icon: FiZap },
  ];

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
            <span className="text-white font-bold text-xl italic">$</span>
          </div>
          <span className="font-black text-xl tracking-tighter text-slate-900 italic">
            Finnan.
          </span>
        </div>
        <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all max-lg:hidden">
          <FiBell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        <button
          onClick={() => setOpen(false)}
          className="p-2 text-slate-400 hover:text-slate-900 rounded-xl transition-all lg:hidden"
        >
          <FiX size={22} />
        </button>
      </div>

      <div className="mb-8 px-2">
        <div className="relative group">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1.5">
        <p className="px-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">
          Menu Principal
        </p>

        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${
                isActive(item.href)
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold"
              }
            `}
          >
            <item.icon size={20} />
            <span className="text-sm tracking-wide">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-100 flex flex-col gap-1">
        <Link
          href="/dashboard/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition-colors group"
        >
          <FiSettings
            size={20}
            className="group-hover:rotate-45 transition-transform duration-500"
          />
          <span className="text-sm">Configurações</span>
        </Link>

        <div className="mt-2 p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-slate-900 leading-none truncate w-24">
                {email.split("@")[0]}
              </span>
              <span className={`text-[10px] font-bold mt-1 uppercase tracking-tighter ${
                subscription.plan === "premium" ? "text-amber-600" :
                subscription.plan === "pro" ? "text-blue-600" : "text-slate-400"
              }`}>
                {subscription.plan === "free" ? "Free" : subscription.plan === "pro" ? "Pro" : "Premium"}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm active:scale-90"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
        >
          <FiMenu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm italic">$</span>
          </div>
          <span className="font-black text-lg tracking-tighter text-slate-900 italic">
            Finnan.
          </span>
        </div>
        <button className="relative p-2 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
          <FiBell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          lg:hidden fixed top-0 left-0 z-50 w-72 h-full bg-white flex flex-col p-6
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-slate-200 min-h-screen bg-white flex-col p-6 relative">
        {sidebarContent}
      </aside>
    </>
  );
}
