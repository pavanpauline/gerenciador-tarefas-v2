import { ChangeDetectionStrategy, Component, computed, input, output, viewChild } from '@angular/core';
import { IonBadge, IonCard, IonCheckbox, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, arrowUndoOutline, cellularOutline, checkmarkCircleOutline, timeOutline, trashOutline } from 'ionicons/icons';
import { CLASSE_PRIORIDADE, Tarefa, iconeCategoria } from '../../models/tarefa';
import { estaAtrasada, formatarPrazo } from '../../utils/datas';
import { ICONES_CATEGORIA } from '../../utils/icones-categoria';

/**
 * Card de uma tarefa na lista, com os gestos de deslizar:
 * para a direita conclui (ou desfaz), para a esquerda apaga.
 * Não altera dados: só avisa a tela que o usa, pelos outputs.
 */
@Component({
  selector: 'app-tarefa-card',
  templateUrl: './tarefa-card.component.html',
  styleUrls: ['./tarefa-card.component.scss'],
  imports: [IonItemSliding, IonItemOptions, IonItemOption, IonItem, IonCard, IonCheckbox, IonBadge, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarefaCardComponent {
  readonly tarefa = input.required<Tarefa>();
  /** Hora atual, vinda do relógio do serviço: atualiza "Hoje" e "atrasada" sem recarregar. */
  readonly agora = input.required<Date>();

  readonly abrir = output<Tarefa>();
  readonly alternarConclusao = output<Tarefa>();
  readonly excluir = output<Tarefa>();

  readonly atrasada = computed(() => !this.tarefa().concluida && estaAtrasada(this.tarefa().prazo, this.agora()));
  readonly textoPrazo = computed(() => formatarPrazo(this.tarefa().prazo, this.agora()));
  readonly classePrioridade = computed(() => `priority-tag priority-${CLASSE_PRIORIDADE[this.tarefa().prioridade]}`);
  readonly iconeCategoria = computed(() => iconeCategoria(this.tarefa().categoria));

  private readonly deslizavel = viewChild.required(IonItemSliding);

  constructor() {
    addIcons({ alertCircleOutline, arrowUndoOutline, cellularOutline, checkmarkCircleOutline, timeOutline, trashOutline, ...ICONES_CATEGORIA });
  }

  /** Botão do gesto para a direita (ou o gesto completo): concluir ou desfazer. */
  async aoDeslizarConcluir() {
    await this.deslizavel().close();
    this.alternarConclusao.emit(this.tarefa());
  }

  /** Botão do gesto para a esquerda (ou o gesto completo): apagar. */
  async aoDeslizarExcluir() {
    await this.deslizavel().close();
    this.excluir.emit(this.tarefa());
  }

  aoMarcar(evento: Event) {
    const marcada = (evento as CustomEvent<{ checked: boolean }>).detail.checked;
    if (marcada !== this.tarefa().concluida) this.alternarConclusao.emit(this.tarefa());
  }
}
