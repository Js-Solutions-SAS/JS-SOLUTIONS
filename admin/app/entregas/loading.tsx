import { Skeleton } from "@/components/ui/skeleton";

export default function EntregasLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-12" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-4 h-10 w-full" />
          <Skeleton className="mt-3 h-80 w-full" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-24 w-full" />
          <Skeleton className="mt-3 h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
