import { Skeleton } from "@/components/ui/skeleton";

export default function SopsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-4 h-6 w-52" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-10/12" />
            <Skeleton className="mt-8 h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
