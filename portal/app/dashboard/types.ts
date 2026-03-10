export type TaskStatus = "Pendiente" | "En curso" | "QA" | "Finalizado";

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  phase?: string;
}

export type MilestoneStatus = "Pendiente" | "En Proceso" | "Completado";

export interface Milestone {
  id: string;
  name: string;
  status: MilestoneStatus;
  description?: string;
}

export type DocumentStatus = "Pendiente" | "En revisión" | "Aprobado";

export type QuoteStatus = DocumentStatus;

export type DocumentType =
  | "pdf"
  | "doc"
  | "image"
  | "figma"
  | "sheet"
  | "link"
  | "other";

export interface ProjectDocument {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  url: string;
  updatedAt?: string;
  sizeLabel?: string;
  kind?: "quote" | "contract" | "deliverable";
}

export interface ProjectQuote {
  id: string;
  name: string;
  url: string;
  status: QuoteStatus;
  sentAt?: string;
  approvedAt?: string;
}

export interface ProjectContract {
  id: string;
  name: string;
  url: string;
  status: QuoteStatus;
  sentAt?: string;
  approvedAt?: string;
}

export interface ProjectSignature {
  provider?: string;
  quoteEnvelopeId?: string;
  contractEnvelopeId?: string;
  quoteSignUrl?: string;
  contractSignUrl?: string;
  status?: string;
  updatedAt?: string;
}

export type PaymentStatus =
  | "pending"
  | "processing"
  | "approved"
  | "rejected"
  | "manual_review";

export interface PaymentMethodInfo {
  label: string;
  value: string;
}

export interface ProjectPayments {
  status: PaymentStatus;
  amount?: number;
  currency?: "COP";
  checkoutUrl?: string;
  paymentIntentId?: string;
  approvedAt?: string;
  methods?: PaymentMethodInfo[];
}

export interface ProjectData {
  clientToken: string;
  projectName: string;
  serviceType: string;
  currentPhase: string;
  progressPercentage: number;
  driveFolderUrl: string;
  quote?: ProjectQuote;
  contract?: ProjectContract;
  signature?: ProjectSignature;
  payments?: ProjectPayments;
  tasks: Task[];
  milestones: Milestone[];
  documents: ProjectDocument[];
}
