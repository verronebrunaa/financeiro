"use client";
import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiChevronDown,
  FiGrid,
  FiTrash2,
  FiLoader,
  FiX,
} from "react-icons/fi";
import supabase from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { useAuth } from "./AuthProvider";

export default function CategoryManager() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"despesa" | "receita">("despesa");

  // Estados para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");
  const [newCatNature, setNewCatNature] = useState<"fixo" | "variavel">(
    "variavel",
  );
  const [parentForSub, setParentForSub] = useState<any>(null);
  const [deleteCatId, setDeleteCatId] = useState<string|null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar categorias: " + err.message, {
        style: {
          borderRadius: "16px",
          background: "#fff",
          color: "#e11d48",
          fontWeight: "bold",
          fontSize: "14px",
          boxShadow: "0 2px 8px #e11d4822",
          border: "2px solid #e11d48",
        },
        icon: "❌",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const { error } = await supabase.from("categories").insert([
        {
          name: newCatName,
          type: activeTab,
          nature: newCatNature,
          color: newCatColor,
          parent_id: parentForSub ? parentForSub.id : null,
          user_id: user?.id,
        },
      ]);

      if (error) throw error;

      toast.success("Categoria adicionada!", {
        style: {
          borderRadius: "16px",
          background: "#fff",
          color: "#059669",
          fontWeight: "bold",
          fontSize: "14px",
          boxShadow: "0 2px 8px #05966922",
          border: "2px solid #059669",
        },
        icon: "✅",
      });
      loadCategories();
      closeModal();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message, {
        style: {
          borderRadius: "16px",
          background: "#fff",
          color: "#e11d48",
          fontWeight: "bold",
          fontSize: "14px",
          boxShadow: "0 2px 8px #e11d4822",
          border: "2px solid #e11d48",
        },
        icon: "❌",
      });
    }
  }

  async function handleDeleteCategory(id: string) {
    setDeleteCatId(id);
  }

  async function confirmDeleteCategory() {
    if (!deleteCatId) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", deleteCatId);
      if (error) throw error;
      toast.success("Categoria excluída com sucesso!", {
        style: {
          borderRadius: "16px",
          background: "#fff",
          color: "#059669",
          fontWeight: "bold",
          fontSize: "14px",
          boxShadow: "0 2px 8px #05966922",
          border: "2px solid #059669",
        },
        icon: '✅',
      });
      loadCategories();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message, {
        style: {
          borderRadius: "16px",
          background: "#fff",
          color: "#e11d48",
          fontWeight: "bold",
          fontSize: "14px",
          boxShadow: "0 2px 8px #e11d4822",
          border: "2px solid #e11d48",
        },
        icon: '❌',
      });
    } finally {
      setDeleteCatId(null);
    }
  }

  function cancelDeleteCategory() {
    setDeleteCatId(null);
  }

  function openModal(parent = null) {
    setParentForSub(parent);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setNewCatName("");
    setNewCatColor("#3b82f6");
    setParentForSub(null);
  }

  const mainCategories = categories.filter(
    (c) => !c.parent_id && c.type === activeTab,
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <FiLoader className="animate-spin mb-4" size={32} />
        <p className="font-bold text-sm uppercase tracking-widest italic">
          Sincronizando Finnan...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Switch Seletor */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab("despesa")}
          className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "despesa"
              ? "bg-white text-red-600 shadow-md"
              : "text-slate-500"
          }`}
        >
          DESPESAS
        </button>
        <button
          onClick={() => setActiveTab("receita")}
          className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "receita"
              ? "bg-white text-emerald-600 shadow-md"
              : "text-slate-500"
          }`}
        >
          RECEITAS
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {mainCategories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            subCategories={categories.filter((sub) => sub.parent_id === cat.id)}
            onAddSub={() => openModal(cat)}
            onDelete={() => handleDeleteCategory(cat.id)}
            onDeleteSub={handleDeleteCategory}
          />
        ))}

        {/* Botão Adicionar Categoria Principal */}
        <button
          onClick={() => openModal(null)}
          className="border-2 border-dashed border-slate-200 rounded-[40px] p-8 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all group min-h-35"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors shadow-inner">
            <FiPlus size={28} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            Adicionar {activeTab}
          </span>
        </button>
      </div>

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-4xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-tight italic">
                {parentForSub
                  ? `Sub em ${parentForSub.name}`
                  : `Nova Categoria`}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="p-8 space-y-6">
              <div className="space-y-2">
                <label htmlFor="category-name" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Nome da Categoria
                </label>
                <input
                  id="category-name"
                  autoFocus
                  className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl py-4 px-6 font-bold text-slate-900 transition-all outline-none"
                  placeholder="Ex: Aluguel, Uber, Lanches..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category-color" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Cor
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="category-color"
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border-2 border-slate-100 cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-2">
                    {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        className={`w-8 h-8 rounded-lg transition-all ${newCatColor === c ? "ring-2 ring-offset-2 ring-slate-900 scale-110" : "hover:scale-110"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {!parentForSub && (
                <div className="space-y-2">
                  <label htmlFor="category-nature" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Natureza do Gasto
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="category-nature"
                      type="button"
                      onClick={() => setNewCatNature("fixo")}
                      className={`py-3 rounded-xl font-bold text-xs transition-all ${newCatNature === "fixo" ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      FIXO
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCatNature("variavel")}
                      className={`py-3 rounded-xl font-bold text-xs transition-all ${newCatNature === "variavel" ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      VARIÁVEL
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95"
              >
                SALVAR AGORA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {deleteCatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-4xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-tight italic">
                Confirmar Exclusão
              </h3>
              <button onClick={cancelDeleteCategory} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <FiX />
              </button>
            </div>
            <div className="p-8 text-center">
              <p className="text-slate-500 font-bold mb-6">Tem certeza que deseja excluir esta categoria e todas as subcategorias vinculadas?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={confirmDeleteCategory}
                  className="bg-red-600 hover:bg-red-700 text-white font-black py-3 px-8 rounded-2xl shadow-xl transition-all active:scale-95"
                >Excluir</button>
                <button
                  onClick={cancelDeleteCategory}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-3 px-8 rounded-2xl shadow-xl transition-all active:scale-95"
                >Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({
  category,
  subCategories,
  onAddSub,
  onDelete,
  onDeleteSub,
}: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group/card">
      <div
        className="p-6 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-[20px] flex items-center justify-center shadow-lg shadow-slate-200"
            style={{ backgroundColor: category.color || "#1e293b" }}
          >
            <FiGrid size={24} className="text-white" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-lg leading-tight tracking-tighter">
              {category.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${category.nature === "fixo" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
              >
                {category.nature || "Variável"}
              </span>
              <span className="text-[10px] font-bold text-slate-300">
                • {subCategories.length} subcategorias
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÃO DE DELETAR CATEGORIA PAI (Aparece no Hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/card:opacity-100"
            title="Excluir Categoria"
          >
            <FiTrash2 size={18} />
          </button>
          <div
            className={`transition-transform duration-300 text-slate-300 ${isOpen ? "rotate-180" : ""}`}
          >
            <FiChevronDown size={24} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="px-6 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-300">
          <div className="h-px bg-slate-100 mb-2" />

          {subCategories.length > 0 ? (
            subCategories.map((sub: any) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group/sub hover:bg-slate-100 transition-colors"
              >
                <span className="text-sm font-bold text-slate-600 italic tracking-tight">
                  # {sub.name}
                </span>
                <button
                  onClick={() => onDeleteSub(sub.id)}
                  className="opacity-0 group-hover/sub:opacity-100 p-2 text-slate-400 hover:text-red-600 transition-all active:scale-90"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Sem subcategorias
            </p>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddSub();
            }}
            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all uppercase tracking-widest mt-2"
          >
            <FiPlus size={14} /> Criar Subcategoria
          </button>
        </div>
      )}
    </div>
  );
}
