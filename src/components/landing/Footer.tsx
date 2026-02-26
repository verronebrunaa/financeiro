"use client";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-white py-12 px-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">$</div>
            <span className="font-black text-xl tracking-tight italic">Finnan.</span>
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest italic">
            Simplificando sua vida financeira.
          </p>
        </div>
        <div className="flex flex-col items-center md:items-end gap-2">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} Finnan - Todos os direitos reservados</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Desenvolvido por</span>
            <a href="https://verronebruna.vercel.app/" target="_blank" className="font-black text-blue-400 hover:text-white transition-colors uppercase tracking-tighter italic border-b border-blue-400/30">verrone dev</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
