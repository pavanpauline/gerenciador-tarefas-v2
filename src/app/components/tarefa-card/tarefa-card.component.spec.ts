import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tarefa } from '../../models/tarefa';
import { criarTarefa, prazoEm } from '../../testes/ajudantes';
import { TarefaCardComponent } from './tarefa-card.component';

describe('TarefaCardComponent', () => {
  let fixture: ComponentFixture<TarefaCardComponent>;
  let card: TarefaCardComponent;

  /** Cria o card com a tarefa e devolve o HTML renderizado. */
  function montar(tarefa: Tarefa): HTMLElement {
    fixture = TestBed.createComponent(TarefaCardComponent);
    card = fixture.componentInstance;
    fixture.componentRef.setInput('tarefa', tarefa);
    fixture.componentRef.setInput('agora', new Date());
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('mostra título, categoria, prazo e prioridade', () => {
    const el = montar(
      criarTarefa({ id: '1', titulo: 'Estudar Angular', categoria: 'Estudo', prioridade: 'Alta', prazo: prazoEm(1, '09:00') }),
    );
    expect(el.querySelector('.task-title')?.textContent).toContain('Estudar Angular');
    expect(el.querySelector('.task-meta')?.textContent).toContain('Estudo');
    expect(el.querySelector('.deadline-wrap')?.textContent).toContain('Amanhã, 09:00');
    expect(el.querySelector('ion-badge')?.classList.contains('priority-alta')).toBe(true);
  });

  it('destaca o prazo vencido e avisa os leitores de tela', () => {
    const el = montar(criarTarefa({ id: '1', prazo: prazoEm(-1, '18:00') }));
    expect(el.querySelector('.deadline-wrap')?.classList.contains('is-late')).toBe(true);
    expect(el.querySelector('.deadline-wrap .sr-only')?.textContent).toContain('atrasada');
  });

  it('mostra a tarefa concluída sem destaque de atraso', () => {
    const el = montar(criarTarefa({ id: '1', concluida: true, prazo: prazoEm(-3) }));
    expect(el.querySelector('.task-card')?.classList.contains('is-done')).toBe(true);
    expect(el.querySelector('.deadline-wrap')).toBeNull();
    expect(el.querySelector('ion-badge')?.textContent).toContain('Concluída');
  });

  it('avisa a tela quando o card é tocado', () => {
    const tarefa = criarTarefa({ id: '1' });
    const el = montar(tarefa);
    const abertas: Tarefa[] = [];
    card.abrir.subscribe((t) => abertas.push(t));

    (el.querySelector('.task-main') as HTMLButtonElement).click();

    expect(abertas).toEqual([tarefa]);
  });

  it('avisa a troca de status pelo checkbox só quando o valor muda', () => {
    const tarefa = criarTarefa({ id: '1', concluida: false });
    montar(tarefa);
    const alternadas: Tarefa[] = [];
    card.alternarConclusao.subscribe((t) => alternadas.push(t));

    card.aoMarcar(new CustomEvent('ionChange', { detail: { checked: false } }));
    card.aoMarcar(new CustomEvent('ionChange', { detail: { checked: true } }));

    expect(alternadas).toEqual([tarefa]);
  });
});
