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
} from "react-icons/fi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // show toast instead of alert
        toast.show({ message: 'Confirme seu e-mail para continuar.', variant: 'info' })
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) router.push("/dashboard");
      }
    } catch (err: any) {
      toast.show({ message: err.message || 'Erro na autenticação', variant: 'error' })
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      {/* Container Principal */}
      <div className="w-full max-w-250 grid md:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-100">
        {/* Lado Esquerdo: Branding/Marketing */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-linear-to-br from-blue-600 to-indigo-700 text-white">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-bold text-2xl tracking-tighter italic">
                $
              </div>
              <span className="text-2xl font-bold tracking-tight italic">
                Finan<span className="opacity-50">.</span>
              </span>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4 text-balance">
              Domine suas finanças com inteligência.
            </h2>
            <p className="text-blue-100 text-lg">
              Importe extratos, categorize gastos e visualize seu crescimento em
              um só lugar.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
              <FiShield className="text-blue-200" size={20} />
              <span>Segurança de nível bancário para seus dados.</span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-2xl font-bold text-slate-800">
              {isRegister ? "Crie sua conta" : "Bem-vindo de volta"}
            </h3>
            <p className="text-slate-500 mt-2">
              {isRegister
                ? "Comece a organizar sua vida financeira hoje."
                : "Acesse seu painel de controle financeiro."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-bold text-black uppercase tracking-wider">
                E-mail
              </label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-foreground placeholder:opacity-70 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="exemplo@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="password" className="text-sm font-bold text-black uppercase tracking-wider">
                    Senha
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      className="text-xs font-bold hover:text-blue-800 hover:underline transition-all"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <FiLock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors"
                    size={20}
                  />
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-foreground placeholder:opacity-70 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                  >
                    {showPassword ? (
                      <FiEyeOff size={20} />
                    ) : (
                      <FiEye size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? "Começar Agora" : "Entrar na Conta"}
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              {isRegister ? "Já possui uma conta?" : "Não tem uma conta?"}
              <button
                type="button"
                className="ml-2 text-blue-600 font-bold hover:text-blue-700 transition-colors"
                onClick={() => setIsRegister((s) => !s)}
              >
                {isRegister ? "Fazer login" : "Criar conta gratuita"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
