import { Metadata } from "next";
import BriefWizard from "@/components/brief/brief-wizard";

export const metadata: Metadata = {
  title: "Brief Técnico - JS Solutions",
  description: "Define los alcances técnicos de tu proyecto",
};

export default function BriefPage({ params }: { params: { token: string } }) {
  // Aquí podríamos hacer un pre-fetch para ver si el token es válido
  // Pero para simplicidad, dejamos al wizard procesarlo con el token directamente.

  return (
    <main className="min-h-screen bg-brand-black text-brand-off-white selection:bg-brand-gold selection:text-brand-black flex items-center justify-center p-6 py-20 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl relative z-10">
        <BriefWizard token={params.token} />
      </div>
    </main>
  );
}
