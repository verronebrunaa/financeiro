"use client";

import { FiPieChart, FiUpload, FiLock } from "react-icons/fi";
import FeatureCard from "../FeatureCard";

export default function Features() {
  return (
    <section
      id="funcionalidades"
      className="bg-white border-y border-slate-200 py-32"
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-20">
          <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] mb-4">
            Funcionalidades
          </h2>
          <p className="text-4xl font-black text-slate-900 tracking-tighter italic">
            Tudo que você precisa em um só lugar.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          <FeatureCard
            icon={<FiPieChart size={32} />}
            title="Relatórios Visuais"
            desc="Entenda para onde vai cada centavo com gráficos gerados automaticamente e insights inteligentes."
          />
          <FeatureCard
            icon={<FiUpload size={32} />}
            title="Importação IA"
            desc="Nossa tecnologia lê seus PDFs e CSVs categorizando transações em segundos. Zero trabalho manual."
          />
          <FeatureCard
            icon={<FiLock size={32} />}
            title="Dados Blindados"
            desc="Utilizamos os protocolos de segurança mais rígidos do mercado para garantir que seus dados sejam só seus."
          />
        </div>
      </div>
    </section>
  );
}
