"use client";

import { useState } from "react";

// Interfaces que mapean el formato JSON que n8n debe devolver
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

  const fetchProjectDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Petición a nuestro propio Route Handler, nunca a n8n directamente
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

      setProjectData(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error desconocido.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper para asignar colores según el estado de la tarea
  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "Finalizado":
        return "bg-green-100 text-green-800 border-green-200";
      case "QA":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "En curso":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">
            Portal de Clientes
          </h1>
          <p className="text-neutral-500">
            JS Solutions — Monitorea el progreso de tu entorno en tiempo real.
          </p>
        </div>

        {/* Estado: Pendiente de Ingreso */}
        {!projectData && (
          <form
            onSubmit={fetchProjectDetails}
            className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 transition-all"
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Email o Código de Proyecto
                </label>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  placeholder="ej. contacto@empresa.com"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-white bg-black hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black font-semibold transition-all disabled:opacity-70"
              >
                {isLoading ? "Buscando proyecto..." : "Acceder al Portal"}
              </button>
            </div>

            {/* Estado: Error */}
            {error && (
              <div className="mt-4 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100">
                {error}
              </div>
            )}
          </form>
        )}

        {/* Estado: Datos Cargados */}
        {projectData && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Cabecera del Proyecto */}
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">
                  {projectData.projectName}
                </h2>
                <p className="text-sm font-medium text-neutral-500 mt-1">
                  Servicio:{" "}
                  <span className="text-neutral-700">
                    {projectData.serviceType}
                  </span>
                </p>
              </div>
              <a
                href={projectData.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {/* Ícono de Carpeta */}
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                Archivos en Drive
              </a>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Barra de Progreso General */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Progreso del Proyecto
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Fase actual: {projectData.currentPhase}
                    </p>
                  </div>
                  <span className="text-xl font-bold text-black">
                    {projectData.progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-black h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${projectData.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Lista de Tareas */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Entregables y Tareas
                </h3>
                <div className="grid gap-3">
                  {projectData.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-neutral-100/50 transition-colors"
                    >
                      <span className="font-medium text-neutral-800">
                        {task.name}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
