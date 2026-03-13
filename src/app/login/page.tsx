"use client";

import React, { useState } from "react";
import { useToast } from "../../components/ToastProvider";
import supabase from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  FiMail,
  FiLock,
  FiArrowRight,
  FiShield,
  FiEyeOff,
  FiEye,
  FiUser,
} from "react-icons/fi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");

  const router = useRouter();
  const toast = useToast();

  function clearForm() {
    setEmail("");
    setPassword("");
    setFullName("");
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        toast.show({
          message: "Confirme seu e-mail para continuar.",
          variant: "info",
        });

        clearForm();
        setIsRegister(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data.session) router.push("/dashboard");
      }
    } catch (err: unknown) {
      let errorMsg = "Erro na autenticação";
      if (err instanceof Error) errorMsg = err.message;
      toast.show({ message: errorMsg, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans text-slate-900">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-[40px] overflow-hidden shadow-2xl border border-slate-200">
        <div className="hidden md:flex flex-col justify-between p-12 bg-linear-to-br from-blue-700 to-indigo-900 text-white">
          <div>
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-white text-blue-700 rounded-xl flex items-center justify-center font-extrabold text-2xl italic shadow-lg">
                $
              </div>
              <span className="text-2xl font-bold tracking-tight italic">
                Finnan<span className="text-blue-300">.</span>
              </span>
            </div>
            <h2 className="text-4xl font-black leading-tight mb-6 tracking-tighter italic">
              {isRegister
                ? "Comece sua jornada financeira hoje."
                : "Domine suas finanças com inteligência."}
            </h2>
            <p className="text-blue-100 text-lg font-medium">
              Importe extratos, categorize gastos e visualize seu crescimento em
              um só lugar.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
            <FiShield className="text-blue-200" size={24} />
            <span className="font-bold uppercase tracking-widest text-[10px]">
              Segurança de nível bancário para seus dados
            </span>
          </div>
        </div>

        <div className="p-8 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              {isRegister ? "Criar conta" : "Bem-vindo"}
            </h3>
            <p className="text-slate-500 font-bold mt-2">
              {isRegister
                ? "Preencha os dados abaixo."
                : "Acesse seu painel financeiro."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="fullName"
                    className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1"
                  >
                    Nome Completo
                  </label>
                  <div className="relative group">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      id="fullName"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      required={isRegister}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1"
              >
                E-mail
              </label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  id="email"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label
                  htmlFor="password"
                  className="text-xs font-black text-slate-800 uppercase tracking-widest"
                >
                  Senha
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline transition-all"
                    onClick={() => router.push("/forgot-password")}
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors" />
                <input
                  id="password"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-12 text-slate-900 font-bold placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 group disabled:opacity-70 mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-lg">
                    {isRegister ? "Começar Agora" : "Entrar na Conta"}
                  </span>
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-600 font-bold text-sm">
              {isRegister ? "Já possui uma conta?" : "Ainda não tem acesso?"}
              <button
                type="button"
                className="ml-2 text-blue-700 font-black hover:text-indigo-800 underline-offset-4 hover:underline transition-all uppercase tracking-tighter"
                onClick={() => {
                  clearForm();
                  setIsRegister((s) => !s);
                }}
              >
                {isRegister ? "Fazer login" : "Cadastre-se"}
              </button>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Finnan v{process.env.APP_VERSION}
        </p>
      </div>
    </div>
  );
}
