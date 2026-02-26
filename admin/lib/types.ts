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
