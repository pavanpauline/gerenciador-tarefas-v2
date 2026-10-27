import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { DadosTarefa, Tarefa, gerarId } from '../models/tarefa';
import { carregarTarefas, salvarTarefas } from './armazenamento';
import { ARMAZENAMENTO } from './armazenamento.token';
import { calcularEstatisticas } from './estatisticas';
import { ImpactStyle, vibrar } from './vibracao';

/** Uma tarefa excluída e a posição em que estava, para poder desfazer. */
export interface TarefaExcluida {
  tarefa: Tarefa;
  posicao: number;
}

/**
 * Fonte única dos dados do app. As telas leem os signals `tarefas`, `estatisticas`
 * e `agora`; só este serviço altera a lista, e toda alteração é salva na hora.
 */
@Injectable({ providedIn: 'root' })
export class TarefasService {
  /** Relógio do app, atualizado a cada minuto: mantém "Hoje" e "Atrasada" corretos com o app aberto. */
  readonly agora = signal(new Date());

  private readonly armazenamento = inject(ARMAZENAMENTO);
  private readonly lista = signal<Tarefa[]>(carregarTarefas(this.armazenamento, new Date()));
  readonly tarefas = this.lista.asReadonly();

  /** Recalculado só quando a lista ou o relógio mudam. */
  readonly estatisticas = computed(() => calcularEstatisticas(this.lista(), this.agora()));

  constructor() {
    this.salvar();
    const relogio = setInterval(() => this.agora.set(new Date()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(relogio));
  }

  buscarTarefa(id: string): Tarefa | undefined {
    return this.lista().find((t) => t.id === id);
  }

  async adicionarTarefa(dados: DadosTarefa): Promise<Tarefa> {
    const nova: Tarefa = {
      ...dados,
      id: gerarId(),
      concluida: false,
      criadaEm: new Date().toISOString(),
    };
    this.alterarLista((lista) => [nova, ...lista]);
    await vibrar(ImpactStyle.Medium);
    return nova;
  }

  atualizarTarefa(id: string, alteracoes: Partial<DadosTarefa>): void {
    this.alterarLista((lista) => lista.map((t) => (t.id === id ? { ...t, ...alteracoes } : t)));
  }

  async definirConclusao(id: string, concluida: boolean): Promise<void> {
    const tarefa = this.buscarTarefa(id);
    if (!tarefa || tarefa.concluida === concluida) return;

    const concluidaEm = concluida ? new Date().toISOString() : undefined;
    this.alterarLista((lista) => lista.map((t) => (t.id === id ? { ...t, concluida, concluidaEm } : t)));
    if (concluida) await vibrar(ImpactStyle.Medium);
  }

  async alternarConclusao(id: string): Promise<void> {
    const tarefa = this.buscarTarefa(id);
    if (tarefa) await this.definirConclusao(id, !tarefa.concluida);
  }

  /** Remove a tarefa e devolve o que é preciso para desfazer a exclusão. */
  async excluirTarefa(id: string): Promise<TarefaExcluida | undefined> {
    const posicao = this.lista().findIndex((t) => t.id === id);
    if (posicao === -1) return undefined;

    const tarefa = this.lista()[posicao];
    this.alterarLista((lista) => lista.filter((t) => t.id !== id));
    await vibrar(ImpactStyle.Light);
    return { tarefa, posicao };
  }

  /** Desfaz uma exclusão, devolvendo a tarefa à posição em que estava. */
  restaurarTarefa({ tarefa, posicao }: TarefaExcluida): void {
    if (this.buscarTarefa(tarefa.id)) return;
    this.alterarLista((lista) => {
      const copia = [...lista];
      copia.splice(Math.min(posicao, copia.length), 0, tarefa);
      return copia;
    });
  }

  private alterarLista(alteracao: (lista: Tarefa[]) => Tarefa[]): void {
    this.lista.update(alteracao);
    this.salvar();
  }

  private salvar(): void {
    salvarTarefas(this.armazenamento, this.lista());
  }
}
