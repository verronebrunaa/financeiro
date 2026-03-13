"use client";

import React from "react";
import { FiAlertCircle, FiX } from "react-icons/fi";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean; // Red theme for delete actions
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  isDangerous = false,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <header className={`p-6 ${isDangerous ? "bg-red-600" : "bg-slate-900"} text-white flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${isDangerous ? "bg-red-500" : "bg-blue-500"} rounded-lg flex items-center justify-center`}>
              <FiAlertCircle size={18} />
            </div>
            <h2 className="text-lg font-black tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            disabled={isLoading}
          >
            <FiX size={24} />
          </button>
        </header>

        {/* Content */}
        <div className="p-8">
          <p className="text-slate-700 text-base leading-relaxed mb-8">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 ${
                isDangerous
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? "Processando..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
