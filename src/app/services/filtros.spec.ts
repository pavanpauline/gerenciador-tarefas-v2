import { Tarefa } from '../models/tarefa';
import { Filtros, filtrarTarefas, normalizarTexto, ordenarConcluidas, ordenarPendentes, temFiltroAtivo } from './filtros';

const tarefa = (dados: Partial<Tarefa> & Pick<Tarefa, 'id'>): Tarefa => ({
  titulo: dados.id,
  categoria: 'Trabalho',
  prioridade: 'Média',
  concluida: false,
  criadaEm: '2026-10-20T12:00:00.000Z',
  ...dados,
});

const SEM_FILTRO: Filtros = { termo: '', status: 'Todas', prioridade: 'Todas', categoria: 'Todas' };

const LISTA: Tarefa[] = [
  tarefa({ id: 'relatorio', titulo: 'Enviar relatório', prioridade: 'Alta' }),
  tarefa({ id: 'estatistica', titulo: 'Ler Estatística', categoria: 'Estudo', notas: 'capítulo 4' }),
  tarefa({ id: 'mercado', titulo: 'Mercado', categoria: 'Pessoal', prioridade: 'Baixa', concluida: true }),
];

const ids = (lista: Tarefa[]) => lista.map((t) => t.id);

describe('filtros', () => {
  it('ignora acentos e maiúsculas na busca', () => {
    expect(normalizarTexto('  Relatório ')).toBe('relatorio');
    expect(ids(filtrarTarefas(LISTA, { ...SEM_FILTRO, termo: 'RELATORIO' }))).toEqual(['relatorio']);
    expect(ids(filtrarTarefas(LISTA, { ...SEM_FILTRO, termo: 'estatistica' }))).toEqual(['estatistica']);
  });

  it('busca também nas notas, na categoria e na prioridade', () => {
    expect(ids(filtrarTarefas(LISTA, { ...SEM_FILTRO, termo: 'capitulo' }))).toEqual(['estatistica']);
    expect(ids(filtrarTarefas(LISTA, { ...SEM_FILTRO, termo: 'pessoal' }))).toEqual(['mercado']);
    expect(ids(filtrarTarefas(LISTA, { ...SEM_FILTRO, termo: 'media' }))).toEqual(['estatistica']);
  });

  it('combina status, prioridade e categoria', () => {
    expect(ids(filtrarTarefas(LISTA, { ...SEM_FILTRO, status: 'Pendentes' }))).toEqual(['relatorio', 'estatistica']);
    expect(ids(filtrarTarefas(LISTA, { ...SEM_FILTRO, status: 'Concluídas' }))).toEqual(['mercado']);
    expect(ids(filtrarTarefas(LISTA, { ...SEM_FILTRO, status: 'Pendentes', categoria: 'Estudo' }))).toEqual(['estatistica']);
    expect(ids(filtrarTarefas(LISTA, { ...SEM_FILTRO, prioridade: 'Baixa', status: 'Pendentes' }))).toEqual([]);
  });

  it('acha as categorias novas pela busca sem acento e pelo filtro', () => {
    const lista = [
      ...LISTA,
      tarefa({ id: 'consulta', titulo: 'Consulta no dentista', categoria: 'Saúde' }),
      tarefa({ id: 'boleto', titulo: 'Pagar boleto', categoria: 'Finanças' }),
      tarefa({ id: 'louca', titulo: 'Lavar a louça', categoria: 'Casa' }),
    ];
    expect(ids(filtrarTarefas(lista, { ...SEM_FILTRO, termo: 'saude' }))).toEqual(['consulta']);
    expect(ids(filtrarTarefas(lista, { ...SEM_FILTRO, termo: 'FINANCAS' }))).toEqual(['boleto']);
    expect(ids(filtrarTarefas(lista, { ...SEM_FILTRO, categoria: 'Casa' }))).toEqual(['louca']);
  });

  it('sabe quando há filtro ativo', () => {
    expect(temFiltroAtivo(SEM_FILTRO)).toBe(false);
    expect(temFiltroAtivo({ ...SEM_FILTRO, termo: '   ' })).toBe(false);
    expect(temFiltroAtivo({ ...SEM_FILTRO, categoria: 'Estudo' })).toBe(true);
  });

  it('ordena as pendentes por prioridade e depois pelo prazo mais próximo', () => {
    const pendentes = [
      tarefa({ id: 'baixa', prioridade: 'Baixa', prazo: '2026-10-26T08:00' }),
      tarefa({ id: 'alta-sem-prazo', prioridade: 'Alta' }),
      tarefa({ id: 'alta-sexta', prioridade: 'Alta', prazo: '2026-10-30' }),
      tarefa({ id: 'alta-hoje', prioridade: 'Alta', prazo: '2026-10-26T18:00' }),
    ];
    expect(ids(ordenarPendentes(pendentes))).toEqual(['alta-hoje', 'alta-sexta', 'alta-sem-prazo', 'baixa']);
    expect(pendentes[0].id).toBe('baixa'); // a lista original não é alterada
  });

  it('mostra primeiro as concluídas mais recentes', () => {
    const concluidas = [
      tarefa({ id: 'antiga', concluida: true, concluidaEm: '2026-10-20T10:00:00.000Z' }),
      tarefa({ id: 'recente', concluida: true, concluidaEm: '2026-10-26T10:00:00.000Z' }),
    ];
    expect(ids(ordenarConcluidas(concluidas))).toEqual(['recente', 'antiga']);
  });
});
