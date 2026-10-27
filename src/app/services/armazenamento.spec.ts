import {
  CHAVE_ANTIGA,
  CHAVE_TAREFAS,
  carregarTarefas,
  converterDataAntiga,
  converterPrazoAntigo,
  criarArmazenamentoEmMemoria as criarArmazenamento,
} from './armazenamento';

// Segunda-feira, 26/10/2026, 10:30 no horário local
const AGORA = new Date(2026, 9, 26, 10, 30);

describe('armazenamento', () => {
  it('começa sem nenhuma tarefa quando não há nada salvo', () => {
    expect(carregarTarefas(criarArmazenamento(), AGORA)).toEqual([]);
  });

  it('lê as tarefas salvas no formato novo', () => {
    const salva = { id: 'a', titulo: 'Estudar', categoria: 'Estudo', prioridade: 'Alta', concluida: false, criadaEm: AGORA.toISOString() };
    const armazenamento = criarArmazenamento({ [CHAVE_TAREFAS]: JSON.stringify({ versao: 2, tarefas: [salva] }) });
    expect(carregarTarefas(armazenamento, AGORA)).toEqual([salva]);
  });

  it('mantém as categorias novas (Saúde, Casa e Finanças)', () => {
    const salvas = ['Saúde', 'Casa', 'Finanças'].map((categoria, i) => ({
      id: `n${i}`,
      titulo: categoria,
      categoria,
      prioridade: 'Baixa',
      concluida: false,
      criadaEm: AGORA.toISOString(),
    }));
    const armazenamento = criarArmazenamento({ [CHAVE_TAREFAS]: JSON.stringify({ versao: 2, tarefas: salvas }) });
    expect(carregarTarefas(armazenamento, AGORA).map((t) => t.categoria)).toEqual(['Saúde', 'Casa', 'Finanças']);
  });

  it('guarda uma cópia dos dados corrompidos em vez de perdê-los', () => {
    const armazenamento = criarArmazenamento({ [CHAVE_TAREFAS]: '{quebrado' });
    expect(carregarTarefas(armazenamento, AGORA)).toEqual([]);
    expect(armazenamento.dados.get(`${CHAVE_TAREFAS}_corrompido`)).toBe('{quebrado');
  });

  it('converte os dados da primeira versão do app', () => {
    const antigas = [
      {
        id: '1',
        titulo: 'Revisar slides',
        categoria: 'Estudo',
        prioridade: 'Alta',
        concluida: false,
        prazo: 'Amanhã, 14:00',
        dataCriacao: '20 de out. de 2026',
      },
      { id: '2', titulo: 'Sem prazo legível', categoria: 'Outra', prioridade: 'Urgente', concluida: true, prazo: 'Logo' },
      { id: '3', titulo: '   ' },
    ];
    const tarefas = carregarTarefas(criarArmazenamento({ [CHAVE_ANTIGA]: JSON.stringify(antigas) }), AGORA);

    expect(tarefas.length).toBe(2);
    expect(tarefas[0].prazo).toBe('2026-10-27T14:00');
    expect(tarefas[0].criadaEm.startsWith('2026-10-20')).toBe(true);
    expect(tarefas[1].categoria).toBe('Pessoal');
    expect(tarefas[1].prioridade).toBe('Média');
    expect(tarefas[1].prazo).toBeUndefined();
    expect(tarefas[1].notas).toBe('Prazo anterior: Logo');
  });

  it('entende os textos de prazo da primeira versão', () => {
    expect(converterPrazoAntigo('Hoje, 14:00', AGORA)).toBe('2026-10-26T14:00');
    expect(converterPrazoAntigo('Amanhã', AGORA)).toBe('2026-10-27');
    expect(converterPrazoAntigo('Ontem', AGORA)).toBe('2026-10-25');
    expect(converterPrazoAntigo('Sex, 10:00', AGORA)).toBe('2026-10-30T10:00');
    expect(converterPrazoAntigo('Segunda', AGORA)).toBe('2026-11-02');
    expect(converterPrazoAntigo('2026-12-01T08:00', AGORA)).toBe('2026-12-01T08:00');
    expect(converterPrazoAntigo('Logo', AGORA)).toBeUndefined();
  });

  it('entende a data de criação da primeira versão', () => {
    expect(converterDataAntiga('3 de nov. de 2026', AGORA).startsWith('2026-11-03')).toBe(true);
    expect(converterDataAntiga(undefined, AGORA)).toBe(AGORA.toISOString());
  });
});
