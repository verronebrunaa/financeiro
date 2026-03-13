"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import supabase from "../lib/supabaseClient";
import { useAuth } from "../components/AuthProvider";

export type Plan = "free" | "pro" | "premium";

type Subscription = {
  plan: Plan;
  status: string;
  currentPeriodEnd: string | null;
};

type SubscriptionContextValue = {
  subscription: Subscription;
  loading: boolean;
  isPro: boolean;
  isPremium: boolean;
  isPaid: boolean;
  refresh: () => Promise<void>;
  canUse: (feature: Feature) => boolean;
};

export type Feature =
  | "unlimited_transactions"
  | "unlimited_categories"
  | "all_charts"
  | "insights"
  | "debt_cloud"
  | "bulk_operations"
  | "import_csv"
  | "export_pdf"
  | "full_history";

const FEATURE_ACCESS: Record<Feature, Plan[]> = {
  unlimited_transactions: ["pro", "premium"],
  unlimited_categories: ["pro", "premium"],
  all_charts: ["free", "pro", "premium"],
  insights: ["pro", "premium"],
  debt_cloud: ["pro", "premium"],
  bulk_operations: ["pro", "premium"],
  import_csv: ["pro", "premium"],
  export_pdf: ["premium"],
  full_history: ["premium"],
};

const FREE_LIMITS = {
  transactions_per_month: 50,
  categories: 5,
};

export { FREE_LIMITS };

const defaultSub: Subscription = {
  plan: "free",
  status: "active",
  currentPeriodEnd: null,
};

const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscription: defaultSub,
  loading: true,
  isPro: false,
  isPremium: false,
  isPaid: false,
  refresh: async () => {},
  canUse: () => false,
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export default function SubscriptionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>(defaultSub);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(defaultSub);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        setSubscription(defaultSub);
      } else {
        // Check if subscription has expired
        const isExpired =
          data.current_period_end &&
          new Date(data.current_period_end) < new Date();

        setSubscription({
          plan: isExpired ? "free" : (data.plan as Plan),
          status: isExpired ? "expired" : data.status,
          currentPeriodEnd: data.current_period_end,
        });
      }
    } catch {
      setSubscription(defaultSub);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPro = subscription.plan === "pro" || subscription.plan === "premium";
  const isPremium = subscription.plan === "premium";
  const isPaid = isPro;

  const canUse = useCallback(
    (feature: Feature) => {
      const allowedPlans = FEATURE_ACCESS[feature];
      return allowedPlans.includes(subscription.plan);
    },
    [subscription.plan],
  );

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        isPro,
        isPremium,
        isPaid,
        refresh: fetchSubscription,
        canUse,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
