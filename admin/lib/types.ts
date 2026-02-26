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

export type CapacityUtilizationBand = "healthy" | "warning" | "over";

export interface TeamCapacityEntry {
  id: string;
  personName: string;
  role: string;
  weekLabel: string;
  capacityHours: number;
  assignedHours: number;
  projectCount: number;
  focusArea: string;
  ownerEmail?: string;
}

export interface CapacityMetrics {
  people: number;
  overallocated: number;
  atRisk: number;
  healthy: number;
  avgUtilization: number;
}

export type RaidType = "Risk" | "Assumption" | "Issue" | "Dependency";

export type RaidStatus = "Open" | "Mitigated" | "Blocked" | "Closed";

export interface RaidItem {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  industry: string;
  owner: string;
  type: RaidType;
  status: RaidStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  title: string;
  detail: string;
  dueDate?: string;
  mitigation?: string;
  dependencyOn?: string;
  externalUrl?: string;
}

export interface RaidProjectSummary {
  projectId: string;
  projectName: string;
  clientName: string;
  industry: string;
  open: number;
  critical: number;
  risks: number;
  assumptions: number;
  issues: number;
  dependencies: number;
}

export interface RaidMetrics {
  total: number;
  open: number;
  criticalOpen: number;
  risks: number;
  assumptions: number;
  issues: number;
  dependencies: number;
}

export type ApprovalStage =
  | "Brief"
  | "Scope"
  | "QA"
  | "UAT"
  | "Contract"
  | "Scope Change";

export type ApprovalStatus =
  | "Pending"
  | "In Review"
  | "Approved"
  | "Rejected"
  | "Blocked";

export interface ApprovalItem {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  industry: string;
  owner: string;
  stage: ApprovalStage;
  status: ApprovalStatus;
  requestedAt: string;
  dueDate?: string;
  approvedAt?: string;
  title: string;
  notes?: string;
  externalUrl?: string;
}

export interface ApprovalMetrics {
  total: number;
  pending: number;
  inReview: number;
  blocked: number;
  approved: number;
  overdue: number;
}

export interface ApprovalStageCoverage {
  stage: ApprovalStage;
  total: number;
  approved: number;
  pending: number;
}
