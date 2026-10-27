import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alarmOutline,
  alertCircleOutline,
  arrowBackOutline,
  calendarOutline,
  cellularOutline,
  chevronForwardOutline,
  closeOutline,
  flagOutline,
  flame,
  flash,
  layersOutline,
  statsChart,
  timeOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import { CLASSE_CATEGORIA, CLASSE_PRIORIDADE, Categoria, Tarefa, iconeCategoria } from '../models/tarefa';
import { gerarInsight } from '../services/estatisticas';
import { TarefasService } from '../services/tarefas.service';
import { estaAtrasada, formatarPrazo } from '../utils/datas';
import { ICONES_CATEGORIA } from '../utils/icones-categoria';

/**
 * Dashboard. Funciona como página (rota /estatisticas) ou dentro do modal da Home.
 * Não guarda dados próprios: tudo vem do signal `estatisticas` do serviço, que é
 * recalculado quando as tarefas mudam.
 */
@Component({
  selector: 'app-estatisticas',
  templateUrl: './estatisticas.page.html',
  styleUrls: ['./estatisticas.page.scss'],
  imports: [RouterLink, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstatisticasPage {
  private readonly tarefasService = inject(TarefasService);

  /** true quando está dentro do modal da Home (mostra "fechar" em vez de "voltar"). */
  readonly isModal = input(false);
  readonly fechar = output<void>();
  /** Toque numa tarefa da lista de prazos: a Home abre os detalhes dela. */
  readonly abrirTarefa = output<Tarefa>();

  readonly estatisticas = this.tarefasService.estatisticas;
  readonly insight = computed(() => gerarInsight(this.estatisticas()));
  /** Categorias com pelo menos uma tarefa, da mais usada para a menos usada (empate: ordem padrão). */
  readonly categoriasEmUso = computed(() =>
    this.estatisticas()
      .porCategoria.filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total),
  );
  /** Categorias ainda sem tarefas: aparecem só como uma linha discreta, para o dashboard não ficar comprido. */
  readonly categoriasSemTarefas = computed(() =>
    this.estatisticas()
      .porCategoria.filter((c) => c.total === 0)
      .map((c) => c.categoria),
  );
  readonly categoriaMaisAtiva = computed(() => this.categoriasEmUso()[0]?.categoria ?? 'Equilibrado');

  /** Altura de cada barra do gráfico, em % da maior (mínimo 1 para não dividir por zero). */
  readonly maiorDia = computed(() => Math.max(1, ...this.estatisticas().ultimos7Dias.map((d) => d.concluidas)));
  readonly variacaoSemana = computed(() => {
    const e = this.estatisticas();
    return e.concluidasSemana - e.concluidasSemanaAnterior;
  });
  /** Texto do gráfico para leitores de tela. */
  readonly descricaoGrafico = computed(
    () =>
      'Tarefas concluídas por dia nos últimos 7 dias: ' +
      this.estatisticas()
        .ultimos7Dias.map((d) => `${d.ehHoje ? 'hoje' : d.rotulo} ${d.concluidas}`)
        .join(', '),
  );

  readonly classePrioridade = CLASSE_PRIORIDADE;
  readonly classeCategoria: Record<Categoria, string> = CLASSE_CATEGORIA;

  constructor() {
    addIcons({
      alarmOutline,
      alertCircleOutline,
      arrowBackOutline,
      calendarOutline,
      cellularOutline,
      chevronForwardOutline,
      closeOutline,
      flagOutline,
      flame,
      flash,
      layersOutline,
      statsChart,
      timeOutline,
      trendingUpOutline,
      ...ICONES_CATEGORIA,
    });
  }

  iconeCategoria(categoria: string) {
    return iconeCategoria(categoria);
  }

  textoPrazo(tarefa: Tarefa) {
    return formatarPrazo(tarefa.prazo, this.tarefasService.agora());
  }

  estaAtrasada(tarefa: Tarefa) {
    return estaAtrasada(tarefa.prazo, this.tarefasService.agora());
  }

  fecharTela() {
    this.fechar.emit();
  }
}
