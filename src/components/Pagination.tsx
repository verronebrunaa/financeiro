"use client";

import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  pageSize?: number;
  totalItems?: number;
}

/**
 * Componente de paginação reutilizável
 */
export default function Pagination({
  currentPage,
  hasMore,
  onPrevious,
  onNext,
  onFirst,
  onLast,
  pageSize = 20,
  totalItems,
}: Readonly<PaginationProps>) {
  const canGoNext = hasMore;
  const canGoPrev = currentPage > 1;

  const start = (currentPage - 1) * pageSize + 1;
  const end = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-6 bg-white border-t border-slate-100 sm:px-6">
      {/* Info */}
      <div className="text-sm text-slate-600">
        {totalItems ? (
          <>
            Mostrando <span className="font-semibold">{start}</span> a{" "}
            <span className="font-semibold">{end}</span> de{" "}
            <span className="font-semibold">{totalItems}</span>
          </>
        ) : (
          <span>Página <span className="font-semibold">{currentPage}</span></span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* First page */}
        {onFirst && (
          <button
            onClick={onFirst}
            disabled={!canGoPrev}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Primeira página"
          >
            <FiChevronsLeft size={16} />
          </button>
        )}

        {/* Previous */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrev}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Página anterior"
        >
          <FiChevronLeft size={16} />
        </button>

        {/* Page indicator */}
        <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-semibold text-blue-700">
            Pág. {currentPage}
          </span>
        </div>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Próxima página"
        >
          <FiChevronRight size={16} />
        </button>

        {/* Last page */}
        {onLast && (
          <button
            onClick={onLast}
            disabled={!canGoNext}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Última página"
          >
            <FiChevronsRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Versão compacta de paginação (apenas prev/next)
 */
export function CompactPagination({
  currentPage,
  hasMore,
  onPrevious,
  onNext,
}: Readonly<Omit<PaginationProps, "onFirst" | "onLast" | "pageSize" | "totalItems">>) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Anterior
      </button>
      <span className="text-sm text-slate-600 font-medium">Página {currentPage}</span>
      <button
        onClick={onNext}
        disabled={!hasMore}
        className="px-3 py-1 rounded border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Próxima →
      </button>
    </div>
  );
}
