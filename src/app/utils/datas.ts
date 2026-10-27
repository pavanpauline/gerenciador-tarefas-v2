/**
 * Funções de data do app. Tudo é calculado no fuso horário do aparelho:
 * nada de toISOString() para datas que o usuário vê, porque ele usa UTC
 * e, no Brasil (UTC-3), depois das 21h já seria o dia seguinte.
 */

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const PADRAO_PRAZO = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Data local no formato 'AAAA-MM-DD' (o mesmo do <input type="date">). */
export function paraDataLocal(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** Hora local no formato 'HH:mm' (o mesmo do <input type="time">). */
export function paraHoraLocal(data: Date): string {
  return `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** Junta os campos de data e hora do formulário. Sem data, a tarefa fica sem prazo. */
export function montarPrazo(data: string, hora: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return undefined;
  return /^\d{2}:\d{2}$/.test(hora) ? `${data}T${hora}` : data;
}

/** Separa um prazo nos valores dos campos de data e hora. */
export function separarPrazo(prazo?: string): { data: string; hora: string } {
  if (!prazo || !PADRAO_PRAZO.test(prazo)) return { data: '', hora: '' };
  const [data, hora = ''] = prazo.split('T');
  return { data, hora };
}

/** Converte o prazo em Date. Um prazo sem hora vale até o fim do dia (23:59). */
export function lerPrazo(prazo?: string): Date | null {
  const partes = prazo ? PADRAO_PRAZO.exec(prazo) : null;
  if (!partes) return null;
  const [, ano, mes, dia, hora, minuto] = partes;
  const temHora = hora !== undefined;
  return new Date(+ano, +mes - 1, +dia, temHora ? +hora : 23, temHora ? +minuto : 59);
}

/** Quantos dias de calendário vão de uma data até a outra (ignora as horas). */
export function diferencaEmDias(de: Date, ate: Date): number {
  const inicio = Date.UTC(de.getFullYear(), de.getMonth(), de.getDate());
  const fim = Date.UTC(ate.getFullYear(), ate.getMonth(), ate.getDate());
  return Math.round((fim - inicio) / 86_400_000);
}

export function estaAtrasada(prazo: string | undefined, agora: Date): boolean {
  const limite = lerPrazo(prazo);
  return limite !== null && limite.getTime() < agora.getTime();
}

/** Texto curto do prazo: "Hoje, 14:00", "Amanhã", "Ontem, 18:00", "Sex, 10:00", "12 nov" ou "3 fev 2027". */
export function formatarPrazo(prazo: string | undefined, agora: Date): string {
  const data = lerPrazo(prazo);
  if (!data) return 'Sem prazo';

  const hora = prazo!.includes('T') ? `, ${paraHoraLocal(data)}` : '';
  const dias = diferencaEmDias(agora, data);

  let dia: string;
  if (dias === 0) dia = 'Hoje';
  else if (dias === 1) dia = 'Amanhã';
  else if (dias === -1) dia = 'Ontem';
  else if (dias > 1 && dias < 7) dia = DIAS_CURTOS[data.getDay()];
  else {
    const ano = data.getFullYear() !== agora.getFullYear() ? ` ${data.getFullYear()}` : '';
    dia = `${data.getDate()} ${MESES_CURTOS[data.getMonth()]}${ano}`;
  }
  return dia + hora;
}

/** "Segunda, 26 de outubro" */
export function formatarDataCabecalho(agora: Date): string {
  return `${DIAS_LONGOS[agora.getDay()]}, ${agora.getDate()} de ${MESES_LONGOS[agora.getMonth()]}`;
}

/** "26 de outubro de 2026" a partir de um ISO 8601. */
export function formatarDataCompleta(iso: string | undefined): string {
  const data = iso ? new Date(iso) : null;
  if (!data || Number.isNaN(data.getTime())) return '—';
  return `${data.getDate()} de ${MESES_LONGOS[data.getMonth()]} de ${data.getFullYear()}`;
}

/** Prazo sugerido para uma tarefa nova: a próxima hora cheia; a partir das 23h, amanhã às 09:00. */
export function sugerirPrazo(agora: Date): { data: string; hora: string } {
  const sugestao = new Date(agora);
  if (agora.getHours() >= 23) {
    sugestao.setDate(sugestao.getDate() + 1);
    sugestao.setHours(9, 0, 0, 0);
  } else {
    sugestao.setHours(agora.getHours() + 1, 0, 0, 0);
  }
  return { data: paraDataLocal(sugestao), hora: paraHoraLocal(sugestao) };
}
