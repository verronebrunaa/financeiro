"use client";
import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiLock,
  FiBell,
  FiShield,
  FiCamera,
  FiSave,
  FiCheckCircle,
  FiZap,
  FiStar,
} from "react-icons/fi";
import Link from "next/link";
import supabase from "../lib/supabaseClient";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import { useSubscription } from "@/hooks/useSubscription";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export default function SettingsManager() {
  const { user } = useAuth();
  const toast = useToast();
  const { subscription, isPaid } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [picUploading, setPicUploading] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (!user?.id) return;
    async function fetchProfile() {
      try {
        if (!user) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, phone, avatar_url")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        setProfile({
          fullName: data?.full_name || "",
          phone: data?.phone || "",
          email: user.email || "",
        });
        if (data?.avatar_url) setProfilePic(data.avatar_url);
      } catch (err) {
        toast.show({
          title: "Erro",
          message: "Não foi possível carregar seu perfil.",
          variant: "error",
        });
      }
    }
    fetchProfile();
  }, [toast, user]);

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.fullName,
        phone: profile.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.show({
        title: "Erro",
        message: error.message || "Erro ao atualizar perfil.",
        variant: "error",
      });
    } else {
      setSaved(true);
      toast.show({
        title: "Sucesso",
        message: "Perfil atualizado com sucesso!",
        variant: "success",
      });
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setPicUploading(true);
    try {
      // Upload para Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("profile-pics")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      // Recupera URL pública
      const { publicUrl } = supabase.storage
        .from("profile-pics")
        .getPublicUrl(fileName).data;
      setProfilePic(publicUrl);
      // Salvar URL no perfil do banco
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      toast.show({
        title: "Sucesso",
        message: "Foto de perfil atualizada!",
        variant: "success",
      });
    } catch (err: any) {
      toast.show({
        title: "Erro",
        message: err?.message || "Erro ao enviar foto.",
        variant: "error",
      });
    }
    setPicUploading(false);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Perfil Pessoal
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Gerencie como suas informações aparecem no Finna.
            </p>
          </div>
          <div className="relative group">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-xl overflow-hidden">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover rounded-3xl"
                />
              ) : (
                profile.email.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-90 cursor-pointer">
              <FiCamera size={16} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePicChange}
                disabled={picUploading}
              />
            </label>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              Nome Completo
            </label>
            <div className="relative group">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                id="fullName"
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
                className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              E-mail de Cadastro
            </label>
            <div className="relative opacity-60">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                id="email"
                disabled
                value={profile.email}
                className="w-full bg-slate-100 border-2 border-transparent rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1"
            >
              Telefone
            </label>
            <input
              id="phone"
              type="text"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: formatPhone(e.target.value) })
              }
              className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 transition-all outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                "Salvando..."
              ) : saved ? (
                <>
                  <FiCheckCircle /> Atualizado
                </>
              ) : (
                <>
                  <FiSave /> Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* SEÇÃO: Segurança e Preferências */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Segurança */}
        <section className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <FiShield size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Segurança
            </h3>
          </div>

          <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group">
            <div className="flex items-center gap-3">
              <FiLock className="text-slate-400 group-hover:text-slate-900" />
              <span className="text-sm font-bold text-slate-700">
                Alterar Senha
              </span>
            </div>
            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Atualizar
            </div>
          </button>

          <div className="p-4 border-2 border-dashed border-slate-100 rounded-2xl text-center">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">
              Autenticação em Duas Etapas
            </p>
            <button className="text-xs font-black text-blue-600 hover:underline">
              Ativar Proteção Extra
            </button>
          </div>
        </section>

        {/* Preferências */}
        <section className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FiBell size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Preferências
            </h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-2 cursor-pointer group">
              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                Notificações por E-mail
              </span>
              <input
                type="checkbox"
                defaultChecked
                className="w-10 h-5 bg-slate-200 rounded-full appearance-none checked:bg-blue-600 transition-all relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5 before:transition-all shadow-inner"
              />
            </label>
            <label className="flex items-center justify-between p-2 cursor-pointer group">
              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                Relatórios Mensais em PDF
              </span>
              <input
                type="checkbox"
                className="w-10 h-5 bg-slate-200 rounded-full appearance-none checked:bg-blue-600 transition-all relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5 before:transition-all shadow-inner"
              />
            </label>
          </div>
        </section>
      </div>

      {/* SEÇÃO: Plano Atual */}
      <section className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${
              subscription.plan === "premium" ? "bg-amber-50" :
              subscription.plan === "pro" ? "bg-blue-50" : "bg-slate-100"
            }`}>
              {subscription.plan === "premium" ? (
                <FiStar className="text-amber-500" size={24} />
              ) : subscription.plan === "pro" ? (
                <FiZap className="text-blue-600" size={24} />
              ) : (
                <FiShield className="text-slate-400" size={24} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Plano {subscription.plan === "free" ? "Gratuito" : subscription.plan === "pro" ? "Pro" : "Premium"}
              </h3>
              {subscription.currentPeriodEnd && isPaid ? (
                <p className="text-sm text-slate-500 font-medium">
                  Válido até {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                </p>
              ) : (
                <p className="text-sm text-slate-500 font-medium">
                  {isPaid ? "Assinatura ativa" : "Funcionalidades limitadas"}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/plans"
            className={`px-6 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 ${
              isPaid
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
            }`}
          >
            {isPaid ? "Gerenciar Plano" : "Fazer Upgrade"}
          </Link>
        </div>
      </section>

      {/* ZONA DE PERIGO */}
      <div className="p-8 bg-red-50/50 rounded-4xl border border-red-100 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-red-900 uppercase tracking-widest">
            Excluir Conta
          </h4>
          <p className="text-xs text-red-700 font-medium mt-1">
            Isso apagará permanentemente todos os seus dados e transações.
          </p>
        </div>
        <button className="px-6 py-2 bg-white text-red-600 border border-red-200 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all">
          Excluir Tudo
        </button>
      </div>
    </div>
  );
}
