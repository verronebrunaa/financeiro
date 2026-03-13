"use client";

import { useState } from "react";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";
import toast from "react-hot-toast";
import { FiMail, FiArrowLeft, FiSend, FiShield } from "react-icons/fi";

function ErrorToast({ message }: Readonly<{ message: string }>) {
  return <b>Erro: {message}</b>;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleForgotPassword(
    e: React.SyntheticEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    setLoading(true);

    const resetPromise = supabase.auth.resetPasswordForEmail(email, {
      redirectTo: globalThis.location.origin + "/reset-password",
    });

    toast.promise(
      resetPromise,
      {
        loading: "Enviando link de recuperação...",
        success: <b>Verifique seu e-mail!</b>,
        error: (err) => <ErrorToast message={err.message} />,
      },
      {
        style: { borderRadius: "16px", background: "#0f172a", color: "#fff" },
      },
    );

    try {
      const { error } = await resetPromise;
      if (error) throw error;
      setEmail("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err);
      } else {
        console.error("An unknown error occurred", err);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans text-slate-900">
      <div className="w-full max-w-250 grid md:grid-cols-2 bg-white rounded-[40px] overflow-hidden shadow-2xl border border-slate-200">
        {/* Lado Esquerdo: Branding & Contexto */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-linear-to-br from-blue-700 to-indigo-900 text-white">
          <div>
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-white text-blue-700 rounded-xl flex items-center justify-center font-extrabold text-2xl italic shadow-lg">
                $
              </div>
              <span className="text-2xl font-bold tracking-tight italic">
                Finnan.
              </span>
            </div>
            <h2 className="text-4xl font-black leading-tight mb-6 tracking-tighter italic">
              Não se preocupe, <br /> acontece com os melhores.
            </h2>
            <p className="text-blue-100 text-lg font-medium leading-relaxed">
              Enviaremos um link seguro para o seu e-mail para que você possa
              redefinir sua senha e voltar ao controle das suas finanças.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
            <FiShield className="text-blue-200" size={24} />
            <span className="font-bold uppercase tracking-widest text-[10px]">
              Recuperação segura via Supabase Auth
            </span>
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="p-8 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest mb-6 hover:text-blue-800 transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />{" "}
              Voltar para o Login
            </Link>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              Recuperar Senha
            </h3>
            <p className="text-slate-500 font-bold mt-2">
              Insira o e-mail associado à sua conta.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1"
              >
                E-mail Cadastrado
              </label>
              <div className="relative group">
                <FiMail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors"
                  size={20}
                />
                <input
                  id="email"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <button
              disabled={loading || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-lg">Enviar Link</span>
                  <FiSend className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
            Se você não receber o e-mail em alguns minutos, <br /> verifique sua
            caixa de spam ou lixo eletrônico.
          </p>
        </div>
      </div>
    </div>
  );
}
