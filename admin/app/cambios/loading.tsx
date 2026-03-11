import { Skeleton } from "@/components/atoms/skeleton";

export default function CambiosLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-[520px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-14" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mt-3 h-72 w-full" />
      </div>
    </div>
  );
}
