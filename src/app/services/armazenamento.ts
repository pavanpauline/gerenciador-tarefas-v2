import { Tarefa, ehCategoria, ehPrioridade, gerarId } from '../models/tarefa';
import { MESES_CURTOS, lerPrazo, montarPrazo, paraDataLocal } from '../utils/datas';

/**
 * Chave nova, com os dados num "envelope" versionado: { versao, tarefas }.
 * Ela é diferente da chave da primeira versão do app de propósito: as duas versões
 * rodam em localhost e dividem o mesmo localStorage, então uma não estraga os dados da outra.
 */
export const CHAVE_TAREFAS = 'tarefas_v2';
export const CHAVE_ANTIGA = 'tarefas_salvas';
const VERSAO_DADOS = 2;

/** O pedaço do localStorage que o app usa. */
export type Armazenamento = Pick<Storage, 'getItem' | 'setItem'>;

/** Armazenamento que vive só na memória: reserva quando não há localStorage e base dos testes. */
export function criarArmazenamentoEmMemoria(inicial: Record<string, string> = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    dados,
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => {
      dados.set(chave, String(valor));
    },
  };
}

/**
 * Lê as tarefas salvas. Ordem de tentativa:
 * 1. dados no formato novo;
 * 2. dados da versão anterior do app, convertidos;
 * 3. lista vazia: o app começa sem nenhuma tarefa, só com o que o usuário criar.
 */
export function carregarTarefas(armazenamento: Armazenamento, agora: Date): Tarefa[] {
  const bruto = armazenamento.getItem(CHAVE_TAREFAS);
  if (bruto !== null) {
    const dados = lerJson(bruto) as { tarefas?: unknown } | null;
    if (dados && Array.isArray(dados.tarefas)) return normalizarLista(dados.tarefas, agora);
    // Dado corrompido: guarda uma cópia em vez de perder tudo sem aviso.
    armazenamento.setItem(`${CHAVE_TAREFAS}_corrompido`, bruto);
  }

  const antigo = lerJson(armazenamento.getItem(CHAVE_ANTIGA));
  if (Array.isArray(antigo)) return normalizarLista(antigo, agora);

  return [];
}

export function salvarTarefas(armazenamento: Armazenamento, tarefas: readonly Tarefa[]): void {
  try {
    armazenamento.setItem(CHAVE_TAREFAS, JSON.stringify({ versao: VERSAO_DADOS, tarefas }));
  } catch {
    // Armazenamento cheio ou bloqueado: o app continua funcionando em memória.
  }
}

function lerJson(texto: string | null): unknown {
  if (texto === null) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

function normalizarLista(lista: unknown[], agora: Date): Tarefa[] {
  return lista
    .map((item) => normalizarTarefa(item, agora))
    .filter((tarefa): tarefa is Tarefa => tarefa !== null);
}

/** Valida um item salvo e completa o que faltar; descarta itens sem título. */
export function normalizarTarefa(item: unknown, agora: Date): Tarefa | null {
  if (!item || typeof item !== 'object') return null;
  const dado = item as Record<string, unknown>;

  const titulo = typeof dado['titulo'] === 'string' ? dado['titulo'].trim() : '';
  if (!titulo) return null;

  let notas = typeof dado['notas'] === 'string' && dado['notas'].trim() ? dado['notas'] : undefined;
  let prazo: string | undefined;
  if (typeof dado['prazo'] === 'string' && dado['prazo'].trim()) {
    prazo = converterPrazoAntigo(dado['prazo'], agora);
    if (!prazo) {
      // Texto que não deu para entender: vai para as notas para não se perder.
      notas = [notas, `Prazo anterior: ${dado['prazo']}`].filter(Boolean).join('\n');
    }
  }

  const concluida = dado['concluida'] === true;
  return {
    id: typeof dado['id'] === 'string' && dado['id'] ? dado['id'] : gerarId(),
    titulo,
    categoria: ehCategoria(dado['categoria']) ? dado['categoria'] : 'Pessoal',
    prioridade: ehPrioridade(dado['prioridade']) ? dado['prioridade'] : 'Média',
    concluida,
    prazo,
    notas,
    criadaEm: typeof dado['criadaEm'] === 'string' ? dado['criadaEm'] : converterDataAntiga(dado['dataCriacao'], agora),
    concluidaEm: concluida && typeof dado['concluidaEm'] === 'string' ? dado['concluidaEm'] : undefined,
  };
}

const DIA_DA_SEMANA: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, 'sáb': 6 };

/**
 * A primeira versão do app guardava o prazo como texto ("Hoje, 14:00", "Amanhã", "Sex, 10:00").
 * Converte esse texto numa data real, tomando o dia de hoje como referência.
 */
export function converterPrazoAntigo(texto: string, agora: Date): string | undefined {
  if (lerPrazo(texto)) return texto; // já está no formato novo

  const valor = texto.trim().toLowerCase();
  const horario = /(\d{1,2}):(\d{2})/.exec(valor);
  const hora = horario ? `${horario[1].padStart(2, '0')}:${horario[2]}` : '';

  const dia = new Date(agora);
  if (valor.startsWith('hoje')) {
    // mesmo dia
  } else if (valor.startsWith('amanhã') || valor.startsWith('amanha')) {
    dia.setDate(dia.getDate() + 1);
  } else if (valor.startsWith('ontem')) {
    dia.setDate(dia.getDate() - 1);
  } else {
    const alvo = DIA_DA_SEMANA[valor.slice(0, 3)];
    if (alvo === undefined) return undefined;
    // Próxima ocorrência daquele dia da semana (1 a 7 dias à frente).
    dia.setDate(dia.getDate() + ((alvo - dia.getDay() + 7) % 7 || 7));
  }
  return montarPrazo(paraDataLocal(dia), hora);
}

/** Converte "20 de out. de 2026" (formato da primeira versão) em ISO 8601. */
export function converterDataAntiga(texto: unknown, agora: Date): string {
  const partes = typeof texto === 'string' ? /(\d{1,2}) de ([a-zç]{3})\S* de (\d{4})/i.exec(texto) : null;
  const mes = partes ? MESES_CURTOS.indexOf(partes[2].toLowerCase()) : -1;
  if (!partes || mes === -1) return agora.toISOString();
  return new Date(+partes[3], mes, +partes[1], 12).toISOString();
}
