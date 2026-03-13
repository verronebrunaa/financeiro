/**
 * Hook para abstrair padrão comum de CRUD + loading + modal
 * Reduz código duplicado em BudgetManager, GoalManager, TransactionManager, etc
 */
import { useCallback, useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

interface UseDataManagerOptions<T> {
  supabase: SupabaseClient;
  table: string;
  userId?: string;
  pageSize?: number;
}

export function useDataManager<T extends { id: string }>(
  options: UseDataManagerOptions<T>,
) {
  const { supabase, table, userId, pageSize = 20 } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  // Carregar dados com paginação
  const loadData = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        let query = supabase.from(table).select("*");

        if (userId) {
          query = query.eq("user_id", userId);
        }

        const { data: items, error } = await query
          .order("created_at", { ascending: false })
          .range((pageNum - 1) * pageSize, pageNum * pageSize - 1);

        if (error) throw error;

        setData(items || []);
        setPage(pageNum);
        setHasMore((items?.length || 0) >= pageSize);
      } catch (err) {
        console.error(`Erro ao carregar ${table}:`, err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase, table, userId, pageSize],
  );

  // Criar/atualizar item
  const saveItem = useCallback(
    async (item: Omit<T, "created_at" | "updated_at">) => {
      try {
        if (editingItem) {
          const { error } = await supabase
            .from(table)
            .update(item)
            .eq("id", editingItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(table).insert([item]);
          if (error) throw error;
        }
        await loadData(1);
        closeModal();
      } catch (err) {
        console.error(`Erro ao salvar ${table}:`, err);
        throw err;
      }
    },
    [supabase, table, editingItem, loadData],
  );

  // Deletar item
  const deleteItem = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        await loadData(1);
      } catch (err) {
        console.error(`Erro ao deletar de ${table}:`, err);
        throw err;
      }
    },
    [supabase, table, loadData],
  );

  // Gerenciar modal
  const openModal = (item?: T) => {
    if (item) setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Paginação
  const nextPage = async () => {
    if (hasMore) {
      await loadData(page + 1);
    }
  };

  const prevPage = async () => {
    if (page > 1) {
      await loadData(page - 1);
    }
  };

  return {
    // State
    data,
    loading,
    page,
    hasMore,
    isModalOpen,
    editingItem,

    // Actions
    loadData,
    saveItem,
    deleteItem,
    openModal,
    closeModal,
    nextPage,
    prevPage,
  };
}
