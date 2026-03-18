import { Metadata } from "next";
import BriefWizard from "@/components/brief/brief-wizard";
import { buildApiUrl, generateCorrelationId, getJsonWithTimeout } from "@/lib/network";

export const metadata: Metadata = {
  title: "Brief Técnico - JS Solutions",
  description: "Define los alcances técnicos de tu proyecto",
};

type BriefValidationResult = {
  isValid: boolean;
  message?: string;
};

async function validateBriefToken(token: string): Promise<BriefValidationResult> {
  const apiUrl = buildApiUrl(
    `/api/v1/public/briefs/${encodeURIComponent(token)}`,
  );

  if (!apiUrl) {
    return {
      isValid: false,
      message:
        "No pudimos validar tu enlace en este momento (API_BASE_URL no configurada).",
    };
  }

  const response = await getJsonWithTimeout(apiUrl, {
    correlationId: generateCorrelationId("brief-token-validation"),
  });

  if (!response.ok) {
    if ([400, 401, 403, 404].includes(response.status)) {
      return {
        isValid: false,
        message:
          "Este enlace de brief no existe o expiró. Solicita uno nuevo por WhatsApp.",
      };
    }

    return {
      isValid: false,
      message:
        "No pudimos validar el enlace por un problema temporal. Intenta en unos minutos.",
    };
  }

  return { isValid: true };
}

export default async function BriefPage({
  params,
}: {
  params: { token: string };
}) {
  const validation = await validateBriefToken(params.token);

  if (!validation.isValid) {
    return (
      <main className="min-h-screen bg-brand-black text-brand-off-white selection:bg-brand-gold selection:text-brand-black flex items-center justify-center p-6 py-20 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-2xl relative z-10 rounded-[2rem] border border-zinc-800 bg-zinc-900/95 p-10 text-center space-y-6">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            Enlace de Brief No Valido
          </h1>
          <p className="text-zinc-400 leading-relaxed">
            {validation.message ||
              "No pudimos validar tu enlace de brief. Solicita uno nuevo para continuar."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/573186110790"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-gold px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-black"
            >
              Solicitar Nuevo Enlace
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-100"
            >
              Ir al Inicio
            </a>
          </div>
        </div>
      </main>
    );
  }

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
