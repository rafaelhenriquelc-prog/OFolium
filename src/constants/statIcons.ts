export const STAT_ICONS = {
  funcionariosAtivos: require('@/assets/images/summary/funcionarios_ativos.png'),
  previsaoDoMes: require('@/assets/images/summary/previsao_do_mes.png'),
  horasExtras: require('@/assets/images/summary/horas_extras.png'),
  pendencias: require('@/assets/images/summary/pendencias.png'),
  vales: require('@/assets/images/summary/vales.png'),
  faltas: require('@/assets/images/summary/faltas.png'),
  adicionais: require('@/assets/images/summary/adicionais.png'),
} as const;

/** Ícones do Painel — PNG com círculo pêssego embutido. */
export const DASHBOARD_STAT_ICONS = {
  activeEmployees: require('@/assets/images/icone_funcionarios_ativos.png'),
  monthForecast: require('@/assets/images/icone_previsao_mes.png'),
  overtime: require('@/assets/images/icone_horas_extras.png'),
  pending: require('@/assets/images/icone_pendencias.png'),
} as const;

/** Ícones de Relatórios — PNG com círculo pêssego embutido. */
export const REPORTS_STAT_ICONS = {
  totalForecast: require('../../assets/images/icone_total_previsto.png'),
  overtime: require('../../assets/images/icone_horas_extras.png'),
  vales: require('../../assets/images/icone_vales.png'),
  absences: require('../../assets/images/icone_faltas.png'),
} as const;

/** Ícones de Fechamentos — PNG com círculo pêssego embutido. */
export const CLOSINGS_STAT_ICONS = {
  totalForecast: require('../../assets/images/icone_fechamentos_total_previsto.png'),
  employeesReviewed: require('../../assets/images/icone_funcionarios_revisados.png'),
} as const;

export const HEADER_BELL_ICON = require('@/assets/images/sidebar/sino.png');
