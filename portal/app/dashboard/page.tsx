import { Suspense } from "react";

import { redirect } from "next/navigation";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import DashboardLoading from "@/app/dashboard/loading";
import { fetchProjectStatus } from "@/lib/project-status";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: {
    token?: string | string[];
  };
}

async function DashboardResolved({ token }: { token: string }) {
  const projectData = await fetchProjectStatus(token);

  return <DashboardClient token={token} initialData={projectData} />;
}

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  const rawToken = searchParams?.token;
  const token = Array.isArray(rawToken)
    ? (rawToken[0] ?? "")
    : (rawToken ?? "");

  if (!token) {
    redirect("/?error=invalid_token");
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardResolved token={token} />
    </Suspense>
  );
}
