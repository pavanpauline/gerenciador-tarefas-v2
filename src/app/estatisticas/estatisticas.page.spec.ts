import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Tarefa } from '../models/tarefa';
import { configurarComTarefas, criarTarefa, momentoEm, prazoEm } from '../testes/ajudantes';
import { EstatisticasPage } from './estatisticas.page';

describe('EstatisticasPage', () => {
  const tarefas = [
    criarTarefa({ id: 'atrasada', titulo: 'Pagar conta', prazo: prazoEm(-1, '18:00') }),
    criarTarefa({ id: 'hoje', titulo: 'Entregar trabalho', prioridade: 'Alta', prazo: prazoEm(0) }),
    criarTarefa({ id: 'feita', titulo: 'Ler artigo', concluida: true, concluidaEm: momentoEm(0) }),
  ];

  /** Cria o dashboard dentro do modal (isModal = true) ou como página. */
  function montar(isModal: boolean) {
    configurarComTarefas(tarefas, [provideRouter([])]);
    const fixture = TestBed.createComponent(EstatisticasPage);
    fixture.componentRef.setInput('isModal', isModal);
    fixture.detectChanges();
    return { pagina: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  const textos = (el: HTMLElement, seletor: string) =>
    [...el.querySelectorAll(seletor)].map((e) => e.textContent?.replace(/\s+/g, ' ').trim());

  it('mostra a taxa de conclusão e a frase de incentivo', () => {
    const { el } = montar(true);
    expect(el.querySelector('.highlight-percentage')?.textContent).toContain('33%');
    expect(el.querySelector('.insight-text')?.textContent).toContain('1 tarefa atrasada');
  });

  it('mostra os números dos prazos e a lista dos próximos', () => {
    const { el } = montar(true);
    // Número e rótulo lidos separados: o Angular remove os espaços entre as tags
    const blocos = [...el.querySelectorAll('.deadline-tile')].map(
      (bloco) => `${bloco.querySelector('.tile-number')?.textContent?.trim()} ${bloco.querySelector('.tile-label')?.textContent?.trim()}`,
    );
    expect(blocos).toEqual(['1 Atrasada', '1 Vence hoje', '0 Próximos 7 dias']);
    expect(textos(el, '.upcoming-name')).toEqual(['Pagar conta', 'Entregar trabalho']);
  });

  it('descreve o gráfico dos últimos 7 dias para leitores de tela', () => {
    const { el } = montar(true);
    const descricao = el.querySelector('.activity-chart')?.getAttribute('aria-label');
    expect(descricao).toContain('últimos 7 dias');
    expect(descricao).toContain('hoje 1');
    expect(el.querySelectorAll('.chart-col').length).toBe(7);
  });

  it('dentro do modal tem o botão de fechar', () => {
    const { pagina, el } = montar(true);
    let fechou = false;
    pagina.fechar.subscribe(() => (fechou = true));

    (el.querySelector('button.circle-close-btn') as HTMLButtonElement).click();

    expect(fechou).toBe(true);
  });

  it('como página tem o link de voltar para as tarefas', () => {
    const { el } = montar(false);
    expect(el.querySelector('a.circle-close-btn')?.getAttribute('aria-label')).toBe('Voltar para as tarefas');
  });

  it('avisa qual tarefa da lista de prazos foi tocada', () => {
    const { pagina, el } = montar(true);
    const tocadas: Tarefa[] = [];
    pagina.abrirTarefa.subscribe((t) => tocadas.push(t));

    (el.querySelector('.upcoming-item') as HTMLButtonElement).click();

    expect(tocadas.map((t) => t.id)).toEqual(['atrasada']);
  });
});
