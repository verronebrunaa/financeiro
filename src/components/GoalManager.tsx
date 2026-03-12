"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiFlag,
  FiPlus,
  FiX,
  FiLoader,
  FiTrash2,
  FiCheckCircle,
  FiTrendingUp,
  FiDollarSign,
  FiCalendar,
} from "react-icons/fi";
import supabase from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { useAuth } from "./AuthProvider";

type Goal = {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  status: string;
  created_at: string;
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function GoalManager() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addAmountGoal, setAddAmountGoal] = useState<Goal | null>(null);
  const [addAmountValue, setAddAmountValue] = useState("");

  // Form
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const loadGoals = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGoals(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  function openModal(goal?: Goal) {
    if (goal) {
      setEditingGoal(goal);
      setTitle(goal.title);
      setTargetAmount(String(goal.target_amount));
      setDeadline(goal.deadline || "");
    } else {
      setEditingGoal(null);
      setTitle("");
      setTargetAmount("");
      setDeadline("");
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingGoal(null);
    setTitle("");
    setTargetAmount("");
    setDeadline("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !targetAmount || !user?.id) return;

    const target = Number(targetAmount);
    if (target <= 0) return;

    try {
      if (editingGoal) {
        const { error } = await supabase
          .from("goals")
          .update({
            title,
            target_amount: target,
            deadline: deadline || null,
          })
          .eq("id", editingGoal.id);
        if (error) throw error;
        toast.success("Meta atualizada!");
      } else {
        const { error } = await supabase.from("goals").insert([
          {
            user_id: user.id,
            title,
            target_amount: target,
            current_amount: 0,
            deadline: deadline || null,
            status: "active",
          },
        ]);
        if (error) throw error;
        toast.success("Meta criada!");
      }
      closeModal();
      loadGoals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(msg);
    }
  }

  async function handleAddAmount(e: React.FormEvent) {
    e.preventDefault();
    if (!addAmountGoal || !addAmountValue) return;

    const amount = Number(addAmountValue);
    if (amount <= 0) return;

    const newAmount = addAmountGoal.current_amount + amount;
    const isCompleted = newAmount >= addAmountGoal.target_amount;

    try {
      const { error } = await supabase
        .from("goals")
        .update({
          current_amount: newAmount,
          status: isCompleted ? "completed" : "active",
        })
        .eq("id", addAmountGoal.id);
      if (error) throw error;
      toast.success(
        isCompleted
          ? "Meta alcançada! Parabéns!"
          : `${fmt(amount)} adicionado!`,
      );
      setAddAmountGoal(null);
      setAddAmountValue("");
      loadGoals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar";
      toast.error(msg);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
      toast.success("Meta excluída!");
      loadGoals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir";
      toast.error(msg);
    }
  }

  async function handleReactivate(goal: Goal) {
    try {
      const { error } = await supabase
        .from("goals")
        .update({ status: "active" })
        .eq("id", goal.id);
      if (error) throw error;
      toast.success("Meta reativada!");
      loadGoals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao reativar";
      toast.error(msg);
    }
  }

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <FiLoader className="animate-spin mb-4" size={32} />
        <p className="font-bold text-sm uppercase tracking-widest italic">
          Carregando metas...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-400">
            {activeGoals.length} meta{activeGoals.length === 1 ? "" : "s"} ativa
            {activeGoals.length === 1 ? "" : "s"}
            {completedGoals.length > 0 &&
              ` · ${completedGoals.length} concluída${completedGoals.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <FiPlus size={18} /> Nova Meta
        </button>
      </div>

      {goals.length === 0 && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="inline-flex p-4 bg-slate-50 rounded-2xl mb-4">
            <FiFlag className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-400 mb-2">
            Nenhuma meta criada
          </h3>
          <p className="text-sm text-slate-400 font-medium mb-6">
            Defina objetivos financeiros como viagens, reserva de emergência ou
            compras.
          </p>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all active:scale-95"
          >
            Criar Primeira Meta
          </button>
        </div>
      )}

      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Metas Ativas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {activeGoals.map((goal) => {
              const pct =
                goal.target_amount > 0
                  ? goal.current_amount / goal.target_amount
                  : 0;
              const remaining = goal.target_amount - goal.current_amount;

              // Days until deadline
              let daysLeft: number | null = null;
              if (goal.deadline) {
                const diff = new Date(goal.deadline).getTime() - Date.now();
                daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
              }

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <FiFlag className="text-blue-600" size={18} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">
                          {goal.title}
                        </h4>
                        {daysLeft !== null && (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              daysLeft < 0
                                ? "text-red-500"
                                : daysLeft <= 30
                                  ? "text-amber-500"
                                  : "text-slate-400"
                            }`}
                          >
                            <FiCalendar className="inline mr-1" size={10} />
                            {daysLeft < 0
                              ? `${Math.abs(daysLeft)} dias atrasado`
                              : `${daysLeft} dias restantes`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openModal(goal)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <FiTrendingUp size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black text-slate-900">
                        {fmt(goal.current_amount)}
                      </span>
                      <span className="text-sm font-bold text-slate-400">
                        / {fmt(goal.target_amount)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(pct * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {Math.round(pct * 100)}% alcançado
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Faltam {fmt(Math.max(remaining, 0))}
                      </span>
                    </div>
                  </div>

                  {/* Add money button */}
                  <button
                    onClick={() => {
                      setAddAmountGoal(goal);
                      setAddAmountValue("");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <FiDollarSign size={14} /> Adicionar Valor
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Metas Concluídas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-emerald-50/50 rounded-2xl sm:rounded-3xl border border-emerald-200 p-5 sm:p-6 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <FiCheckCircle className="text-emerald-600" size={18} />
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-900 text-sm">
                        {goal.title}
                      </h4>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                        Concluída · {fmt(goal.target_amount)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleReactivate(goal)}
                      className="p-1.5 text-emerald-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-[10px] font-black"
                    >
                      Reativar
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 text-emerald-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl sm:rounded-4xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-tight italic">
                {editingGoal ? "Editar Meta" : "Nova Meta"}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="goal_title"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1"
                >
                  Nome da Meta
                </label>
                <input
                  id="goal_title"
                  autoFocus
                  type="text"
                  placeholder="Ex: Reserva de emergência, viagem..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl py-3 px-4 font-bold text-slate-900 transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="targetAmount"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1"
                >
                  Valor Alvo (R$)
                </label>
                <input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl py-3 px-4 font-bold text-slate-900 transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="deadline"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1"
                >
                  Prazo (opcional)
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl py-3 px-4 font-bold text-slate-900 transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95"
              >
                {editingGoal ? "Salvar Alterações" : "Criar Meta"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Amount Modal */}
      {addAmountGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl sm:rounded-4xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-tight italic text-sm">
                Adicionar a &quot;{addAmountGoal.title}&quot;
              </h3>
              <button
                onClick={() => setAddAmountGoal(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleAddAmount} className="p-6 sm:p-8 space-y-5">
              <div className="text-center mb-2">
                <span className="text-sm font-bold text-slate-400">
                  Progresso atual
                </span>
                <p className="text-2xl font-black text-slate-900">
                  {fmt(addAmountGoal.current_amount)}{" "}
                  <span className="text-sm font-bold text-slate-400">
                    / {fmt(addAmountGoal.target_amount)}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="addAmountValue"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1"
                >
                  Valor a Adicionar (R$)
                </label>
                <input
                  id="addAmountValue"
                  autoFocus
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={addAmountValue}
                  onChange={(e) => setAddAmountValue(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl py-3 px-4 font-bold text-slate-900 transition-all outline-none text-center text-xl"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95"
              >
                Adicionar {addAmountValue ? fmt(Number(addAmountValue)) : ""}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
