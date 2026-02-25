"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Search,
  ExternalLink,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Interfaces ---
interface Task {
  id: string;
  name: string;
  status: "Pendiente" | "En curso" | "QA" | "Finalizado";
}

interface ProjectData {
  projectName: string;
  serviceType: string;
  currentPhase: string;
  progressPercentage: number;
  driveFolderUrl: string;
  tasks: Task[];
}

export default function DashboardPage() {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);

  const fetchProjectDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/project-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo cargar la información del proyecto.",
        );
      }

      // Pequeño delay artificial para que la animación de carga se aprecie
      await new Promise((r) => setTimeout(r, 600));
      setProjectData(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error de red desconocido.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helpers de UI ---
  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "Finalizado":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "QA":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case "En curso":
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusClasses = (status: Task["status"]) => {
    switch (status) {
      case "Finalizado":
        return "bg-emerald-50/50 text-emerald-700 border-emerald-100/50";
      case "QA":
        return "bg-amber-50/50 text-amber-700 border-amber-100/50";
      case "En curso":
        return "bg-blue-50/50 text-blue-700 border-blue-100/50";
      default:
        return "bg-neutral-50 text-neutral-600 border-neutral-200/50";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Background Decorativo Abstracto */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center items-center">
        <div className="absolute w-[800px] h-[800px] bg-gradient-to-tr from-blue-100/40 via-purple-50/40 to-emerald-50/40 rounded-full blur-3xl opacity-50 transform -translate-y-1/2"></div>
      </div>

      <main className="w-full max-w-5xl z-10 relative">
        <AnimatePresence mode="wait">
          {!projectData ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md mx-auto"
            >
              <div className="text-center mb-8 space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-neutral-100 mb-2">
                  <LayoutDashboard
                    className="w-8 h-8 text-neutral-800"
                    strokeWidth={1.5}
                  />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gradient">
                  Portal de Cliente
                </h1>
                <p className="text-neutral-500 font-medium text-sm sm:text-base px-4">
                  JS Solutions — Monitorea el progreso de tu entorno en tiempo
                  real.
                </p>
              </div>

              <div className="glassmorphism rounded-3xl p-6 sm:p-8">
                <form onSubmit={fetchProjectDetails} className="space-y-5">
                  <div className="space-y-1.5 focus-within:text-black text-neutral-500 transition-colors">
                    <label
                      htmlFor="identifier"
                      className="text-sm font-semibold ml-1"
                    >
                      Identificador del Proyecto
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 opacity-50" />
                      </div>
                      <input
                        id="identifier"
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3.5 bg-neutral-100/50 border border-neutral-200/80 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-900 transition-all outline-none"
                        placeholder="Ej: correo@empresa.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !identifier.trim()}
                    className="group relative w-full flex items-center justify-center py-3.5 px-4 rounded-2xl text-white bg-neutral-900 hover:bg-black focus:outline-none focus:ring-4 focus:ring-neutral-900/20 font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <span
                      className={cn(
                        "transition-transform duration-300 flex items-center gap-2",
                        isLoading ? "translate-y-[-150%]" : "translate-y-0",
                      )}
                    >
                      Ingresar al Portal{" "}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span
                      className={cn(
                        "absolute inset-0 flex items-center justify-center transition-transform duration-300",
                        isLoading ? "translate-y-0" : "translate-y-[150%]",
                      )}
                    >
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span className="ml-2">Conectando...</span>
                    </span>
                  </button>
                </form>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.1,
              }}
              className="w-full space-y-6 sm:space-y-8"
            >
              {/* Toolbar superior */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-800 to-black flex items-center justify-center shadow-lg shadow-black/10">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 leading-tight">
                      {projectData.projectName}
                    </h2>
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 mt-0.5">
                      <span>{projectData.serviceType}</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                      <button
                        onClick={() => setProjectData(null)}
                        className="hover:text-black transition-colors"
                      >
                        Cambiar proyecto
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.a
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  href={projectData.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center px-4 py-2.5 rounded-2xl text-sm font-semibold bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
                >
                  <FolderOpen className="w-4 h-4 mr-2 text-blue-500 group-hover:scale-110 transition-transform" />
                  Ver en Drive
                  <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-50" />
                </motion.a>
              </div>

              {/* Controles Principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats & Progress - Toma 2 columnas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="md:col-span-2 glass-card rounded-3xl p-6 sm:p-8"
                >
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                        Estado del Proyecto
                      </h3>
                      <p className="text-sm font-medium text-neutral-500 mt-1">
                        Fase:{" "}
                        <span className="text-black font-semibold">
                          {projectData.currentPhase}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-gradient">
                        {projectData.progressPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Animada */}
                  <div className="w-full bg-neutral-100 rounded-full h-4 sm:h-5 overflow-hidden border border-neutral-200/50 shadow-inner p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${projectData.progressPercentage}%` }}
                      transition={{
                        duration: 1.5,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                      className="bg-neutral-900 h-full rounded-full relative overflow-hidden"
                    >
                      {/* Brillo en la barra */}
                      <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Resumen info lateral */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card rounded-3xl p-6 flex flex-col justify-center bg-gradient-to-b from-white to-neutral-50/50"
                >
                  <h4 className="text-sm font-semibold text-neutral-500 mb-4 uppercase tracking-wider">
                    Resumen Tareas
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" /> Finalizadas
                      </div>
                      <span className="font-bold text-neutral-900">
                        {
                          projectData.tasks.filter(
                            (t) => t.status === "Finalizado",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="w-full h-px bg-neutral-100"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                        <PlayCircle className="w-4 h-4" /> En progreso
                      </div>
                      <span className="font-bold text-neutral-900">
                        {
                          projectData.tasks.filter(
                            (t) => t.status === "En curso" || t.status === "QA",
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Lista Detallada de Tareas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-4 sm:p-8 shadow-sm border border-neutral-200/60"
              >
                <div className="mb-6 px-2">
                  <h3 className="text-xl font-bold text-neutral-900">
                    Entregables y Tareas
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Sigue en detalle cada paso del procedimiento.
                  </p>
                </div>

                <div className="grid gap-3">
                  {projectData.tasks.map((task, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      key={task.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-neutral-100 bg-neutral-50 hover:bg-white hover:border-neutral-200 hover:shadow-sm transition-all gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div
                          className={cn(
                            "p-2 rounded-xl transition-colors shrink-0",
                            task.status === "Finalizado"
                              ? "bg-emerald-100"
                              : task.status === "En curso"
                                ? "bg-blue-100"
                                : task.status === "QA"
                                  ? "bg-amber-100"
                                  : "bg-neutral-200/50",
                          )}
                        >
                          {getStatusIcon(task.status)}
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-900 block">
                            {task.name}
                          </span>
                          <span className="text-xs font-medium text-neutral-400 mt-0.5 flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" /> Fase {idx + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <span
                          className={cn(
                            "px-4 py-1.5 text-xs font-bold rounded-full border tracking-wide uppercase shadow-sm",
                            getStatusClasses(task.status),
                          )}
                        >
                          {task.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer minimalista */}
      <div className="absolute bottom-6 text-center w-full z-0 pointer-events-none">
        <p className="text-xs font-medium text-neutral-400/80">
          Powered by <span className="font-bold text-neutral-900/60">n8n</span>{" "}
          & <span className="font-bold text-neutral-900/60">Next.js</span>
        </p>
      </div>

      {/* Definición de animación personalizada */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `,
        }}
      />
    </div>
  );
}
