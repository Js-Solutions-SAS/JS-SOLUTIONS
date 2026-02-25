"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BookOpen,
  ChevronRight,
  AlertCircle,
  FileText,
  Video,
  Database,
  Code,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Interfaces para SOPs ---
export interface SOP {
  id: string;
  title: string;
  category:
    | "Ventas"
    | "Desarrollo Web"
    | "Automatización n8n"
    | "General"
    | string;
  description: string;
  resourceType: "Documento" | "Video" | "Carpeta" | string;
  url: string;
}

export default function OperacionesSOPsPage() {
  const [sops, setSops] = useState<SOP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States para el Filtro
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  useEffect(() => {
    const fetchSOPs = async () => {
      try {
        const res = await fetch("/api/admin/sops");
        if (!res.ok) {
          throw new Error("No pudimos cargar los SOPs en este momento.");
        }
        const data = await res.json();

        // Asume que n8n retorna un array directo
        // o envuelto en un objeto { data: [...] }
        const sopsArray = Array.isArray(data) ? data : data.data || [];
        setSops(sopsArray);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error desconocido de red.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSOPs();
  }, []);

  // Extraer las categorías únicas disponibles en los datos reales
  const categories = [
    "Todas",
    ...Array.from(new Set(sops.map((s) => s.category))),
  ];

  // Aplicar Filtros (Búsqueda + Categoría)
  const filteredSOPs = sops.filter((sop) => {
    const matchesSearch =
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todas" || sop.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // --- Helpers Locales ---
  const getCategoryTheme = (category: string) => {
    switch (category.toLowerCase()) {
      case "ventas":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "desarrollo web":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "automatización n8n":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "código":
        return <Code className="w-4 h-4" />;
      case "base de datos":
        return <Database className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full flex flex-col space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-16 md:pb-0">
      {/* HEADER MOODBOARD */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold-light text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" /> Base de Conocimiento
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 leading-tight">
            Operaciones & SOPs
          </h1>
          <p className="text-neutral-500 font-medium text-lg max-w-2xl">
            Directorio de Procedimientos Operativos Estándar. Toda la
            documentación de procesos internos de JS Solutions.
          </p>
        </div>
      </div>

      <div className="w-full h-px bg-neutral-200/60"></div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar procedimiento o recurso..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold transition-all outline-none shadow-sm font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all border",
                selectedCategory === cat
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="relative min-h-[400px]">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div className="w-10 h-10 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin"></div>
            <p className="mt-4 text-neutral-500 font-medium animate-pulse">
              Cargando base de conocimientos...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-red-800 font-bold text-lg">Hubo un problema</h3>
            <p className="text-red-600 text-sm max-w-md">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredSOPs.length === 0 && (
          <div className="bg-white border-2 border-dashed border-neutral-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-neutral-900 font-bold text-xl">
                Ningún SOP encontrado
              </h3>
              <p className="text-neutral-500 mt-1 max-w-sm">
                No pudimos encontrar procedimientos que coincidan con tus
                filtros de búsqueda actual.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Todas");
              }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-neutral-100 text-neutral-900 font-semibold hover:bg-neutral-200 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* SOPs Grid */}
        <AnimatePresence>
          {!isLoading && !error && filteredSOPs.length > 0 && (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filteredSOPs.map((sop) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={sop.id || sop.title}
                  className="group bg-white border border-neutral-200/80 rounded-3xl p-6 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-lg border tracking-wide uppercase",
                        getCategoryTheme(sop.category),
                      )}
                    >
                      {sop.category}
                    </span>

                    <div className="p-2 bg-neutral-50 text-neutral-400 rounded-xl group-hover:bg-brand-gold/10 group-hover:text-brand-gold transition-colors">
                      {getTypeIcon(sop.resourceType)}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-neutral-900 leading-tight mb-2 group-hover:text-brand-gold transition-colors">
                    {sop.title}
                  </h3>

                  <p className="text-neutral-500 text-sm line-clamp-3 mb-6 flex-1">
                    {sop.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400 tracking-wider">
                      {sop.resourceType?.toUpperCase() || "RECURSO"}
                    </span>
                    <a
                      href={sop.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900 group-hover:text-brand-gold transition-colors"
                    >
                      Ver recurso <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Decal background (subtle) */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-tl from-brand-gold/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
