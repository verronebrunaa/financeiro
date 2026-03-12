"use client";

import { useEffect, useState, useMemo } from "react";
import supabase from "../lib/supabaseClient";

export type Tx = {
  id: string;
  description: string;
  amount: number;
  category?: string;
  due_date: string;
  competence_date: string;
  status?: string;
  type: "entrada" | "saida";
};

type Category = {
  id: string;
  name: string;
  parent_id?: string | null;
};

export function useDashboardData() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        const [txResult, catResult] = await Promise.all([
          supabase
            .from("transactions")
            .select("*")
            .order("due_date", { ascending: false })
            .limit(100),
          supabase.from("categories").select("id, name, parent_id"),
        ]);

        if (txResult.error) throw txResult.error;
        if (isMounted) {
          setTxs((txResult.data as Tx[]) || []);
          setCategories(catResult.data || []);
        }
      } catch (err) {
        console.error("Erro ao carregar transações:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("public:transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTxs((prev) => [payload.new as Tx, ...prev]);
          }
          if (payload.eventType === "UPDATE") {
            const rec = payload.new as Tx;
            setTxs((prev) => prev.map((p) => (p.id === rec.id ? rec : p)));
          }
          if (payload.eventType === "DELETE") {
            const rec = payload.old as Tx;
            setTxs((prev) => prev.filter((p) => p.id !== rec.id));
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, []);

  const isDebt = useMemo(() => {
    return (catValue?: string) => {
      if (!catValue) return false;
      const cat = categories.find(
        (c) => c.id === catValue || c.name === catValue,
      );
      if (!cat) return catValue === "Divida";
      if (cat.name === "Divida") return true;
      if (cat.parent_id) {
        const parent = categories.find((c) => c.id === cat.parent_id);
        return parent?.name === "Divida";
      }
      return false;
    };
  }, [categories]);

  const summaries = useMemo(() => {
    const currentYearMonth = todayStr.substring(0, 7);

    let debts = 0;
    let monthlyExpenses = 0;
    let receipts = 0;
    let overdue = 0;

    txs.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const txMonth = t.due_date?.substring(0, 7);
      const isPaid = t.status === "Pago";
      const isDivida = isDebt(t.category);

      if (isDivida && !isPaid) {
        debts += Math.abs(amt);
      }

      if (t.due_date && t.due_date < todayStr && !isPaid && amt < 0 && !isDivida) {
        overdue += Math.abs(amt);
      }

      if (txMonth === currentYearMonth && !isDivida) {
        if (amt < 0) {
          monthlyExpenses += Math.abs(amt);
        } else {
          receipts += amt;
        }
      }
    });

    return { debts, monthlyExpenses, receipts, overdue };
  }, [txs, todayStr, isDebt]);

  const upcoming = useMemo(
    () =>
      txs
        .filter((t) => t.due_date >= todayStr && t.status !== "Pago")
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 4),
    [txs, todayStr],
  );

  const recent = useMemo(() => txs.slice(0, 4), [txs]);

  return { txs, loading, summaries, recent, upcoming, todayStr };
}
