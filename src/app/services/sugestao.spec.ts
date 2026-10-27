import { Tarefa } from '../models/tarefa';
import { escolherSugestao } from './sugestao';

// Segunda-feira, 26/10/2026, 10:30 no horário local
const AGORA = new Date(2026, 9, 26, 10, 30);

const tarefa = (dados: Partial<Tarefa> & Pick<Tarefa, 'id'>): Tarefa => ({
  titulo: dados.id,
  categoria: 'Trabalho',
  prioridade: 'Média',
  concluida: false,
  criadaEm: '2026-10-20T12:00:00.000Z',
  ...dados,
});

describe('escolherSugestao', () => {
  it('não sugere nada quando não há pendentes', () => {
    expect(escolherSugestao([], AGORA)).toBeNull();
    expect(escolherSugestao([tarefa({ id: 'feita', concluida: true })], AGORA)).toBeNull();
  });

  it('prioriza as atrasadas, mesmo com prioridade baixa', () => {
    const sugestao = escolherSugestao(
      [
        tarefa({ id: 'alta-amanha', prioridade: 'Alta', prazo: '2026-10-27' }),
        tarefa({ id: 'baixa-atrasada', prioridade: 'Baixa', prazo: '2026-10-25T20:00' }),
      ],
      AGORA,
    );
    expect(sugestao?.tarefa.id).toBe('baixa-atrasada');
    expect(sugestao?.motivo).toBe('Atrasada · Ontem, 20:00');
  });

  it('depois das atrasadas, sugere a que vence hoje', () => {
    const sugestao = escolherSugestao(
      [
        tarefa({ id: 'alta-sexta', prioridade: 'Alta', prazo: '2026-10-30' }),
        tarefa({ id: 'baixa-hoje', prioridade: 'Baixa', prazo: '2026-10-26T18:00' }),
      ],
      AGORA,
    );
    expect(sugestao?.tarefa.id).toBe('baixa-hoje');
    expect(sugestao?.motivo).toBe('Vence hoje às 18:00');
  });

  it('sem urgência, segue a prioridade e o prazo mais próximo', () => {
    const sugestao = escolherSugestao(
      [
        tarefa({ id: 'media-amanha', prioridade: 'Média', prazo: '2026-10-27' }),
        tarefa({ id: 'alta-sem-prazo', prioridade: 'Alta' }),
        tarefa({ id: 'alta-sexta', prioridade: 'Alta', prazo: '2026-10-30T09:00' }),
      ],
      AGORA,
    );
    expect(sugestao?.tarefa.id).toBe('alta-sexta');
    expect(sugestao?.motivo).toBe('Prioridade alta · Sex, 09:00');
  });

  it('explica quando a tarefa não tem prazo', () => {
    expect(escolherSugestao([tarefa({ id: 'livre', prioridade: 'Baixa' })], AGORA)?.motivo).toBe('Prioridade baixa · sem prazo');
  });
});
