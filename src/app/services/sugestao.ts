import { PESO_PRIORIDADE, Tarefa } from '../models/tarefa';
import { diferencaEmDias, formatarPrazo, lerPrazo, paraHoraLocal } from '../utils/datas';

export interface Sugestao {
  tarefa: Tarefa;
  /** Por que esta tarefa foi escolhida, para mostrar ao usuário. */
  motivo: string;
}

/** 0 = atrasada, 1 = vence hoje, 2 = o resto. */
function urgencia(tarefa: Tarefa, agora: Date): number {
  const prazo = lerPrazo(tarefa.prazo);
  if (!prazo) return 2;
  if (prazo.getTime() < agora.getTime()) return 0;
  return diferencaEmDias(agora, prazo) === 0 ? 1 : 2;
}

/**
 * Escolhe a próxima tarefa a fazer, entre as pendentes:
 * 1. as atrasadas (a mais antiga primeiro);
 * 2. as que vencem hoje;
 * 3. as demais, pela prioridade e depois pelo prazo mais próximo.
 */
export function escolherSugestao(tarefas: readonly Tarefa[], agora: Date): Sugestao | null {
  const pendentes = tarefas.filter((t) => !t.concluida);
  if (pendentes.length === 0) return null;

  const instante = (t: Tarefa) => lerPrazo(t.prazo)?.getTime() ?? Number.POSITIVE_INFINITY;
  const [tarefa] = [...pendentes].sort((a, b) => {
    const porUrgencia = urgencia(a, agora) - urgencia(b, agora);
    if (porUrgencia !== 0) return porUrgencia;
    if (urgencia(a, agora) === 0) return instante(a) - instante(b);
    return PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade] || instante(a) - instante(b);
  });

  return { tarefa, motivo: explicarMotivo(tarefa, agora) };
}

function explicarMotivo(tarefa: Tarefa, agora: Date): string {
  const nivel = urgencia(tarefa, agora);
  if (nivel === 0) return `Atrasada · ${formatarPrazo(tarefa.prazo, agora)}`;
  if (nivel === 1) {
    return tarefa.prazo!.includes('T') ? `Vence hoje às ${paraHoraLocal(lerPrazo(tarefa.prazo)!)}` : 'Vence hoje';
  }
  const prazo = tarefa.prazo ? formatarPrazo(tarefa.prazo, agora) : 'sem prazo';
  return `Prioridade ${tarefa.prioridade.toLowerCase()} · ${prazo}`;
}
