"use client";
import React, { useState } from "react";
import { FiX, FiSave, FiPercent, FiRepeat, FiCheckCircle, FiPlus } from "react-icons/fi";
import supabase from "../lib/supabaseClient";

// Define the Transaction type
export type Transaction = {
  id?: number;
  description: string;
  amount: number | string;
  type: "entrada" | "saida";
  competence_date: string;
  due_date: string;
  has_interest: boolean;
  observation: string;
  is_monthly: boolean;
  category: string;
  payment_method: string;
  user_id?: string;
  status?: string;
};

export default function TransactionModal({
  onCloseAction,
  onSuccessAction,
  initialData,
}: Readonly<{
  onCloseAction: () => void;
  onSuccessAction: () => void;
  initialData?: Partial<Transaction>;
}>) {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const initialState = {
    description: "",
    amount: "",
    type: "saida",
    competence_date: new Date().toISOString().split("T")[0],
    due_date: "",
    has_interest: false,
    observation: "",
    is_monthly: false,
    category: "Geral",
    payment_method: "",
  };

  const [formData, setFormData] = useState(initialData ? {
    ...initialState,
    ...initialData,
    amount: initialData?.amount ? Math.abs(Number(initialData.amount)).toString() : "",
  } : initialState);

  const resetForm = () => {
    setFormData(initialState);
    setShowConfirmation(false);
  };

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Obtém o usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();

    const finalAmount =
      formData.type === "saida"
        ? -Math.abs(Number(formData.amount))
        : Math.abs(Number(formData.amount));

    if (initialData && initialData.id) {
      // Edição
      const updateObj = {
        description: formData.description,
        amount: finalAmount,
        competence_date: formData.competence_date,
        due_date: formData.due_date,
        category: formData.category,
        payment_method: formData.payment_method,
        has_interest: formData.has_interest,
        observation: formData.observation,
        is_monthly: formData.is_monthly,
        type: formData.type,
        user_id: user?.id,
        status: formData.due_date && new Date(formData.due_date) < new Date() ? "overdue" : "pending"
      };
      const { error } = await supabase.from("transactions").update(updateObj).eq("id", initialData.id);
      if (!error) {
        onSuccessAction();
      } else {
        alert("Erro ao editar: " + error.message);
      }
      setLoading(false);
      return;
    }

    // Criação
    let inserts = [];
    if (formData.is_monthly) {
      const startDate = new Date(formData.competence_date);
      const startMonth = startDate.getMonth();
      const year = startDate.getFullYear();
      const dueDay = formData.due_date ? new Date(formData.due_date).getDate() : startDate.getDate();

      for (let m = startMonth + 1; m < 12; m++) {
        // Data de competência: mês atual
        const competenceDate = new Date(year, m - 1, startDate.getDate());
        const dueDate = new Date(year, m, dueDay);
        inserts.push({
          description: formData.description,
          amount: finalAmount,
          date: competenceDate.toISOString().split("T")[0],
          competence_date: competenceDate.toISOString().split("T")[0],
          due_date: dueDate.toISOString().split("T")[0],
          category: formData.category,
          payment_method: formData.payment_method,
          has_interest: formData.has_interest,
          observation: formData.observation,
          is_monthly: true,
          type: formData.type,
          user_id: user?.id
        });
      }
    } else {
      inserts.push({
        description: formData.description,
        amount: finalAmount,
        date: formData.competence_date,
        competence_date: formData.competence_date,
        due_date: formData.due_date,
        category: formData.category,
        payment_method: formData.payment_method,
        has_interest: formData.has_interest,
        observation: formData.observation,
        is_monthly: false,
        type: formData.type,
        user_id: user?.id,
        status: formData.due_date && new Date(formData.due_date) < new Date() ? "overdue" : "pending"
      });
    }

    const { error } = await supabase.from("transactions").insert(inserts);

    if (!error) {
      onSuccessAction();
      setShowConfirmation(true); // Abre a pergunta após salvar
    } else {
      alert("Erro ao salvar: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCloseAction}
      ></div>

      <div className="relative w-full max-w-3xl bg-white rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 min-h-100 flex flex-col">
        
        {/* Tela de Confirmação (condicional) */}
        {showConfirmation ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <FiCheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Lançamento Realizado!</h2>
            <p className="text-slate-500 font-medium mb-8">O que deseja fazer agora?</p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button
                onClick={resetForm}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 font-bold py-4 rounded-2xl hover:bg-blue-100 transition-all active:scale-95"
              >
                <FiPlus /> Cadastrar Outra
              </button>
              <button
                  onClick={onCloseAction}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95"
              >
                Fechar Modal
              </button>
            </div>
          </div>
        ) : (
          /* Formulário Original */
          <>
            <header className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black tracking-tight">Nova Transação</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Lançamento Manual</p>
              </div>
              <button onClick={onCloseAction} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <FiX size={24} />
              </button>
            </header>

            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label htmlFor="description" className="text-xs font-black text-slate-500 uppercase ml-1">Descrição</label>
                  <input
                    required
                    id="description"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                    placeholder="Ex: Aluguel, Salário, Internet..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label htmlFor="category" className="text-xs font-black text-slate-500 uppercase ml-1">Categoria</label>
                  <select
                    required
                    id="category"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {formData.type === "saida" ? (
                      <>
                        <option value="Moradia">Moradia</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Transporte">Transporte</option>
                        <option value="Alimentação">Alimentação</option>
                        <option value="Educação">Educação</option>
                        <option value="Lazer">Lazer</option>
                        <option value="Investimento">Investimento</option>
                        <option value="Impostos">Impostos</option>
                        <option value="Serviços">Serviços</option>
                        <option value="Divida">Divida</option>
                      </>
                    ) : (
                      <>
                        <option value="Salário">Salário</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Rendimento">Rendimento</option>
                        <option value="Reembolso">Reembolso</option>
                        <option value="Outros">Outros</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="amount" className="text-xs font-black text-slate-500 uppercase ml-1">Valor</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 font-black text-slate-900 focus:border-blue-600 outline-none transition-all"
                        placeholder="0,00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>
                  {formData.type === "saida" && (
                    <div className="space-y-2">
                      <label htmlFor="payment_method" className="text-xs font-black text-slate-500 uppercase ml-1">Pagamento</label>
                      <select
                        required
                        id="payment_method"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Pix">Pix</option>
                        <option value="Boleto">Boleto</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="type" className="text-xs font-black text-slate-500 uppercase ml-1">Tipo</label>
                  <div className="flex bg-slate-50 p-1 rounded-2xl border-2 border-slate-100">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "entrada" })}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${formData.type === "entrada" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"}`}
                    >ENTRADA</button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "saida" })}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${formData.type === "saida" ? "bg-white text-red-600 shadow-sm" : "text-slate-400"}`}
                    >SAÍDA</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="competence_date" className="text-xs font-black text-slate-500 uppercase ml-1">Data Competência</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                    value={formData.competence_date}
                    onChange={(e) => setFormData({ ...formData, competence_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="due_date" className="text-xs font-black text-slate-500 uppercase ml-1">Vencimento</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4 py-2">
                  <label htmlFor="has_interest" className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      id="has_interest"
                      className="w-5 h-5 rounded-lg text-blue-600"
                      checked={formData.has_interest}
                      onChange={(e) => setFormData({ ...formData, has_interest: e.target.checked })}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">Tem Juros?</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Atraso ou multa</span>
                    </div>
                    <FiPercent className="ml-auto text-slate-300" />
                  </label>

                  <label htmlFor="is_monthly" className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      id="is_monthly"
                      className="w-5 h-5 rounded-lg text-blue-600"
                      checked={formData.is_monthly}
                      onChange={(e) => setFormData({ ...formData, is_monthly: e.target.checked })}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">Mensal?</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Recorrência</span>
                    </div>
                    <FiRepeat className="ml-auto text-slate-300" />
                  </label>
                </div>

                <div className="col-span-2 space-y-2">
                  <label htmlFor="observation" className="text-xs font-black text-slate-500 uppercase ml-1">Observação</label>
                  <textarea
                    rows={2}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all resize-none"
                    placeholder="Algum detalhe adicional..."
                    value={formData.observation}
                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Salvando..." : <><FiSave size={18} /> Finalizar Lançamento</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}