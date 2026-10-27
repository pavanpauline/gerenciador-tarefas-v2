import { CATEGORIAS, Categoria, PRIORIDADES, Prioridade, Tarefa } from '../models/tarefa';
import { estaAtrasada } from '../utils/datas';

export interface ResumoGrupo {
  total: number;
  concluidas: number;
  pendentes: number;
  /** % das tarefas do grupo que já foram concluídas. */
  taxaConclusao: number;
  /** % que o grupo representa do total de tarefas. */
  percentualDoTotal: number;
}

export interface Estatisticas {
  total: number;
  concluidas: number;
  pendentes: number;
  atrasadas: number;
  taxaConclusao: number;
  porPrioridade: (ResumoGrupo & { prioridade: Prioridade })[];
  porCategoria: (ResumoGrupo & { categoria: Categoria })[];
}

export const porcentagem = (parte: number, todo: number) => (todo > 0 ? Math.round((parte / todo) * 100) : 0);

function resumir(grupo: readonly Tarefa[], total: number): ResumoGrupo {
  const concluidas = grupo.filter((t) => t.concluida).length;
  return {
    total: grupo.length,
    concluidas,
    pendentes: grupo.length - concluidas,
    taxaConclusao: porcentagem(concluidas, grupo.length),
    percentualDoTotal: porcentagem(grupo.length, total),
  };
}

/** Métricas do dashboard, calculadas a partir da lista de tarefas. */
export function calcularEstatisticas(tarefas: readonly Tarefa[], agora: Date): Estatisticas {
  const total = tarefas.length;
  const concluidas = tarefas.filter((t) => t.concluida).length;

  return {
    total,
    concluidas,
    pendentes: total - concluidas,
    atrasadas: tarefas.filter((t) => !t.concluida && estaAtrasada(t.prazo, agora)).length,
    taxaConclusao: porcentagem(concluidas, total),
    porPrioridade: PRIORIDADES.map((prioridade) => ({
      prioridade,
      ...resumir(tarefas.filter((t) => t.prioridade === prioridade), total),
    })),
    porCategoria: CATEGORIAS.map((categoria) => ({
      categoria,
      ...resumir(tarefas.filter((t) => t.categoria === categoria), total),
    })),
  };
}
