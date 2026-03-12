"use client";

import React from "react";
import { FiLock, FiZap } from "react-icons/fi";
import Link from "next/link";
import { useSubscription, type Feature } from "@/hooks/useSubscription";

/**
 * Wraps premium features with a paywall overlay.
 * If user has access, renders children normally.
 * Otherwise shows a locked overlay with upgrade CTA.
 */
export default function UpgradeGate({
  feature,
  children,
  label,
}: Readonly<{
  feature: Feature;
  children: React.ReactNode;
  label?: string;
}>) {
  const { canUse, loading } = useSubscription();

  if (loading) return <>{children}</>;
  if (canUse(feature)) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred content behind */}
      <div className="blur-sm pointer-events-none select-none opacity-50">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-center z-10 pt-8 sm:pt-12">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-3xl p-6 sm:p-8 text-center max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="inline-flex p-4 bg-blue-50 rounded-2xl mb-4">
            <FiLock className="text-blue-600" size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">
            Recurso Premium
          </h3>
          <p className="text-sm text-slate-500 font-medium mb-6">
            {label || "Este recurso está disponível nos planos pagos."}
            {" "}Faça upgrade para desbloquear.
          </p>
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl transition-all active:scale-95 shadow-lg"
          >
            <FiZap size={16} />
            Ver Planos
          </Link>
        </div>
      </div>
    </div>
  );
}
