export interface ClubStats {
  visitas: number; nuevas: number; nuevas_verificadas: number; nuevas_declaradas: number;
  verificadas: number; declaradas: number; repiten: number; pct_nuevas: number;
  con_importe: number; total_visitas: number; gasto_nuevas_estimado: number;
  gasto_total_estimado: number; euros_por_euro_patrocinio: number | null;
  objetivo_nuevas_90d: number; serie: { label: string; total: number; nuevas: number }[];
}
export interface ClubSummary {
  socios_activos: number; activos_semana: number; visitas: number; nuevas_verificadas: number;
  patrocinadores: Record<string, ClubStats>; bajas: Record<string, number>;
}
export const emptyStats: ClubStats = {
  visitas: 0, nuevas: 0, nuevas_verificadas: 0, nuevas_declaradas: 0, verificadas: 0,
  declaradas: 0, repiten: 0, pct_nuevas: 0, con_importe: 0, total_visitas: 0,
  gasto_nuevas_estimado: 0, gasto_total_estimado: 0, euros_por_euro_patrocinio: null,
  objetivo_nuevas_90d: 0, serie: [],
};
export function adaptarStats(s: ClubStats) {
  return { ...s, nuevasVerificadas: s.nuevas_verificadas, nuevasDeclaradas: s.nuevas_declaradas, pctNuevas: s.pct_nuevas };
}