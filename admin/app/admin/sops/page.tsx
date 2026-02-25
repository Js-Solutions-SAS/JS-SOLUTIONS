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
  id?: string;
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

export default function SOPSPage() {
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

  // Extraer categorías únicas
  const categories = [
    "Todas",
    ...Array.from(new Set(sops.map((s) => s.category).filter(Boolean))),
  ];

  // Aplicar Filtros
  const filteredSOPs = sops.filter((sop) => {
    const titleMatch = sop.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const descMatch = sop.description
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || descMatch;

    const matchesCategory =
      selectedCategory === "Todas" || sop.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // --- Helpers ---
  const getCategoryTheme = (category: string) => {
    switch (category?.toLowerCase()) {
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
    switch (type?.toLowerCase()) {
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
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold-dark font-bold text-xs uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-brand-gold" /> Base de
            Conocimiento
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 leading-tight">
            Procedimientos & SOPs
          </h1>
          <p className="text-neutral-500 font-medium text-lg max-w-2xl leading-relaxed">
            Directorio oficial de Operaciones Estándar. Toda la documentación
            estratégica e interna de JS Solutions.
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
            placeholder="Buscar en operaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-4 py-3.5 bg-white border border-neutral-200 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold transition-all outline-none shadow-sm font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all border",
                selectedCategory === cat
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-md scale-105"
                  : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-800",
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
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-brand-gold/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="mt-5 text-neutral-500 font-bold tracking-tight animate-pulse">
              Sincronizando operaciones...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-rose-900 font-extrabold text-xl">
              Fallo de Sincronización
            </h3>
            <p className="text-rose-600 font-medium max-w-sm">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredSOPs.length === 0 && (
          <div className="bg-white border-2 border-dashed border-neutral-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-neutral-50 border border-neutral-100 rounded-3xl flex items-center justify-center text-neutral-300">
              <Search className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-neutral-900 font-extrabold text-2xl tracking-tight">
                Ningún SOP encontrado
              </h3>
              <p className="text-neutral-500 mt-2 font-medium max-w-md mx-auto leading-relaxed">
                No pudimos encontrar procedimientos que coincidan con tu
                búsqueda o filtros.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Todas");
              }}
              className="mt-6 px-8 py-3 rounded-xl bg-neutral-100 text-neutral-900 font-bold hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all"
            >
              Reiniciar Filtros
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
              {filteredSOPs.map((sop, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  key={sop.id || sop.title}
                  className="group bg-white border border-neutral-200/60 rounded-[24px] p-7 hover:shadow-2xl hover:shadow-brand-gold/5 hover:border-brand-gold/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-5">
                    <span
                      className={cn(
                        "px-3 py-1 text-[11px] font-extrabold rounded-md tracking-wider uppercase",
                        getCategoryTheme(sop.category),
                      )}
                    >
                      {sop.category || "General"}
                    </span>

                    <div className="p-2.5 bg-neutral-50 text-neutral-400 rounded-xl group-hover:bg-brand-gold group-hover:text-white transition-all shadow-sm">
                      {getTypeIcon(sop.resourceType)}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-neutral-900 leading-tight mb-3 group-hover:text-brand-gold transition-colors line-clamp-2">
                    {sop.title}
                  </h3>

                  <p className="text-neutral-500 font-medium leading-relaxed text-sm line-clamp-3 mb-8 flex-1">
                    {sop.description}
                  </p>

                  <div className="mt-auto pt-5 border-t border-neutral-100/80 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase">
                      {sop.resourceType || "Recurso"}
                    </span>
                    <a
                      href={sop.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-800 group-hover:text-brand-gold transition-colors"
                    >
                      Abrir archivo <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Glassmorphism Decal */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-tl from-brand-gold/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
