export type PlanTier = 'base' | 'pro';

export type PlanConfig = {
  tier: PlanTier;
  name: string;
  priceLabel: string;
  activeEmployeeLimit: number;
  sidebarLinkLabel: string;
};

export const PLANS: Record<PlanTier, PlanConfig> = {
  base: {
    tier: 'base',
    name: 'Plano Base',
    priceLabel: 'Grátis',
    activeEmployeeLimit: 5,
    sidebarLinkLabel: 'Conhecer Pro',
  },
  pro: {
    tier: 'pro',
    name: 'Plano Pro',
    priceLabel: 'R$ 29,90/mês',
    activeEmployeeLimit: 20,
    sidebarLinkLabel: 'Gerenciar plano',
  },
};

export const PRO_TRIAL_DAYS = 30;

export const PLAN_CARD_CONTENT = {
  base: {
    price: 'Grátis',
    activeLimit: PLANS.base.activeEmployeeLimit,
    description: 'Para organizar as informações essenciais da sua equipe.',
    features: [
      'Registro de movimentações',
      'Horas extras, faltas e vales',
      'Adicionais e descontos',
      'Resumo mensal',
      'Histórico dos últimos 3 meses',
      'Alertas básicos',
    ],
  },
  pro: {
    price: 'R$ 29,90/mês',
    activeLimit: PLANS.pro.activeEmployeeLimit,
    description: 'Para revisar, preservar e exportar seu fechamento gerencial mensal.',
    features: [
      'Fechamento preservado',
      'Relatório para o contador',
      'Exportação em PDF, Excel e CSV',
      'Histórico completo',
      'Revisão do mês por funcionário',
      'Comparação entre meses',
      'Alertas completos de pendências',
    ],
  },
};

export type PlanTableCellValue = 'included' | 'unavailable' | string;

export type PlanTableRow = {
  label: string;
  base: PlanTableCellValue;
  pro: PlanTableCellValue;
};

export const PLAN_TABLE_ROWS: PlanTableRow[] = [
  { label: 'Funcionários ativos', base: 'Até 5', pro: 'Até 20' },
  { label: 'Registro de movimentações', base: 'included', pro: 'included' },
  { label: 'Horas extras, faltas e vales', base: 'included', pro: 'included' },
  { label: 'Adicionais e descontos', base: 'included', pro: 'included' },
  { label: 'Resumo mensal', base: 'included', pro: 'included' },
  { label: 'Histórico', base: 'Últimos 3 meses', pro: 'Completo' },
  { label: 'Revisão por funcionário', base: 'unavailable', pro: 'included' },
  { label: 'Status do fechamento', base: 'Em aberto', pro: 'Pendente, em revisão e fechado' },
  { label: 'Fechamento preservado', base: 'unavailable', pro: 'included' },
  { label: 'Comparação entre meses', base: 'unavailable', pro: 'included' },
  { label: 'Alertas de pendências', base: 'Básicos', pro: 'Completos' },
  { label: 'Relatório para o contador', base: 'unavailable', pro: 'included' },
  { label: 'Exportação em PDF', base: 'unavailable', pro: 'included' },
  { label: 'Exportação Excel/CSV', base: 'unavailable', pro: 'included' },
];

export const PRO_BENEFITS = [
  {
    title: 'Fechamento preservado',
    description: 'Alterações futuras não modificam competências já encerradas.',
  },
  {
    title: 'Relatório para o contador',
    description: 'Reúna todas as movimentações do mês em um resumo organizado.',
  },
  {
    title: 'Exportação de documentos',
    description: 'Exporte as informações em PDF, Excel ou CSV.',
  },
  {
    title: 'Histórico completo',
    description: 'Consulte movimentações e fechamentos de qualquer período.',
  },
] as const;

export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLANS[tier];
}
