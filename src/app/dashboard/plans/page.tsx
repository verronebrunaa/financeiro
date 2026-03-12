"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FiCheck,
  FiZap,
  FiStar,
  FiArrowRight,
  FiShield,
  FiRefreshCw,
} from "react-icons/fi";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription, type Plan } from "@/hooks/useSubscription";
import { useToast } from "@/components/ToastProvider";

const PLANS = [
  {
    id: "free" as Plan,
    name: "Grátis",
    price: 0,
    description: "Para começar a organizar suas finanças",
    icon: FiShield,
    color: "slate",
    features: [
      "Até 50 transações/mês",
      "5 categorias",
      "Gráfico de pizza básico",
      "Histórico de 3 meses",
    ],
    limitations: [
      "Sem relatórios avançados",
      "Sem Finnan Intelligence",
      "Sem importação CSV",
      "Sem operações em lote",
    ],
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    price: 19.9,
    description: "Para quem leva as finanças a sério",
    icon: FiZap,
    color: "blue",
    popular: true,
    features: [
      "Transações ilimitadas",
      "Categorias ilimitadas",
      "Todos os gráficos e relatórios",
      "Finnan Intelligence (insights IA)",
      "Nuvem de Dívidas",
      "Operações em lote",
      "Importação CSV",
      "Histórico de 12 meses",
      "Suporte por e-mail",
    ],
    limitations: ["Sem exportação PDF", "Sem histórico ilimitado"],
  },
  {
    id: "premium" as Plan,
    name: "Premium",
    price: 39.9,
    description: "Controle total e ferramentas profissionais",
    icon: FiStar,
    color: "amber",
    features: [
      "Tudo do Pro +",
      "Exportação de relatórios em PDF",
      "Histórico ilimitado",
      "Suporte prioritário",
      "Acesso antecipado a novidades",
    ],
    limitations: [],
  },
];

export default function PlansPage() {
  const { user } = useAuth();
  const { subscription, loading: subLoading, refresh } = useSubscription();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Handle return from Mercado Pago
  const status = searchParams.get("status");
  const returnedPlan = searchParams.get("plan");

  React.useEffect(() => {
    if (status === "success" && returnedPlan) {
      toast.show({
        title: "Pagamento aprovado!",
        message: `Sua Assinatura ${returnedPlan === "pro" ? "Pro" : "Premium"} já está ativa. Aproveite!`,
        variant: "success",
      });
      refresh();
    } else if (status === "failure") {
      toast.show({
        title: "Pagamento não aprovado",
        message: "Houve um problema com o pagamento. Tente novamente.",
        variant: "error",
      });
    } else if (status === "pending") {
      toast.show({
        title: "Pagamento pendente",
        message: "Seu pagamento está sendo processado. Atualizaremos em breve.",
        variant: "info",
      });
    }
  }, [status, returnedPlan, toast, refresh]);

  const handleSubscribe = async (plan: Plan) => {
    if (!user) return;
    setLoadingPlan(plan);

    try {
      const res = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const data = await res.json();
      if (data.init_point) {
        globalThis.location.href = data.init_point;
      } else {
        toast.show({
          title: "Erro",
          message: data.error || "Erro ao criar pagamento",
          variant: "error",
        });
      }
    } catch {
      toast.show({
        title: "Erro",
        message: "Erro ao conectar com Mercado Pago",
        variant: "error",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const colorMap: Record<
    string,
    {
      bg: string;
      text: string;
      border: string;
      badge: string;
      btn: string;
      btnHover: string;
    }
  > = {
    slate: {
      bg: "bg-slate-50",
      text: "text-slate-600",
      border: "border-slate-200",
      badge: "bg-slate-100 text-slate-700",
      btn: "bg-slate-900 text-white",
      btnHover: "hover:bg-slate-800",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-700",
      btn: "bg-blue-600 text-white",
      btnHover: "hover:bg-blue-700",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      btn: "bg-amber-500 text-white",
      btnHover: "hover:bg-amber-600",
    },
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 pt-18 sm:p-8 lg:p-12 lg:pt-12 custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 sm:mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter italic">
              Assinatura<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2 text-base sm:text-lg max-w-xl mx-auto">
              Escolha a Assinatura ideal para suas necessidades financeiras. Cancele
              quando quiser.
            </p>
          </header>

          {/* Current plan badge */}
          {!subLoading && (
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Assinatura atual:{" "}
                <span className="font-black text-slate-900 uppercase">
                  {subscription.plan}
                </span>
                {subscription.currentPeriodEnd &&
                  subscription.plan !== "free" && (
                    <span className="text-xs text-slate-400 font-medium">
                      · válido até{" "}
                      {new Date(
                        subscription.currentPeriodEnd,
                      ).toLocaleDateString("pt-BR")}
                    </span>
                  )}
              </span>
            </div>
          )}

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {PLANS.map((plan) => {
              const colors = colorMap[plan.color];
              const isCurrent = subscription.plan === plan.id;
              const isUpgrade =
                plan.id !== "free" &&
                (subscription.plan === "free" ||
                  (subscription.plan === "pro" && plan.id === "premium"));
              const isDowngrade =
                (subscription.plan === "premium" && plan.id === "pro") ||
                (subscription.plan !== "free" && plan.id === "free");

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-3xl border-2 ${
                    plan.popular
                      ? "border-blue-300 shadow-xl shadow-blue-100/50 scale-[1.02]"
                      : isCurrent
                        ? `${colors.border} shadow-lg`
                        : "border-slate-100 shadow-sm"
                  } p-6 sm:p-8 flex flex-col transition-all hover:shadow-lg`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 ${colors.bg} rounded-2xl`}>
                      <plan.icon className={colors.text} size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div className="text-3xl font-black text-slate-900">
                        R$0{" "}
                        <span className="text-sm font-bold text-slate-400 ml-1">
                          /mês
                        </span>
                      </div>
                    ) : (
                      <div className="text-3xl font-black text-slate-900">
                        R${plan.price.toFixed(2).replace(".", ",")}
                        <span className="text-sm font-bold text-slate-400 ml-1">
                          /mês
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm font-medium text-slate-700"
                      >
                        <FiCheck
                          className={`${colors.text} mt-0.5 shrink-0`}
                          size={16}
                        />
                        {f}
                      </li>
                    ))}
                    {plan.limitations.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm font-medium text-slate-400 line-through"
                      >
                        <span className="mt-0.5 shrink-0 w-4 text-center">
                          ✕
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <div className="w-full py-3 rounded-2xl text-center text-sm font-black bg-slate-100 text-slate-500">
                      Assinatura Atual
                    </div>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={!!loadingPlan}
                      className={`w-full py-3 rounded-2xl text-sm font-black ${colors.btn} ${colors.btnHover} transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-lg`}
                    >
                      {loadingPlan === plan.id ? (
                        <>
                          <FiRefreshCw className="animate-spin" size={16} />
                          Processando...
                        </>
                      ) : (
                        <>
                          Assinar {plan.name}
                          <FiArrowRight size={16} />
                        </>
                      )}
                    </button>
                  ) : isDowngrade ? (
                    <div className="w-full py-3 rounded-2xl text-center text-xs font-bold text-slate-400">
                      Entre em contato para downgrade
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="mt-12 text-center space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <FiShield size={14} />
                Pagamento seguro via Mercado Pago
              </span>
              <span className="flex items-center gap-1.5">
                <FiRefreshCw size={14} />
                Cancele quando quiser
              </span>
              <span className="flex items-center gap-1.5">
                <FiCheck size={14} />
                Suporte Pix, cartão e boleto
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
