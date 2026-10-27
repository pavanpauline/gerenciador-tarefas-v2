import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, cellularOutline, checkmarkOutline } from 'ionicons/icons';
import {
  CATEGORIAS,
  CLASSE_PRIORIDADE,
  Categoria,
  DadosTarefa,
  PRIORIDADES,
  Prioridade,
  iconeCategoria,
} from '../../models/tarefa';
import { montarPrazo, paraDataLocal, separarPrazo, sugerirPrazo } from '../../utils/datas';
import { ICONES_CATEGORIA } from '../../utils/icones-categoria';

type AtalhoPrazo = 'hoje' | 'amanha' | 'sem-prazo';

/**
 * Formulário de tarefa, usado para criar e para editar.
 * Recebe os dados iniciais (vazio = tarefa nova) e devolve o resultado pelo output `salvar`.
 */
@Component({
  selector: 'app-tarefa-form',
  templateUrl: './tarefa-form.component.html',
  styleUrls: ['./tarefa-form.component.scss'],
  imports: [FormsModule, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarefaFormComponent {
  /** Tarefa sendo editada; sem valor, o formulário é de uma tarefa nova. */
  readonly inicial = input<DadosTarefa | null>(null);
  readonly textoBotao = input('Criar tarefa');
  readonly iconeBotao = input<string | null>('add');

  readonly salvar = output<DadosTarefa>();

  readonly categorias = CATEGORIAS;
  readonly prioridades = PRIORIDADES;
  readonly classePrioridade = CLASSE_PRIORIDADE;
  readonly iconeCategoria = iconeCategoria;

  // linkedSignal: começa com o valor da tarefa recebida e depois pode ser editado livremente.
  readonly titulo = linkedSignal(() => this.inicial()?.titulo ?? '');
  readonly notas = linkedSignal(() => this.inicial()?.notas ?? '');
  readonly categoria = linkedSignal<Categoria>(() => this.inicial()?.categoria ?? 'Trabalho');
  readonly prioridade = linkedSignal<Prioridade>(() => this.inicial()?.prioridade ?? 'Alta');

  private readonly prazoInicial = computed(() => {
    const tarefa = this.inicial();
    return tarefa ? separarPrazo(tarefa.prazo) : sugerirPrazo(new Date());
  });
  readonly data = linkedSignal(() => this.prazoInicial().data);
  readonly hora = linkedSignal(() => this.prazoInicial().hora);

  readonly valido = computed(() => this.titulo().trim().length > 0);

  /** Qual atalho de prazo corresponde à data escolhida (para destacar o chip). */
  readonly atalhoAtivo = computed<AtalhoPrazo | null>(() => {
    const data = this.data();
    if (!data) return 'sem-prazo';
    if (data === this.diaComDeslocamento(0)) return 'hoje';
    if (data === this.diaComDeslocamento(1)) return 'amanha';
    return null;
  });

  constructor() {
    addIcons({ add, cellularOutline, checkmarkOutline, ...ICONES_CATEGORIA });
  }

  usarAtalho(atalho: AtalhoPrazo) {
    if (atalho === 'sem-prazo') {
      this.data.set('');
      this.hora.set('');
      return;
    }
    this.data.set(this.diaComDeslocamento(atalho === 'hoje' ? 0 : 1));
    if (!this.hora()) this.hora.set(sugerirPrazo(new Date()).hora);
  }

  enviar() {
    if (!this.valido()) return;
    this.salvar.emit({
      titulo: this.titulo().trim(),
      notas: this.notas().trim() || undefined,
      categoria: this.categoria(),
      prioridade: this.prioridade(),
      prazo: montarPrazo(this.data(), this.hora()),
    });
  }

  private diaComDeslocamento(dias: number): string {
    const dia = new Date();
    dia.setDate(dia.getDate() + dias);
    return paraDataLocal(dia);
  }
}
