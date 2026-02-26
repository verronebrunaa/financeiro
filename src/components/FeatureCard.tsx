"use client";

export default function FeatureCard({
  icon,
  title,
  desc,
}: Readonly<{ icon: React.ReactNode; title: string; desc: string }>) {
  return (
    <div className="space-y-6 group p-8 rounded-4xl hover:bg-slate-50 transition-all duration-500 border border-transparent hover:border-slate-100">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm shadow-blue-100">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">
        {title}
      </h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
