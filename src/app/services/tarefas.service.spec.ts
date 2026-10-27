import { TestBed } from '@angular/core/testing';
import { CHAVE_TAREFAS, criarArmazenamentoEmMemoria } from './armazenamento';
import { ARMAZENAMENTO } from './armazenamento.token';
import { TarefasService } from './tarefas.service';

describe('TarefasService', () => {
  let service: TarefasService;
  let armazenamento: ReturnType<typeof criarArmazenamentoEmMemoria>;

  /** Cada teste começa com um armazenamento próprio e vazio. */
  beforeEach(() => {
    armazenamento = criarArmazenamentoEmMemoria();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: ARMAZENAMENTO, useValue: armazenamento }] });
    service = TestBed.inject(TarefasService);
  });

  const salvas = () => JSON.parse(armazenamento.getItem(CHAVE_TAREFAS)!).tarefas;

  it('começa vazio na primeira vez que o app abre', () => {
    expect(service.tarefas()).toEqual([]);
    expect(salvas()).toEqual([]);
  });

  it('adiciona a tarefa no topo da lista e salva', async () => {
    await service.adicionarTarefa({ titulo: 'Primeira', categoria: 'Estudo', prioridade: 'Baixa' });
    const nova = await service.adicionarTarefa({ titulo: 'Segunda', categoria: 'Trabalho', prioridade: 'Alta' });

    expect(service.tarefas().map((t) => t.titulo)).toEqual(['Segunda', 'Primeira']);
    expect(nova.concluida).toBe(false);
    expect(nova.criadaEm).toBeTruthy();
    expect(salvas().length).toBe(2);
  });

  it('registra quando a tarefa foi concluída e limpa ao desfazer', async () => {
    const { id } = await service.adicionarTarefa({ titulo: 'Estudar', categoria: 'Estudo', prioridade: 'Alta' });

    await service.alternarConclusao(id);
    expect(service.buscarTarefa(id)?.concluida).toBe(true);
    expect(service.buscarTarefa(id)?.concluidaEm).toBeTruthy();

    await service.alternarConclusao(id);
    expect(service.buscarTarefa(id)?.concluida).toBe(false);
    expect(service.buscarTarefa(id)?.concluidaEm).toBeUndefined();
  });

  it('edita apenas os campos informados', async () => {
    const { id } = await service.adicionarTarefa({ titulo: 'Antes', categoria: 'Estudo', prioridade: 'Alta' });
    service.atualizarTarefa(id, { titulo: 'Depois', prazo: '2026-11-01T09:00' });

    expect(service.buscarTarefa(id)).toMatchObject({ titulo: 'Depois', categoria: 'Estudo', prazo: '2026-11-01T09:00' });
    expect(salvas()[0].titulo).toBe('Depois');
  });

  it('exclui e desfaz a exclusão na mesma posição', async () => {
    await service.adicionarTarefa({ titulo: 'C', categoria: 'Pessoal', prioridade: 'Baixa' });
    const meio = await service.adicionarTarefa({ titulo: 'B', categoria: 'Pessoal', prioridade: 'Baixa' });
    await service.adicionarTarefa({ titulo: 'A', categoria: 'Pessoal', prioridade: 'Baixa' });

    const excluida = await service.excluirTarefa(meio.id);
    expect(service.tarefas().map((t) => t.titulo)).toEqual(['A', 'C']);

    service.restaurarTarefa(excluida!);
    expect(service.tarefas().map((t) => t.titulo)).toEqual(['A', 'B', 'C']);
  });

  it('atualiza as estatísticas sozinho quando a lista muda', async () => {
    const { id } = await service.adicionarTarefa({ titulo: 'Uma', categoria: 'Trabalho', prioridade: 'Alta' });
    await service.adicionarTarefa({ titulo: 'Outra', categoria: 'Estudo', prioridade: 'Média' });
    await service.definirConclusao(id, true);

    const stats = service.estatisticas();
    expect(stats).toMatchObject({ total: 2, concluidas: 1, pendentes: 1, taxaConclusao: 50 });
    expect(stats.porPrioridade.find((p) => p.prioridade === 'Alta')?.taxaConclusao).toBe(100);
    expect(stats.porCategoria.find((c) => c.categoria === 'Estudo')?.pendentes).toBe(1);
  });
});
