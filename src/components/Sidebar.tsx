"use client";

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
} from "react-icons/fi";
import supabase from "../lib/supabaseClient";
import { useAuth } from "./AuthProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isActive = (path: string) => pathname === path;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const email = user?.email ?? "Convidado";
  const initials = email.charAt(0).toUpperCase();

  return (
    <aside className="w-72 border-r border-slate-200 min-h-screen bg-white flex flex-col p-6 relative">
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
            <span className="text-white font-bold text-xl italic">$</span>
          </div>
          <span className="font-black text-xl tracking-tighter text-slate-900 italic">
            Finnan.
          </span>
        </div>
        {/* TODO: notificações */}
        <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
          <FiBell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
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

        {[
          { name: "Dashboard", href: "/dashboard", icon: FiHome },
          { name: "Importar", href: "/dashboard/import", icon: FiUpload },
          { name: "Transações", href: "/dashboard/transactions", icon: FiList },
          { name: "Relatórios", href: "/dashboard/reports", icon: FiPieChart },
          { name: "Categorias", href: "/dashboard/categories", icon: FiGrid },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
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
              <span className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-tighter">
                Premium
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
    </aside>
  );
}
