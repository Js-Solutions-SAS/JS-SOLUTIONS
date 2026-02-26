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
}

export interface ProjectData {
  projectName: string;
  serviceType: string;
  currentPhase: string;
  progressPercentage: number;
  driveFolderUrl: string;
  tasks: Task[];
  milestones: Milestone[];
  documents: ProjectDocument[];
}
