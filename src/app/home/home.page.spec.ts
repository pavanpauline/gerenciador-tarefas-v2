import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { TarefasService } from '../services/tarefas.service';
import { configurarComTarefas, criarTarefa, momentoEm, prazoEm } from '../testes/ajudantes';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let home: HomePage;
  /** Substitui o aviso de "Desfazer" do Ionic por um falso, para conferir o que foi pedido. */
  let toast: { create: ReturnType<typeof vi.fn> };

  const tarefas = [
    criarTarefa({ id: 'atrasada', titulo: 'Pagar conta', prioridade: 'Média', prazo: prazoEm(-1, '18:00') }),
    criarTarefa({ id: 'relatorio', titulo: 'Entregar relatório', prioridade: 'Alta', prazo: prazoEm(3) }),
    criarTarefa({ id: 'feita', titulo: 'Ler artigo', concluida: true, concluidaEm: momentoEm(0) }),
  ];

  function montar(lista = tarefas) {
    const aviso = { present: vi.fn().mockResolvedValue(undefined), dismiss: vi.fn().mockResolvedValue(true) };
    toast = { create: vi.fn().mockResolvedValue(aviso) };
    configurarComTarefas(lista, [{ provide: ToastController, useValue: toast }]);
    fixture = TestBed.createComponent(HomePage);
    home = fixture.componentInstance;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const titulosPendentes = (el: HTMLElement) =>
    [...el.querySelectorAll('.tasks-section .task-title')].map((t) => t.textContent?.trim());

  it('mostra o progresso e as pendentes em ordem de prioridade', () => {
    const el = montar();
    expect(el.querySelector('.progress-count')?.textContent).toContain('1 de 3 concluídas');
    expect(el.querySelector('.progress-percent')?.textContent).toContain('33%');
    expect(titulosPendentes(el)).toEqual(['Entregar relatório', 'Pagar conta']);
  });

  it('sugere primeiro a tarefa atrasada e explica o motivo', () => {
    const el = montar();
    expect(home.sugestao()?.tarefa.id).toBe('atrasada');
    expect(el.querySelector('.suggestion-title')?.textContent).toContain('Pagar conta');
    expect(el.querySelector('.suggestion-reason')?.textContent).toContain('Atrasada');
  });

  it('filtra pela busca sem diferenciar acentos e limpa os filtros', () => {
    const el = montar();
    home.termoBusca.set('relatorio');
    fixture.detectChanges();

    expect(titulosPendentes(el)).toEqual(['Entregar relatório']);
    expect(el.querySelector('.active-filter-banner')?.textContent).toContain('"relatorio"');

    home.limparFiltros();
    fixture.detectChanges();
    expect(titulosPendentes(el).length).toBe(2);
    expect(el.querySelector('.active-filter-banner')).toBeNull();
  });

  it('exclui na hora, oferece "Desfazer" e restaura a tarefa', async () => {
    montar();
    const service = TestBed.inject(TarefasService);

    await home.excluir(tarefas[1]);
    expect(service.buscarTarefa('relatorio')).toBeUndefined();
    expect(toast.create).toHaveBeenCalledTimes(1);

    const opcoes = toast.create.mock.calls[0][0];
    expect(opcoes.message).toContain('Entregar relatório');
    opcoes.buttons[0].handler();
    expect(service.buscarTarefa('relatorio')?.titulo).toBe('Entregar relatório');
  });

  it('marca e desmarca a conclusão', () => {
    montar();
    home.alternarConclusao(tarefas[0]);
    expect(home.totalConcluidas()).toBe(2);
    expect(home.pendentes().map((t) => t.id)).toEqual(['relatorio']);
  });

  it('abre os detalhes de uma tarefa tocada no dashboard', () => {
    montar();
    home.estatisticasAberto.set(true);

    home.abrirDaEstatistica(tarefas[0]);

    expect(home.estatisticasAberto()).toBe(false);
    expect(home.detalhesAberto()).toBe(true);
    expect(home.tarefaSelecionada()?.id).toBe('atrasada');
  });

  it('sem tarefas, convida a criar a primeira', () => {
    const el = montar([]);
    expect(el.querySelector('.suggestion-title')?.textContent).toContain('Crie sua primeira tarefa');
    expect(el.querySelector('.empty-pending-state')?.textContent).toContain('Toque no +');

    home.abrirSugestao();
    expect(home.novaTarefaAberta()).toBe(true);
  });
});
