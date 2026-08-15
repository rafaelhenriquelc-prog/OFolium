export type EmployeeStatus = 'Ativo' | 'Ativa' | 'Inativo' | 'Inativa';

export type RecordType = 'Hora extra' | 'Falta' | 'Vale' | 'Adicional' | 'Desconto';

export type AbsenceSubtype =
  | 'Falta injustificada'
  | 'Falta justificada'
  | 'Atestado'
  | 'Atraso'
  | 'Saída antecipada';

export type SalaryHistoryEntry = {
  salary: number;
  effectiveDate: string;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  baseSalary: number;
  hireDate: string;
  inactiveDate?: string;
  phone?: string;
  email?: string;
  initials: string;
  avatarColor: string;
  salaryHistory: SalaryHistoryEntry[];
};

export type Movement = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: RecordType;
  absenceSubtype?: AbsenceSubtype;
  occurrenceDate: string;
  competence: string;
  value: string;
  amount?: number;
  estimatedDiscount?: boolean;
  formula?: string;
  notes?: string;
  createdAt: string;
};

export type IndividualReviewStatus = 'Pendente' | 'Revisado';

export type CompetenceStatus = 'Pendente' | 'Em revisão' | 'Fechado';

export type EmployeeClosingSummary = {
  employeeId: string;
  employeeName: string;
  role: string;
  baseSalary: number;
  extras: number;
  additions: number;
  vales: number;
  discounts: number;
  forecast: number;
  reviewStatus: IndividualReviewStatus;
};

export type ClosingSnapshotEmployee = {
  employeeId: string;
  employeeName: string;
  role: string;
  baseSalary: number;
  movements: Movement[];
  extras: number;
  additions: number;
  vales: number;
  discounts: number;
  forecast: number;
  reviewStatus: IndividualReviewStatus;
  notes?: string;
};

export type ClosingSnapshot = {
  id: string;
  competence: string;
  closedAt: string;
  employees: ClosingSnapshotEmployee[];
  totalForecast: number;
  status: 'Fechado';
  previousVersions: ClosingSnapshot[];
  reopenHistory: Array<{ at: string; reason: string }>;
};

export type CompetenceState = {
  competence: string;
  status: CompetenceStatus;
  reviewStatuses: Record<string, IndividualReviewStatus>;
  snapshot: ClosingSnapshot | null;
  archivedSnapshots: ClosingSnapshot[];
};

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  dotColor: string;
  proOnly?: boolean;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail?: string;
  time: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  createdAt: string;
};

export type DashboardStats = {
  activeEmployees: number;
  monthForecast: number;
  overtimeHours: string;
  overtimeEmployeeCount: number;
  pendingCount: number;
  competenceLabel: string;
};
