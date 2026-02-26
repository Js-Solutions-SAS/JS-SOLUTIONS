export interface Quote {
  id: string;
  nombre: string;
  empresa: string;
  servicio: string;
  monto: string;
  estado: string;
  email?: string;
  industria?: string;
}

export interface SOP {
  id?: string;
  title: string;
  category: string;
  description: string;
  resourceType: string;
  url: string;
}

export interface DashboardMetrics {
  proyectosActivos: number;
  cotizacionesPendientes: number;
  contratosGenerados: number;
  totalSops: number;
}

export type MilestoneRiskLevel = "none" | "low" | "medium" | "high";

export interface Milestone {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  industry: string;
  owner: string;
  phase: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  externalUrl?: string;
}

export interface DeliveryMetrics {
  total: number;
  overdue: number;
  dueIn7Days: number;
  blocked: number;
}
