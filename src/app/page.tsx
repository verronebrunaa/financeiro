"use client";

import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Mockup from "@/components/landing/Mockup";
import Navbar from "@/components/landing/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden flex flex-col scroll-smooth">
      <Navbar />
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <Hero />
          <Mockup />
        </div>
      </main>
      <Features />
      <Footer />
    </div>
  );
}
