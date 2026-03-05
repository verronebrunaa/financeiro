"use client";

import React, { useState, useEffect } from "react";
import {
  FiX,
  FiSave,
  FiRepeat,
  FiCheckCircle,
  FiPlus,
  FiLoader,
} from "react-icons/fi";
import supabase from "../lib/supabaseClient";
import toast from "react-hot-toast";

export type Transaction = {
  id?: string | number;
  description: string;
  amount: number | string;
  type: "entrada" | "saida";
  competence_date: string;
  due_date: string;
  observation: string;
  is_monthly: boolean;
  category: string;
  payment_method: string;
  subcategory?: string;
  status?: string;
  payment_date?: string;
  user_id?: string;
  recurrence_group_id?: string;
  installment_number?: number;
  total_installments?: number;
};

// --- Função Crucial: Adiciona meses a uma string YYYY-MM-DD ignorando timezone ---
function addMonthsToDate(dateStr: string, monthsToAdd: number): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);

  let newMonth = month + monthsToAdd;
  let newYear = year;

  while (newMonth > 12) {
    newMonth -= 12;
    newYear++;
  }

  const lastDayOfNewMonth = new Date(newYear, newMonth, 0).getDate();
  const safeDay = Math.min(day, lastDayOfNewMonth);

  const formattedMonth = String(newMonth).padStart(2, "0");
  const formattedDay = String(safeDay).padStart(2, "0");

  return `${newYear}-${formattedMonth}-${formattedDay}`;
}

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
  const [categories, setCategories] = useState<any[]>([]); // Busca os dados da sua tabela categories
  const [loadingCats, setLoadingCats] = useState(true);

  const [recurrenceType, setRecurrenceType] = useState<
    "none" | "fixed" | "end_of_year"
  >("none");
  const [installments, setInstallments] = useState<number>(2);

  const todayLocal = new Date().toLocaleDateString("en-CA");

  const initialState = {
    description: "",
    amount: "",
    type: "saida" as "entrada" | "saida",
    competence_date: todayLocal,
    due_date: todayLocal,
    observation: "",
    is_monthly: false,
    category: "",
    payment_method: "",
    subcategory: "",
    status: "pending",
    payment_date: todayLocal,
  };

  const [formData, setFormData] = useState(
    initialData
      ? {
          ...initialState,
          ...initialData,
          amount: initialData?.amount
            ? Math.abs(Number(initialData.amount)).toString()
            : "",
        }
      : initialState,
  );

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCats(true);
        // Busca os campos da sua tabela: id, name, type (despesa/receita) e parent_id (para subcategorias)
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, type, parent_id")
          .order("name", { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Erro ao carregar categorias:", message);
        toast.error("Erro ao carregar lista de categorias.");
      } finally {
        setLoadingCats(false);
      }
    }
    fetchCategories();
  }, []);

  // Filtra categorias principais e subcategorias pelo tipo selecionado (Receita ou Despesa)
  const typeMap = { entrada: "receita", saida: "despesa" };
  const categoriasPrincipais = categories.filter(
    (c) => c.type === typeMap[formData.type] && c.parent_id === null,
  );
  const categoriaSelecionada = categoriasPrincipais.find(
    (c) => c.id === formData.category,
  );
  const subcategorias = categoriaSelecionada
    ? categories.filter((c) => c.parent_id === categoriaSelecionada.id)
    : [];
  // Adiciona campo subcategory ao formData
  if (!formData.hasOwnProperty("subcategory")) {
    formData.subcategory = "";
  }

  const resetForm = () => {
    setFormData(initialState);
    setRecurrenceType("none");
    setInstallments(2);
    setShowConfirmation(false);
  };

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.category) return toast.error("Selecione uma categoria");

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const finalAmount =
      formData.type === "saida"
        ? -Math.abs(Number(formData.amount))
        : Math.abs(Number(formData.amount));

    // --- MODO EDIÇÃO ---
    if (initialData && initialData.id) {
      const updateObj = {
        description: formData.description,
        amount: finalAmount,
        competence_date: formData.competence_date,
        due_date: formData.due_date,
        category: formData.category,
        payment_method: formData.payment_method,
        observation: formData.observation,
        type: formData.type,
        user_id: user?.id,
        status: formData.status || "pending",
        payment_date:
          formData.status === "Pago"
            ? formData.payment_date || todayLocal
            : null,
      };

      const { error } = await supabase
        .from("transactions")
        .update(updateObj)
        .eq("id", initialData.id);
      if (!error) {
        onSuccessAction();
      } else {
        toast.error("Erro ao editar: " + error.message);
      }
      setLoading(false);
      return;
    }
    {
      initialData?.id && formData.status === "Pago" && (
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="payment_date"
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
          >
            Data do Pagamento
          </label>
          <input
            type="date"
            id="payment_date"
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
            value={formData.payment_date || todayLocal}
            onChange={(e) =>
              setFormData({ ...formData, payment_date: e.target.value })
            }
          />
        </div>
      );
    }

    let inserts = [];
    const groupId = crypto.randomUUID();

    let totalToCreate = 1;
    if (recurrenceType === "fixed") {
      totalToCreate = installments;
    } else if (recurrenceType === "end_of_year") {
      const startMonth = Number(formData.competence_date.split("-")[1]);
      totalToCreate = 12 - startMonth + 1;
    }

    for (let i = 0; i < totalToCreate; i++) {
      const nextCompetence = addMonthsToDate(formData.competence_date, i);
      const nextDue = addMonthsToDate(formData.due_date, i);
      const descSufix =
        recurrenceType === "fixed" ? ` (${i + 1}/${totalToCreate})` : "";

      inserts.push({
        description: `${formData.description}${descSufix}`,
        amount: finalAmount,
        competence_date: nextCompetence,
        due_date: nextDue,
        category: formData.category,
        payment_method: formData.payment_method,
        observation: formData.observation,
        is_monthly: recurrenceType !== "none",
        type: formData.type,
        user_id: user?.id,
        status: nextDue < todayLocal ? "overdue" : "pending",
        recurrence_group_id: totalToCreate > 1 ? groupId : null,
        installment_number: totalToCreate > 1 ? i + 1 : null,
        total_installments: totalToCreate > 1 ? totalToCreate : null,
      });
    }

    const { error } = await supabase.from("transactions").insert(inserts);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      setShowConfirmation(true);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCloseAction}
        tabIndex={-1}
        aria-hidden="true"
      ></div>

      <div className="relative w-full max-w-3xl bg-white rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 min-h-125 flex flex-col">
        {showConfirmation ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6">
              <FiCheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter italic">
              Lançamento Realizado!
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-8">
              <button
                onClick={resetForm}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 font-black py-4 rounded-2xl hover:bg-blue-100 transition-all active:scale-95 shadow-sm shadow-blue-100"
              >
                <FiPlus /> Novo Lançamento
              </button>
              <button
                onClick={() => {
                  onCloseAction();
                  onSuccessAction();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                Ver Painel
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="p-8 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h2 className="text-2xl font-black tracking-tighter italic">
                {initialData?.id ? "Editar Transação" : "Nova Transação"}
                <span className="text-blue-500">.</span>
              </h2>
              <button
                onClick={onCloseAction}
                className="p-2 bg-white/10 hover:bg-red-500 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </header>

            <form
              onSubmit={handleSave}
              className="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar"
            >
              <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full border border-slate-200">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, type: "entrada", category: "" })
                  }
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${formData.type === "entrada" ? "bg-white text-emerald-600 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, type: "saida", category: "" })
                  }
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${formData.type === "saida" ? "bg-white text-red-600 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Despesa
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                  >
                    Descrição
                  </label>
                  <input
                    required
                    autoFocus
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                    placeholder="Ex: Aluguel, Supermercado..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="amount"
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                  >
                    Valor
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">
                      R$
                    </span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 font-black focus:border-blue-600 outline-none transition-all ${formData.type === "saida" ? "text-red-600" : "text-emerald-600"}`}
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="category"
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                  >
                    Categoria
                  </label>
                  <div className="relative">
                    <select
                      required
                      disabled={loadingCats}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all appearance-none cursor-pointer"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value,
                          subcategory: "",
                        })
                      }
                    >
                      <option value="">
                        {loadingCats
                          ? "Carregando..."
                          : "Selecione a categoria principal"}
                      </option>
                      {categoriasPrincipais.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      {loadingCats ? (
                        <FiLoader className="animate-spin text-blue-500" />
                      ) : (
                        <FiChevronDown className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
                {subcategorias.length > 0 && (
                  <div className="space-y-2">
                    <label
                      htmlFor="subcategory"
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                    >
                      Subcategoria
                    </label>
                    <div className="relative">
                      <select
                        id="subcategory"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all appearance-none cursor-pointer"
                        value={formData.subcategory || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subcategory: e.target.value,
                          })
                        }
                      >
                        <option value="">Selecione a subcategoria</option>
                        {subcategorias.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <FiChevronDown className="text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}
                {/* Payment Method */}
                <div className="space-y-2">
                  <label
                    htmlFor="payment_method"
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                  >
                    Forma de Pagamento
                  </label>
                  <div className="relative">
                    <select
                      required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all appearance-none cursor-pointer"
                      id="payment_method"
                      value={formData.payment_method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_method: e.target.value,
                        })
                      }
                    >
                      <option value="">Selecione...</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Crédito">
                        Cartão de Crédito
                      </option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Pix">Pix</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Outros">Outros</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FiChevronDown className="text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="observation"
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                  >
                    Observação
                  </label>
                  <textarea
                    id="observation"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all min-h-15"
                    placeholder="Observações sobre a transação"
                    value={formData.observation}
                    onChange={(e) =>
                      setFormData({ ...formData, observation: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="competence_date"
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                    >
                      Data Competência
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-slate-900 text-sm focus:border-blue-600 outline-none transition-all"
                      value={formData.competence_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          competence_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="due_date"
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                    >
                      Vencimento
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-slate-900 text-sm focus:border-blue-600 outline-none transition-all"
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                    />
                  </div>
                </div>

                {initialData?.id && (
                  <div className="space-y-2">
                    <label
                      htmlFor="status"
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                      value={formData.status || "pending"}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="pending">Pendente</option>
                      <option value="overdue">Atrasado</option>
                      <option value="Pago">Pago</option>
                    </select>
                  </div>
                )}
                {initialData?.id && (
                  <div
                    className={`grid grid-cols-2 gap-4 ${formData.status === "Pago" ? "" : "md:col-span-2"}`}
                  >
                    {formData.status === "Pago" && (
                      <div className="space-y-2">
                        <label
                          htmlFor="payment_date"
                          className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                        >
                          Data do Pagamento
                        </label>
                        <input
                          type="date"
                          id="payment_date"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                          value={formData.payment_date || todayLocal}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              payment_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
                {!initialData?.id && (
                  <div className="col-span-1 md:col-span-2 p-6 bg-slate-50 rounded-3xl border border-slate-200/60 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <FiRepeat size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 tracking-tight">
                          Repetição Automática
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                          O Finnan projeta os próximos meses no seu dashboard
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setRecurrenceType("none")}
                        className={`py-3 rounded-2xl text-xs font-black transition-all border-2 ${recurrenceType === "none" ? "border-blue-600 bg-white text-blue-600 shadow-sm" : "border-transparent bg-slate-200/50 text-slate-500 hover:bg-slate-200"}`}
                      >
                        Única vez
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecurrenceType("fixed")}
                        className={`py-3 rounded-2xl text-xs font-black transition-all border-2 ${recurrenceType === "fixed" ? "border-blue-600 bg-white text-blue-600 shadow-sm" : "border-transparent bg-slate-200/50 text-slate-500 hover:bg-slate-200"}`}
                      >
                        Parcelado
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecurrenceType("end_of_year")}
                        className={`py-3 rounded-2xl text-xs font-black transition-all border-2 ${recurrenceType === "end_of_year" ? "border-blue-600 bg-white text-blue-600 shadow-sm" : "border-transparent bg-slate-200/50 text-slate-500 hover:bg-slate-200"}`}
                      >
                        Fixa Mensal
                      </button>
                    </div>

                    {recurrenceType === "fixed" && (
                      <div className="animate-in slide-in-from-top-2 pt-4 flex items-center gap-4">
                        <label htmlFor="installments" className="text-xs font-bold text-slate-700">
                          Quantidade de parcelas:
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="120"
                          value={installments}
                          onChange={(e) =>
                            setInstallments(Number(e.target.value))
                          }
                          className="w-24 bg-white border-2 border-slate-200 rounded-xl py-2 px-4 font-black text-center outline-none focus:border-blue-600"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 text-lg tracking-tighter italic"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {" "}
                    <FiSave size={20} /> Finalizar Lançamento{" "}
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// Pequeno helper para o ícone de seta no select
function FiChevronDown(props: any) {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}
