"use client";

import React from "react";
import {
  FiX,
  FiCalendar,
  FiTag,
  FiCreditCard,
  FiFileText,
  FiAlertCircle,
  FiRepeat,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";

interface TransactionDetailsModalProps {
  transaction: any;
  onClose: () => void;
  onDelete?: (id: string) => void; 
  onEdit?: (transaction: any) => void; 
  categories?: Array<{ id: string; name: string }>;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  onClose,
  onDelete,
  onEdit,
  categories,
}) => {
  if (!transaction) return null;

  const isNegative = transaction.amount < 0;

  const getStatus = () => {
    if (transaction.paid)
      return { label: "Pago", class: "bg-emerald-100 text-emerald-700" };
    const isOverdue =
      transaction.due_date && new Date(transaction.due_date) < new Date();
    if (isOverdue)
      return { label: "Atrasado", class: "bg-red-100 text-red-700" };
    return { label: "Pendente", class: "bg-amber-100 text-amber-700" };
  };

  const status = getStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <header className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FiFileText size={18} />
            </div>
            <h2 className="text-lg font-black tracking-tight">Detalhes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </header>

        <div className="p-8">
          {/* Valor Principal */}
          <div className="text-center mb-8 pb-8 border-b border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              Valor Total
            </p>
            <h3
              className={`text-4xl font-black tracking-tighter ${isNegative ? "text-slate-900" : "text-emerald-600"}`}
            >
              {transaction.amount.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </h3>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full mt-4 text-[10px] font-black uppercase tracking-widest ${status.class}`}
            >
              {status.label}
            </div>
          </div>

          {/* Grid de Informações */}
          <div className="grid grid-cols-1 gap-y-5">
            <DetailItem
              icon={<FiFileText className="text-blue-500" />}
              label="Descrição"
              value={transaction.description}
            />

            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                icon={<FiTag className="text-purple-500" />}
                label="Categoria"
                value={
                  !transaction.category
                    ? "—"
                    : (() => {
                        const cat = categories?.find(
                          (c) => c.id === transaction.category,
                        );
                        if (!cat) return transaction.category;
                        if (transaction.subcategory && cat.subcategories) {
                          const sub = cat.subcategories.find(
                            (s) => s.id === transaction.subcategory,
                          );
                          return sub ? `${cat.name} / ${sub.name}` : cat.name;
                        }
                        return cat.name;
                      })()
                }
              />
              <DetailItem
                icon={<FiCreditCard className="text-amber-500" />}
                label="Pagamento"
                value={transaction.payment_method}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                icon={<FiCalendar className="text-slate-400" />}
                label="Competência"
                value={
                  transaction.competence_date
                    ? new Date(transaction.competence_date).toLocaleDateString(
                        "pt-BR",
                      )
                    : "-"
                }
              />
              <DetailItem
                icon={<FiAlertCircle className="text-red-400" />}
                label="Vencimento"
                value={
                  transaction.due_date
                    ? new Date(transaction.due_date).toLocaleDateString("pt-BR")
                    : "-"
                }
              />
            </div>

            {transaction.payment_date && (
              <DetailItem
                icon={<FiCalendar className="text-green-500" />}
                label={
                  transaction.type === "entrada" ? "Recebido em" : "Pago em"
                }
                value={new Date(transaction.payment_date).toLocaleDateString(
                  "pt-BR",
                )}
              />
            )}

            <div className="flex gap-2 pt-2">
              {transaction.is_monthly && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase">
                  <FiRepeat size={14} /> Mensal
                </div>
              )}
            </div>

            {transaction.observation && (
              <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">
                  Anotações
                </p>
                <p className="text-xs text-slate-600 font-semibold italic">
                  &quot;{transaction.observation}&quot;
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={() => onDelete?.(transaction.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-red-100 text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 shadow-sm shadow-red-50"
          >
            <FiTrash2 size={16} /> Excluir
          </button>

          <button
            onClick={() => onEdit?.(transaction)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            <FiEdit2 size={16} /> Editar
          </button>
        </footer>
      </div>
    </div>
  );
};

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-900 leading-tight">
        {value || "—"}
      </p>
    </div>
  </div>
);

export default TransactionDetailsModal;
