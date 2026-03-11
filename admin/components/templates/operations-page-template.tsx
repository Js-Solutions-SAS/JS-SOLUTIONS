import { Suspense, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface OperationsPageTemplateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  fallback: ReactNode;
  children: ReactNode;
}

export function OperationsPageTemplate({
  title,
  description,
  icon: Icon,
  fallback,
  children,
}: OperationsPageTemplateProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
          <Icon className="h-8 w-8 text-brand-gold" />
          {title}
        </h1>
        <p className="mt-1 text-sm text-brand-off-white/70">{description}</p>
      </div>

      <Suspense fallback={fallback}>{children}</Suspense>
    </div>
  );
}
