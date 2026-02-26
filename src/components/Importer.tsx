"use client";
import React, { useState, useRef } from "react";
import { FiUploadCloud, FiFileText, FiCheckCircle, FiX } from "react-icons/fi";

interface ImporterProps {
  onFile?: (f: File) => void;
}

export default function Importer({ onFile }: Readonly<ImporterProps>) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    onFile?.(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative group cursor-pointer overflow-hidden
          border-2 border-dashed rounded-xl p-8
          transition-all duration-200 ease-in-out
          flex flex-col items-center justify-center gap-4
          ${isDragging 
            ? "border-blue-500 bg-blue-50/50" 
            : "border-slate-200 hover:border-slate-300 bg-slate-50/30 hover:bg-slate-50"
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.csv"
          onChange={handleChange}
          className="hidden"
        />

        {/* Ícone Dinâmico */}
        <div className={`
          p-4 rounded-full transition-colors
          ${file ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}
        `}>
          {file ? <FiCheckCircle size={32} /> : <FiUploadCloud size={32} />}
        </div>

        {/* Texto e Status */}
        <div className="text-center">
          {!file ? (
            <>
              <p className="font-semibold text-slate-700">Clique ou arraste o extrato</p>
              <p className="text-sm text-slate-500 mt-1">Suporta PDF ou CSV</p>
            </>
          ) : (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                <FiFileText className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700 truncate max-w-45">
                  {file.name}
                </span>
                <button 
                  onClick={removeFile}
                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                >
                  <FiX size={14} />
                </button>
              </div>
              <p className="text-xs text-green-600 mt-2 font-medium">Arquivo pronto para processar!</p>
            </div>
          )}
        </div>

        {/* Progress Bar Fake (Opcional, dá um toque premium) */}
        {isDragging && (
          <div className="absolute bottom-0 left-0 h-1 bg-blue-500 animate-pulse w-full" />
        )}
      </div>
    </div>
  );
}