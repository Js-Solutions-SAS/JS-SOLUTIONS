import { ArrowDownUp } from "lucide-react";

import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";

interface QuotesFiltersProps {
  search: string;
  industry: string;
  industries: string[];
  onSearchChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
}

export function QuotesFilters({
  search,
  industry,
  industries,
  onSearchChange,
  onIndustryChange,
}: QuotesFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid gap-3 sm:grid-cols-2 lg:flex">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar lead, empresa, servicio o email"
          className="w-full lg:w-80"
        />

        <Select
          value={industry}
          onChange={(event) => onIndustryChange(event.target.value)}
          className="w-full sm:w-56"
        >
          {industries.map((option) => (
            <option
              key={option}
              value={option}
              className="bg-brand-charcoal text-white"
            >
              {option}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-off-white/60">
        <ArrowDownUp className="h-4 w-4 text-brand-off-white/70" />
        Haz click en los encabezados para ordenar
      </div>
    </div>
  );
}
