"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, FileText, Search, Video } from "lucide-react";

import { Badge } from "@/components/atoms/badge";
import { Card, CardContent } from "@/components/molecules/card";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";
import type { SOP } from "@/lib/types";

interface SopsBentoClientProps {
  initialSops: SOP[];
}

function getResourceIcon(resourceType: string) {
  const value = resourceType.toLowerCase();

  if (value.includes("video")) return <Video className="h-4 w-4" />;
  if (value.includes("doc")) return <FileText className="h-4 w-4" />;

  return <BookOpen className="h-4 w-4" />;
}

export function SopsBentoClient({ initialSops }: SopsBentoClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  const categories = useMemo(() => {
    const values = new Set(initialSops.map((sop) => sop.category || "General"));
    return ["Todas", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [initialSops]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    return initialSops.filter((sop) => {
      const matchSearch =
        !query ||
        sop.title.toLowerCase().includes(query) ||
        sop.description.toLowerCase().includes(query);
      const matchCategory = category === "Todas" || sop.category === category;

      return matchSearch && matchCategory;
    });
  }, [initialSops, search, category]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-brand-off-white/45" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar SOP o proceso"
            className="pl-9"
          />
        </div>

        <Select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full sm:w-72"
        >
          {categories.map((option) => (
            <option key={option} value={option} className="bg-brand-charcoal text-white">
              {option}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((sop) => (
          <Card
            key={sop.id || sop.title}
            className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-brand-gold/40 hover:shadow-[0_16px_38px_rgba(212,175,55,0.12)]"
          >
            <CardContent className="flex h-full flex-col p-5">
              <div className="mb-3 flex items-center justify-between">
                <Badge tone="neutral">{sop.category || "General"}</Badge>
                <div className="rounded-lg border border-white/10 p-2 text-brand-off-white/60 transition-colors group-hover:border-brand-gold/30 group-hover:text-brand-gold">
                  {getResourceIcon(sop.resourceType || "Documento")}
                </div>
              </div>

              <h3 className="text-lg font-semibold leading-tight text-white transition-colors group-hover:text-brand-gold">
                {sop.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm text-brand-off-white/70">{sop.description}</p>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                  {sop.resourceType || "Recurso"}
                </span>
                <a
                  href={sop.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-white transition-colors hover:text-brand-gold"
                >
                  Ver
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-base font-semibold text-white">No hay resultados para los filtros actuales.</p>
            <p className="mt-1 text-sm text-brand-off-white/70">Prueba otra categoria o ajusta la busqueda.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
