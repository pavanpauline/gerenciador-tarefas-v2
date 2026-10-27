import { Tarefa } from '../models/tarefa';
import { calcularEstatisticas, gerarInsight } from './estatisticas';

// Segunda-feira, 26/10/2026, 10:30 no horário local
const AGORA = new Date(2026, 9, 26, 10, 30);

/** ISO de um momento local, a partir do dia relativo a AGORA. */
const em = (dias: number, hora = 15) => new Date(2026, 9, 26 + dias, hora, 0).toISOString();

const tarefa = (dados: Partial<Tarefa> & Pick<Tarefa, 'id'>): Tarefa => ({
  titulo: dados.id,
  categoria: 'Trabalho',
  prioridade: 'Média',
  concluida: false,
  criadaEm: em(-20),
  ...dados,
});
const feita = (id: string, dias: number, hora?: number) => tarefa({ id, concluida: true, concluidaEm: em(dias, hora) });

describe('calcularEstatisticas', () => {
  it('resume totais, prioridades e categorias', () => {
    const e = calcularEstatisticas(
      [tarefa({ id: 'a', prioridade: 'Alta' }), feita('b', 0), tarefa({ id: 'c', categoria: 'Estudo' })],
      AGORA,
    );
    expect(e).toMatchObject({ total: 3, concluidas: 1, pendentes: 2, taxaConclusao: 33 });
    expect(e.porPrioridade.find((p) => p.prioridade === 'Média')).toMatchObject({ total: 2, concluidas: 1, taxaConclusao: 50 });
    expect(e.porCategoria.find((c) => c.categoria === 'Estudo')?.percentualDoTotal).toBe(33);
  });

  it('monta os últimos 7 dias, do mais antigo até hoje', () => {
    const e = calcularEstatisticas([feita('hoje1', 0), feita('hoje2', 0, 9), feita('ontem', -1), feita('antiga', -10)], AGORA);
    expect(e.ultimos7Dias.map((d) => d.rotulo)).toEqual(['Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Seg']);
    expect(e.ultimos7Dias.map((d) => d.concluidas)).toEqual([0, 0, 0, 0, 0, 1, 2]);
    expect(e.ultimos7Dias.at(-1)).toMatchObject({ data: '2026-10-26', ehHoje: true });
    expect(e.concluidasHoje).toBe(2);
    expect(e.concluidasSemana).toBe(3);
    expect(e.concluidasSemanaAnterior).toBe(1);
  });

  it('conta a sequência de dias seguidos com tarefas concluídas', () => {
    expect(calcularEstatisticas([feita('a', 0), feita('b', -1), feita('c', -2), feita('d', -4)], AGORA).sequenciaDias).toBe(3);
    // Hoje ainda sem conclusões: a sequência continua valendo até ontem
    expect(calcularEstatisticas([feita('b', -1), feita('c', -2)], AGORA).sequenciaDias).toBe(2);
    expect(calcularEstatisticas([feita('c', -2)], AGORA).sequenciaDias).toBe(0);
  });

  it('separa atrasadas, as que vencem hoje e as dos próximos 7 dias', () => {
    const e = calcularEstatisticas(
      [
        tarefa({ id: 'atrasada', prazo: '2026-10-25T18:00' }),
        tarefa({ id: 'venceu-hoje-cedo', prazo: '2026-10-26T08:00' }),
        tarefa({ id: 'hoje-tarde', prazo: '2026-10-26T18:00' }),
        tarefa({ id: 'amanha', prazo: '2026-10-27' }),
        tarefa({ id: 'semana-que-vem', prazo: '2026-11-02T09:00' }),
        tarefa({ id: 'longe', prazo: '2026-12-01' }),
        tarefa({ id: 'sem-prazo' }),
        tarefa({ id: 'feita-atrasada', prazo: '2026-10-20', concluida: true, concluidaEm: em(-5) }),
      ],
      AGORA,
    );
    expect(e).toMatchObject({ atrasadas: 2, venceHoje: 1, proximos7Dias: 2 });
    expect(e.proximosPrazos.map((t) => t.id)).toEqual(['atrasada', 'venceu-hoje-cedo', 'hoje-tarde', 'amanha', 'semana-que-vem']);
  });
});

describe('gerarInsight', () => {
  const insight = (tarefas: Tarefa[]) => gerarInsight(calcularEstatisticas(tarefas, AGORA));

  it('orienta quem ainda não tem tarefas', () => {
    expect(insight([])).toContain('Nenhuma tarefa cadastrada');
  });

  it('dá prioridade às atrasadas e às que vencem hoje', () => {
    expect(insight([tarefa({ id: 'a', prazo: '2026-10-25' })])).toBe(
      'Você tem 1 tarefa atrasada. Resolver ela primeiro tira um peso do seu dia.',
    );
    expect(insight([tarefa({ id: 'a', prazo: '2026-10-26T20:00' }), tarefa({ id: 'b', prazo: '2026-10-26' })])).toBe(
      '2 tarefas vencem hoje. Foque nelas para fechar o dia em dia!',
    );
  });

  it('comemora sequências e tudo concluído', () => {
    expect(insight([feita('a', 0), feita('b', -1)])).toBe('Incrível! Todas as tarefas foram concluídas.');
    expect(insight([feita('a', 0), feita('b', -1), feita('c', -2), tarefa({ id: 'p' })])).toBe(
      'Você concluiu tarefas 3 dias seguidos. Continue assim!',
    );
  });

  it('compara com a semana anterior', () => {
    expect(insight([feita('a', 0), feita('b', -3), feita('c', -9), tarefa({ id: 'p1' }), tarefa({ id: 'p2' }), tarefa({ id: 'p3' })])).toBe(
      'Você concluiu 1 tarefa a mais do que na semana anterior. Ótimo ritmo!',
    );
  });
});
