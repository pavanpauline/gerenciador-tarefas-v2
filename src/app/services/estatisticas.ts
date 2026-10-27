import { CATEGORIAS, Categoria, PRIORIDADES, Prioridade, Tarefa } from '../models/tarefa';
import { DIAS_CURTOS, diferencaEmDias, estaAtrasada, lerPrazo, paraDataLocal } from '../utils/datas';

export interface ResumoGrupo {
  total: number;
  concluidas: number;
  pendentes: number;
  /** % das tarefas do grupo que já foram concluídas. */
  taxaConclusao: number;
  /** % que o grupo representa do total de tarefas. */
  percentualDoTotal: number;
}

/** Um dia do gráfico de atividade. */
export interface DiaAtividade {
  /** 'AAAA-MM-DD' */
  data: string;
  /** "Seg", "Ter"... */
  rotulo: string;
  concluidas: number;
  ehHoje: boolean;
}

export interface Estatisticas {
  total: number;
  concluidas: number;
  pendentes: number;
  taxaConclusao: number;
  porPrioridade: (ResumoGrupo & { prioridade: Prioridade })[];
  porCategoria: (ResumoGrupo & { categoria: Categoria })[];

  // Prazos (só tarefas pendentes)
  atrasadas: number;
  venceHoje: number;
  /** Prazo entre amanhã e daqui a 7 dias. */
  proximos7Dias: number;
  /** As 5 pendentes com prazo mais próximo (atrasadas primeiro). */
  proximosPrazos: Tarefa[];

  // Atividade (usa a data de conclusão)
  concluidasHoje: number;
  /** Do mais antigo até hoje. */
  ultimos7Dias: DiaAtividade[];
  concluidasSemana: number;
  concluidasSemanaAnterior: number;
  /** Dias seguidos com pelo menos uma tarefa concluída, até hoje (ou até ontem, se hoje ainda não houve). */
  sequenciaDias: number;
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

/** Quantas tarefas foram concluídas em cada dia ('AAAA-MM-DD', no horário do aparelho). */
function concluidasPorDia(tarefas: readonly Tarefa[]): Map<string, number> {
  const porDia = new Map<string, number>();
  for (const tarefa of tarefas) {
    if (!tarefa.concluida || !tarefa.concluidaEm) continue;
    const momento = new Date(tarefa.concluidaEm);
    if (Number.isNaN(momento.getTime())) continue;
    const dia = paraDataLocal(momento);
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
  }
  return porDia;
}

/** Métricas do dashboard, calculadas a partir da lista de tarefas. */
export function calcularEstatisticas(tarefas: readonly Tarefa[], agora: Date): Estatisticas {
  const total = tarefas.length;
  const concluidas = tarefas.filter((t) => t.concluida).length;
  const pendentes = tarefas.filter((t) => !t.concluida);

  // --- Prazos ---
  const comPrazo = pendentes
    .map((tarefa) => ({ tarefa, prazo: lerPrazo(tarefa.prazo) }))
    .filter((item): item is { tarefa: Tarefa; prazo: Date } => item.prazo !== null);
  const atrasadas = comPrazo.filter(({ tarefa }) => estaAtrasada(tarefa.prazo, agora));
  const noPrazo = comPrazo.filter(({ tarefa }) => !estaAtrasada(tarefa.prazo, agora));

  // --- Atividade ---
  const porDia = concluidasPorDia(tarefas);
  // Meio-dia evita erros em dias de mudança de horário
  const dia = (deslocamento: number) => {
    const data = new Date(agora);
    data.setHours(12, 0, 0, 0);
    data.setDate(data.getDate() + deslocamento);
    return data;
  };
  const contar = (deslocamento: number) => porDia.get(paraDataLocal(dia(deslocamento))) ?? 0;
  const somar = (de: number, ate: number) => {
    let soma = 0;
    for (let d = de; d <= ate; d++) soma += contar(d);
    return soma;
  };

  const ultimos7Dias: DiaAtividade[] = [-6, -5, -4, -3, -2, -1, 0].map((deslocamento) => {
    const data = dia(deslocamento);
    return {
      data: paraDataLocal(data),
      rotulo: DIAS_CURTOS[data.getDay()],
      concluidas: contar(deslocamento),
      ehHoje: deslocamento === 0,
    };
  });

  let sequenciaDias = 0;
  for (let d = contar(0) > 0 ? 0 : -1; contar(d) > 0; d--) sequenciaDias++;

  return {
    total,
    concluidas,
    pendentes: total - concluidas,
    taxaConclusao: porcentagem(concluidas, total),
    porPrioridade: PRIORIDADES.map((prioridade) => ({
      prioridade,
      ...resumir(tarefas.filter((t) => t.prioridade === prioridade), total),
    })),
    porCategoria: CATEGORIAS.map((categoria) => ({
      categoria,
      ...resumir(tarefas.filter((t) => t.categoria === categoria), total),
    })),

    atrasadas: atrasadas.length,
    venceHoje: noPrazo.filter(({ prazo }) => diferencaEmDias(agora, prazo) === 0).length,
    proximos7Dias: noPrazo.filter(({ prazo }) => {
      const dias = diferencaEmDias(agora, prazo);
      return dias >= 1 && dias <= 7;
    }).length,
    proximosPrazos: [...comPrazo]
      .sort((a, b) => a.prazo.getTime() - b.prazo.getTime())
      .slice(0, 5)
      .map(({ tarefa }) => tarefa),

    concluidasHoje: contar(0),
    ultimos7Dias,
    concluidasSemana: somar(-6, 0),
    concluidasSemanaAnterior: somar(-13, -7),
    sequenciaDias,
  };
}

const plural = (n: number, singular: string, pluralTexto: string) => `${n} ${n === 1 ? singular : pluralTexto}`;

/** Frase de incentivo do dashboard, escolhida pela situação mais importante no momento. */
export function gerarInsight(e: Estatisticas): string {
  if (e.total === 0) return 'Nenhuma tarefa cadastrada ainda. Crie a primeira no botão + da tela principal.';
  if (e.atrasadas > 0) {
    return `Você tem ${plural(e.atrasadas, 'tarefa atrasada', 'tarefas atrasadas')}. Resolver ${e.atrasadas === 1 ? 'ela' : 'elas'} primeiro tira um peso do seu dia.`;
  }
  if (e.venceHoje > 0) {
    return `${plural(e.venceHoje, 'tarefa vence', 'tarefas vencem')} hoje. Foque ${e.venceHoje === 1 ? 'nela' : 'nelas'} para fechar o dia em dia!`;
  }
  if (e.pendentes === 0) return 'Incrível! Todas as tarefas foram concluídas.';
  if (e.sequenciaDias >= 3) return `Você concluiu tarefas ${e.sequenciaDias} dias seguidos. Continue assim!`;
  if (e.concluidasSemanaAnterior > 0 && e.concluidasSemana > e.concluidasSemanaAnterior) {
    const diferenca = e.concluidasSemana - e.concluidasSemanaAnterior;
    return `Você concluiu ${plural(diferenca, 'tarefa', 'tarefas')} a mais do que na semana anterior. Ótimo ritmo!`;
  }
  if (e.taxaConclusao >= 70) return 'Excelente ritmo! A maioria das suas tarefas já foi concluída.';
  return 'Bom progresso! Continue pelas pendentes, começando pelas de prioridade alta.';
}
