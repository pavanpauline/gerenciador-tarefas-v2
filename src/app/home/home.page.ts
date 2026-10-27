import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonFabButton, IonIcon, IonList, IonModal, IonProgressBar, IonSearchbar, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  alertCircleOutline,
  arrowBackOutline,
  calendarOutline,
  cellularOutline,
  checkmarkCircle,
  chevronDownOutline,
  chevronForwardOutline,
  closeOutline,
  createOutline,
  flash,
  listOutline,
  optionsOutline,
  searchOutline,
  serverOutline,
  statsChartOutline,
  timeOutline,
  trash,
  trashOutline,
} from 'ionicons/icons';
import { TarefaCardComponent } from '../components/tarefa-card/tarefa-card.component';
import { TarefaFormComponent } from '../components/tarefa-form/tarefa-form.component';
import { EstatisticasPage } from '../estatisticas/estatisticas.page';
import { CATEGORIAS, CLASSE_PRIORIDADE, Categoria, DadosTarefa, PRIORIDADES, Prioridade, Tarefa, iconeCategoria } from '../models/tarefa';
import {
  FiltroStatus,
  Filtros,
  OPCOES_STATUS,
  filtrarTarefas,
  ordenarConcluidas,
  ordenarPendentes,
  temFiltroAtivo,
} from '../services/filtros';
import { escolherSugestao } from '../services/sugestao';
import { TarefaExcluida, TarefasService } from '../services/tarefas.service';
import { estaAtrasada, formatarDataCabecalho, formatarDataCompleta, formatarPrazo } from '../utils/datas';
import { ICONES_CATEGORIA } from '../utils/icones-categoria';

/**
 * Tela principal. Todo o estado é feito de signals: a tela se atualiza sozinha
 * quando a lista, os filtros ou o relógio mudam (o app roda sem zone.js).
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonProgressBar,
    IonIcon,
    IonSearchbar,
    IonFabButton,
    IonModal,
    IonList,
    TarefaCardComponent,
    TarefaFormComponent,
    EstatisticasPage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly tarefasService = inject(TarefasService);
  private readonly toastController = inject(ToastController);

  readonly agora = this.tarefasService.agora;
  readonly dataFormatada = computed(() => formatarDataCabecalho(this.agora()));

  // --- Modais (bottom sheets) abertos ---
  readonly novaTarefaAberta = signal(false);
  readonly detalhesAberto = signal(false);
  readonly editarAberto = signal(false);
  readonly excluirAberto = signal(false);
  readonly filtrosAberto = signal(false);
  readonly estatisticasAberto = signal(false);
  readonly mostrarConcluidas = signal(false);

  // --- Tarefa em foco: guardamos só o id; os dados vêm sempre atualizados do serviço ---
  private readonly idSelecionado = signal<string | null>(null);
  readonly tarefaSelecionada = computed(() => {
    const id = this.idSelecionado();
    return id ? (this.tarefasService.buscarTarefa(id) ?? null) : null;
  });

  // --- Filtros e busca ---
  readonly termoBusca = signal('');
  readonly filtroStatus = signal<FiltroStatus>('Todas');
  readonly filtroPrioridade = signal<Prioridade | 'Todas'>('Todas');
  readonly filtroCategoria = signal<Categoria | 'Todas'>('Todas');
  private readonly filtros = computed<Filtros>(() => ({
    termo: this.termoBusca(),
    status: this.filtroStatus(),
    prioridade: this.filtroPrioridade(),
    categoria: this.filtroCategoria(),
  }));
  readonly temFiltroAtivo = computed(() => temFiltroAtivo(this.filtros()));
  readonly resumoFiltros = computed(() => {
    const f = this.filtros();
    return [
      f.status !== 'Todas' ? f.status : '',
      f.prioridade !== 'Todas' ? f.prioridade : '',
      f.categoria !== 'Todas' ? f.categoria : '',
      f.termo.trim() ? `"${f.termo.trim()}"` : '',
    ]
      .filter(Boolean)
      .join(' • ');
  });

  readonly opcoesStatus = OPCOES_STATUS;
  readonly opcoesPrioridade: readonly (Prioridade | 'Todas')[] = ['Todas', ...PRIORIDADES];
  readonly opcoesCategoria: readonly (Categoria | 'Todas')[] = ['Todas', ...CATEGORIAS];
  readonly classePrioridade = CLASSE_PRIORIDADE;

  // --- Listas (recalculadas só quando a lista ou os filtros mudam) ---
  private readonly filtradas = computed(() => filtrarTarefas(this.tarefasService.tarefas(), this.filtros()));
  readonly pendentes = computed(() => ordenarPendentes(this.filtradas().filter((t) => !t.concluida)));
  readonly concluidas = computed(() => ordenarConcluidas(this.filtradas().filter((t) => t.concluida)));
  readonly totalFiltradas = computed(() => this.filtradas().length);

  // --- Progresso (sempre sobre todas as tarefas, sem filtro) ---
  readonly totalTarefas = computed(() => this.tarefasService.tarefas().length);
  readonly totalConcluidas = computed(() => this.tarefasService.tarefas().filter((t) => t.concluida).length);
  readonly porcentagemProgresso = computed(() =>
    this.totalTarefas() ? Math.round((this.totalConcluidas() / this.totalTarefas()) * 100) : 0,
  );

  /** A tarefa que o app recomenda fazer agora, com o motivo. */
  readonly sugestao = computed(() => escolherSugestao(this.tarefasService.tarefas(), this.agora()));

  /** Aviso de "Desfazer" aberto no momento (só um por vez). */
  private avisoDesfazer: HTMLIonToastElement | null = null;

  constructor() {
    addIcons({
      add,
      alertCircleOutline,
      arrowBackOutline,
          calendarOutline,
      cellularOutline,
      checkmarkCircle,
      chevronDownOutline,
      chevronForwardOutline,
      closeOutline,
      createOutline,
      flash,
          listOutline,
      optionsOutline,
              searchOutline,
      serverOutline,
      statsChartOutline,
      timeOutline,
      trash,
      trashOutline,
      ...ICONES_CATEGORIA,
    });
  }

  // --- Ações sobre as tarefas ---

  abrirDetalhes(tarefa: Tarefa) {
    this.idSelecionado.set(tarefa.id);
    this.detalhesAberto.set(true);
  }

  alternarConclusao(tarefa: Tarefa) {
    void this.tarefasService.alternarConclusao(tarefa.id);
  }

  /** Exclui na hora e oferece "Desfazer" por alguns segundos. */
  async excluir(tarefa: Tarefa) {
    if (this.idSelecionado() === tarefa.id) {
      this.detalhesAberto.set(false);
      this.excluirAberto.set(false);
    }
    const excluida = await this.tarefasService.excluirTarefa(tarefa.id);
    if (excluida) await this.mostrarAvisoDesfazer(excluida);
  }

  private async mostrarAvisoDesfazer(excluida: TarefaExcluida) {
    await this.avisoDesfazer?.dismiss();
    const aviso = await this.toastController.create({
      message: `"${excluida.tarefa.titulo}" foi excluída`,
      duration: 5000,
      position: 'bottom',
      positionAnchor: 'rodape-flutuante',
      cssClass: 'toast-desfazer',
      buttons: [{ text: 'Desfazer', handler: () => this.tarefasService.restaurarTarefa(excluida) }],
    });
    this.avisoDesfazer = aviso;
    await aviso.present();
  }

  /** Toque numa tarefa da lista de prazos do dashboard: fecha o dashboard e abre os detalhes. */
  abrirDaEstatistica(tarefa: Tarefa) {
    this.estatisticasAberto.set(false);
    this.abrirDetalhes(tarefa);
  }

  // --- Modal: sugestão / nova tarefa ---

  /** Toque na sugestão: abre a tarefa sugerida ou, com a lista vazia, o formulário de nova tarefa. */
  abrirSugestao() {
    const sugestao = this.sugestao();
    if (sugestao) this.abrirDetalhes(sugestao.tarefa);
    else if (this.totalTarefas() === 0) this.novaTarefaAberta.set(true);
  }

  criarTarefa(dados: DadosTarefa) {
    void this.tarefasService.adicionarTarefa(dados);
    this.novaTarefaAberta.set(false);
  }

  // --- Modal: detalhes, edição e exclusão ---

  fecharDetalhes() {
    this.detalhesAberto.set(false);
  }

  salvarEdicao(dados: DadosTarefa) {
    const tarefa = this.tarefaSelecionada();
    if (tarefa) this.tarefasService.atualizarTarefa(tarefa.id, dados);
    this.editarAberto.set(false);
  }

  confirmarExclusao() {
    const tarefa = this.tarefaSelecionada();
    this.excluirAberto.set(false);
    if (tarefa) void this.excluir(tarefa);
  }

  // --- Filtros ---

  limparFiltros() {
    this.termoBusca.set('');
    this.filtroStatus.set('Todas');
    this.filtroPrioridade.set('Todas');
    this.filtroCategoria.set('Todas');
  }

  // --- Auxiliares do template ---

  iconeCategoria(categoria: string) {
    return iconeCategoria(categoria);
  }

  textoPrazo(tarefa: Tarefa) {
    return formatarPrazo(tarefa.prazo, this.agora());
  }

  estaAtrasada(tarefa: Tarefa) {
    return !tarefa.concluida && estaAtrasada(tarefa.prazo, this.agora());
  }

  textoData(iso: string | undefined) {
    return formatarDataCompleta(iso);
  }
}
