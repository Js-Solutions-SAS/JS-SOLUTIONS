import { ArrowRight, Activity, Calendar } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="w-full flex flex-col space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 leading-tight">
            Hola, JS Solutions
          </h1>
          <p className="text-neutral-500 font-medium text-lg">
            Resumen de actividad y operaciones al vistazo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/sops"
          className="group p-6 bg-white rounded-3xl border border-neutral-200 hover:border-brand-gold/30 hover:shadow-xl hover:shadow-brand-gold/5 transition-all flex flex-col"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 rounded-2xl bg-brand-gold/10 text-brand-gold-light">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">
            SOPs Operativos
          </h3>
          <p className="text-neutral-500 text-sm mb-6 flex-1">
            Accede a las guías para el engranaje interno del equipo y
            automatizaciones.
          </p>
          <div className="flex items-center text-sm font-bold text-brand-gold">
            Ver conocimiento{" "}
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
