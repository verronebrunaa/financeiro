"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  FiFileText,
  FiDownload,
  FiCheck,
  FiDatabase,
  FiAlertCircle,
  FiUpload,
} from "react-icons/fi";
import Importer from "./Importer";
import supabase from "../lib/supabaseClient";
import { useAuth } from "./AuthProvider";

interface PendingTx {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export default function ImportManager() {
  const { user } = useAuth();
  const [pendingData, setPendingData] = useState<PendingTx[]>([]);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const { data } = await supabase
      .from("import_batches")
      .select("*")
      .order("created_at", { ascending: false });
    setImportHistory(data || []);
  }

  const handleFileUploaded = (file: File) => {
    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed: PendingTx[] = results.data.map((row: any, idx: number) => ({
            id: String(idx + 1),
            date: row.date || row.data || "",
            description: row.description || row.descricao || "",
            amount: Number(row.amount || row.valor || 0),
            category: row.category || row.categoria || "",
          }));
          setPendingData(parsed);
        },
      });
    } else {
      alert("Formato de arquivo não suportado. Use CSV.");
    }
  };

  const saveImport = async () => {
    setLoading(true);
    try {
      const { data: batch, error: batchError } = await supabase
        .from("import_batches")
        .insert([{ file_name: "extrato_importado.csv", user_id: user?.id }])
        .select()
        .single();

      if (batchError) throw batchError;

      const finalTxs = pendingData.map(({ id, ...rest }) => ({
        ...rest,
        import_batch_id: batch.id,
      }));

      const { error: txError } = await supabase
        .from("transactions")
        .insert(finalTxs);
      if (txError) throw txError;

      setPendingData([]);
      loadHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Grid de Ação Superior */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-1 sticky top-0">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FiUpload size={16} className="text-blue-600" /> 1. Upload
            </h3>
            <Importer onFile={handleFileUploaded} />
          </div>
        </div>

        <div className="xl:col-span-2">
          {pendingData.length > 0 ? (
            <div className="bg-white rounded-3xl border-2 border-blue-600 shadow-2xl shadow-blue-100 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-5 border-b border-slate-100 bg-slate-900 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="text-blue-400" />
                  <span className="text-xs font-black uppercase tracking-tighter">
                    Conferência de Dados
                  </span>
                </div>
                <button
                  onClick={saveImport}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 active:scale-95"
                >
                  {loading ? (
                    "Processando..."
                  ) : (
                    <>
                      <FiCheck size={16} /> Salvar no Sistema
                    </>
                  )}
                </button>
              </div>

              <div className="max-h-100 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-4">Data</th>
                      <th className="p-4">Descrição</th>
                      <th className="p-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold text-slate-900">
                    {pendingData.map((tx, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="p-4">
                          <input
                            type="date"
                            value={tx.date}
                            onChange={e => {
                              const newData = [...pendingData];
                              newData[idx].date = e.target.value;
                              setPendingData(newData);
                            }}
                            className="bg-transparent outline-none focus:text-blue-600"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="text"
                            value={tx.description}
                            onChange={e => {
                              const newData = [...pendingData];
                              newData[idx].description = e.target.value;
                              setPendingData(newData);
                            }}
                            className="bg-transparent outline-none focus:text-blue-600 w-full"
                          />
                        </td>
                        <td
                          className={`p-4 text-right font-black ${tx.amount < 0 ? "text-red-600" : "text-emerald-600"}`}
                        >
                          <input
                            type="number"
                            value={tx.amount}
                            onChange={e => {
                              const newData = [...pendingData];
                              newData[idx].amount = Number(e.target.value);
                              setPendingData(newData);
                            }}
                            className="bg-transparent outline-none focus:text-blue-600 w-24 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-70 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-8 text-slate-400">
              <FiDatabase size={40} className="mb-3 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">
                Aguardando novo arquivo
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Histórico Inferior */}
      <section>
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
          Histórico de Atividade{" "}
          <div className="h-px flex-1 bg-slate-200"></div>
        </h3>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="p-5">Nome do Arquivo</th>
                <th className="p-5">Data da Importação</th>
                <th className="p-5 text-right px-8">Ação</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-slate-900">
              {importHistory.map((batch) => (
                <tr
                  key={batch.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
                      <FiFileText size={20} />
                    </div>
                    <span className="tracking-tight">{batch.file_name}</span>
                  </td>
                  <td className="p-5 text-slate-500 font-medium">
                    {new Date(batch.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-5 text-right px-8">
                    <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <FiDownload size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
