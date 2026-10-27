import { Categoria, PESO_PRIORIDADE, Prioridade, Tarefa } from '../models/tarefa';
import { lerPrazo } from '../utils/datas';

export type FiltroStatus = 'Todas' | 'Pendentes' | 'Concluídas';

export interface Filtros {
  termo: string;
  status: FiltroStatus;
  prioridade: Prioridade | 'Todas';
  categoria: Categoria | 'Todas';
}

export const OPCOES_STATUS: readonly FiltroStatus[] = ['Todas', 'Pendentes', 'Concluídas'];

/** Minúsculas e sem acento: "Relatório" e "relatorio" passam a ser iguais na busca. */
export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function temFiltroAtivo(filtros: Filtros): boolean {
  return (
    filtros.status !== 'Todas' ||
    filtros.prioridade !== 'Todas' ||
    filtros.categoria !== 'Todas' ||
    normalizarTexto(filtros.termo) !== ''
  );
}

/** Aplica status, prioridade, categoria e a busca por texto (título, notas, categoria e prioridade). */
export function filtrarTarefas(tarefas: readonly Tarefa[], filtros: Filtros): Tarefa[] {
  const termo = normalizarTexto(filtros.termo);
  return tarefas.filter((t) => {
    if (filtros.status === 'Pendentes' && t.concluida) return false;
    if (filtros.status === 'Concluídas' && !t.concluida) return false;
    if (filtros.prioridade !== 'Todas' && t.prioridade !== filtros.prioridade) return false;
    if (filtros.categoria !== 'Todas' && t.categoria !== filtros.categoria) return false;
    if (!termo) return true;
    return [t.titulo, t.notas ?? '', t.categoria, t.prioridade].some((campo) => normalizarTexto(campo).includes(termo));
  });
}

const instantePrazo = (t: Tarefa) => lerPrazo(t.prazo)?.getTime() ?? Number.POSITIVE_INFINITY;

/** Pendentes: prioridade (Alta → Média → Baixa) e, empatando, o prazo mais próximo; sem prazo vai para o fim. */
export function ordenarPendentes(tarefas: readonly Tarefa[]): Tarefa[] {
  return [...tarefas].sort(
    (a, b) => PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade] || instantePrazo(a) - instantePrazo(b),
  );
}

/** Concluídas: as concluídas mais recentemente primeiro. */
export function ordenarConcluidas(tarefas: readonly Tarefa[]): Tarefa[] {
  const instante = (t: Tarefa) => (t.concluidaEm ? Date.parse(t.concluidaEm) : 0);
  return [...tarefas].sort((a, b) => instante(b) - instante(a));
}
