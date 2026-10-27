import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCheckbox,
  IonBadge,
  IonProgressBar,
  IonIcon,
  IonSearchbar,
  IonFabButton,
  IonModal,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonItem
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  flash,
  timeOutline,
  cellularOutline,
  statsChartOutline,
  listOutline,
  optionsOutline,
  add,
  createOutline,
  trashOutline,
  trash,
  closeOutline,
  chevronDownOutline,
  chevronForwardOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkOutline,
  arrowBackOutline,
  arrowUndoOutline,
  folderOutline,
  calendarOutline,
  serverOutline,
  briefcaseOutline,
  schoolOutline,
  personOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { TarefasService } from '../services/tarefas.service';
import {
  CATEGORIAS,
  Categoria,
  PESO_PRIORIDADE,
  PRIORIDADES,
  Prioridade,
  Tarefa,
  iconeCategoria
} from '../models/tarefa';
import {
  estaAtrasada,
  formatarDataCabecalho,
  formatarDataCompleta,
  formatarPrazo,
  lerPrazo,
  montarPrazo,
  separarPrazo,
  sugerirPrazo
} from '../utils/datas';
import { EstatisticasPage } from '../estatisticas/estatisticas.page';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCheckbox,
    IonBadge,
    IonProgressBar,
    IonIcon,
    IonSearchbar,
    IonFabButton,
    IonModal,
    IonList,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonItem,
    EstatisticasPage
  ],
})
export class HomePage {
  // Controle de Abertura dos Bottom Sheets (ion-modal)
  isNovaTarefaModalOpen: boolean = false;
  isDetalhesModalOpen: boolean = false;
  isExcluirModalOpen: boolean = false;
  isFiltrosModalOpen: boolean = false;
  isEditarModalOpen: boolean = false;
  isEstatisticasModalOpen: boolean = false;

  // Tarefas em foco
  tarefaSelecionada: Tarefa | null = null;
  tarefaParaExcluir: Tarefa | null = null;

  // Formulário de Nova Tarefa
  novoTitulo: string = '';
  novasNotas: string = '';
  novaCategoria: Categoria = 'Trabalho';
  novaPrioridade: Prioridade = 'Alta';
  novoPrazoData: string = '';
  novoPrazoHora: string = '';

  // Formulário de Edição
  editTitulo: string = '';
  editNotas: string = '';
  editCategoria: Categoria = 'Trabalho';
  editPrioridade: Prioridade = 'Alta';
  editPrazoData: string = '';
  editPrazoHora: string = '';

  // Filtros e Pesquisa
  termoBusca: string = '';
  filtroStatus: 'Todas' | 'Pendentes' | 'Concluídas' = 'Todas';
  filtroPrioridade: string = 'Todas';
  filtroCategoria: string = 'Todas';

  // Seções retráteis
  mostrarConcluidas: boolean = false;

  // Opções para chips
  readonly categoriasDisponiveis = CATEGORIAS;
  readonly prioridadesDisponiveis = PRIORIDADES;

  constructor(private readonly tarefasService: TarefasService) {
    addIcons({
      searchOutline,
      flash,
      timeOutline,
      cellularOutline,
      statsChartOutline,
      listOutline,
      optionsOutline,
      add,
      createOutline,
      trashOutline,
      trash,
      closeOutline,
      chevronDownOutline,
      chevronForwardOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      checkmarkOutline,
      arrowBackOutline,
      arrowUndoOutline,
      folderOutline,
      calendarOutline,
      serverOutline,
      briefcaseOutline,
      schoolOutline,
      personOutline,
      alertCircleOutline
    });

    this.definirDataHoraPadrao();
  }

  private definirDataHoraPadrao() {
    const { data, hora } = sugerirPrazo(new Date());
    this.novoPrazoData = data;
    this.novoPrazoHora = hora;
  }

  get dataFormatada(): string {
    return formatarDataCabecalho(this.tarefasService.agora());
  }

  get todasTarefas(): readonly Tarefa[] {
    return this.tarefasService.tarefas();
  }

  get tarefasConcluidas(): Tarefa[] {
    return this.todasTarefas.filter(t => t.concluida);
  }

  get totalTarefas(): number {
    return this.todasTarefas.length;
  }

  get totalConcluidas(): number {
    return this.tarefasConcluidas.length;
  }

  get porcentagemProgresso(): number {
    if (this.totalTarefas === 0) return 0;
    return Math.round((this.totalConcluidas / this.totalTarefas) * 100);
  }

  get valorProgresso(): number {
    if (this.totalTarefas === 0) return 0;
    return this.totalConcluidas / this.totalTarefas;
  }

  get sugestaoTarefa(): Tarefa | null {
    const pendentes = this.todasTarefas.filter(t => !t.concluida);
    if (pendentes.length === 0) return null;
    const alta = pendentes.find(t => t.prioridade === 'Alta');
    if (alta) return alta;
    const media = pendentes.find(t => t.prioridade === 'Média');
    if (media) return media;
    return pendentes[0];
  }

  // Lista Filtrada Principal
  get tarefasFiltradas(): Tarefa[] {
    // Cópia: ordenar a lista original mudaria a ordem salva no serviço.
    let lista = [...this.todasTarefas];

    // Filtro de Status
    if (this.filtroStatus === 'Pendentes') {
      lista = lista.filter(t => !t.concluida);
    } else if (this.filtroStatus === 'Concluídas') {
      lista = lista.filter(t => t.concluida);
    }

    // Filtro de Prioridade
    if (this.filtroPrioridade !== 'Todas') {
      lista = lista.filter(t => t.prioridade === this.filtroPrioridade);
    }

    // Filtro de Categoria
    if (this.filtroCategoria !== 'Todas') {
      lista = lista.filter(t => t.categoria === this.filtroCategoria);
    }

    // Busca textual
    if (this.termoBusca && this.termoBusca.trim() !== '') {
      const termo = this.termoBusca.toLowerCase().trim();
      lista = lista.filter(t =>
        t.titulo.toLowerCase().includes(termo) ||
        t.categoria.toLowerCase().includes(termo) ||
        t.prioridade.toLowerCase().includes(termo) ||
        (t.notas && t.notas.toLowerCase().includes(termo))
      );
    }

    // Ordenação: pendentes primeiro, depois prioridade (Alta -> Média -> Baixa)
    // e, na mesma prioridade, o prazo mais próximo (sem prazo vai para o fim).
    const instante = (t: Tarefa) => lerPrazo(t.prazo)?.getTime() ?? Number.POSITIVE_INFINITY;
    return lista.sort((a, b) => {
      if (a.concluida !== b.concluida) {
        return a.concluida ? 1 : -1;
      }
      const porPrioridade = PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade];
      return porPrioridade !== 0 ? porPrioridade : instante(a) - instante(b);
    });
  }

  get tarefasPendentes(): Tarefa[] {
    return this.tarefasFiltradas.filter(t => !t.concluida);
  }

  get tarefasConcluidasFiltradas(): Tarefa[] {
    return this.tarefasFiltradas.filter(t => t.concluida);
  }

  get temFiltroAtivo(): boolean {
    return this.filtroStatus !== 'Todas' ||
           this.filtroPrioridade !== 'Todas' ||
           this.filtroCategoria !== 'Todas' ||
           !!(this.termoBusca && this.termoBusca.trim() !== '');
  }

  /** Toque na sugestão: abre a tarefa sugerida ou, com a lista vazia, o formulário de nova tarefa. */
  abrirSugestao() {
    if (this.sugestaoTarefa) {
      this.abrirDetalhesModal(this.sugestaoTarefa);
    } else if (this.totalTarefas === 0) {
      this.abrirNovaTarefaModal();
    }
  }

  // --- 1. MODAL: NOVA TAREFA ---
  abrirNovaTarefaModal() {
    this.definirDataHoraPadrao();
    this.novoTitulo = '';
    this.novasNotas = '';
    this.novaCategoria = 'Trabalho';
    this.novaPrioridade = 'Alta';
    this.isNovaTarefaModalOpen = true;
  }

  fecharNovaTarefaModal() {
    this.isNovaTarefaModalOpen = false;
  }

  salvarNovaTarefa() {
    if (!this.novoTitulo || this.novoTitulo.trim() === '') {
      return;
    }

    this.tarefasService.adicionarTarefa({
      titulo: this.novoTitulo.trim(),
      categoria: this.novaCategoria,
      prioridade: this.novaPrioridade,
      prazo: montarPrazo(this.novoPrazoData, this.novoPrazoHora),
      notas: this.novasNotas.trim() || undefined
    });

    this.fecharNovaTarefaModal();
  }

  // --- 2. MODAL: DETALHES DA TAREFA ---
  abrirDetalhesModal(tarefa: Tarefa) {
    this.tarefaSelecionada = tarefa;
    this.isDetalhesModalOpen = true;
  }

  fecharDetalhesModal() {
    this.isDetalhesModalOpen = false;
    this.tarefaSelecionada = null;
  }

  // Atenção: o app roda sem zone.js. A tela só é redesenhada sozinha quando um signal muda
  // ou um evento do template termina; um campo comum alterado depois de um `await`
  // não aparece na tela. Por isso as alterações abaixo acontecem antes de esperar a vibração.

  alternarStatusDetalhes() {
    if (!this.tarefaSelecionada) return;
    const id = this.tarefaSelecionada.id;
    void this.tarefasService.alternarConclusao(id);
    this.atualizarSelecionada(id);
  }

  onCheckboxChange(tarefa: Tarefa, event: CustomEvent) {
    const concluida = event.detail.checked ?? false;
    void this.tarefasService.definirConclusao(tarefa.id, concluida);
    this.atualizarSelecionada(tarefa.id);
  }

  /** Mantém o modal de detalhes mostrando a versão mais recente da tarefa. */
  private atualizarSelecionada(id: string) {
    if (this.tarefaSelecionada?.id === id) {
      this.tarefaSelecionada = this.tarefasService.buscarTarefa(id) ?? null;
    }
  }

  // --- AÇÕES RÁPIDAS COM GESTO DE DESLIZAR (SWIPE) ---
  async concluirTarefa(tarefa: Tarefa, slidingItem?: IonItemSliding) {
    if (slidingItem) {
      await slidingItem.close();
    }
    void this.tarefasService.alternarConclusao(tarefa.id);
    this.atualizarSelecionada(tarefa.id);
  }

  async excluirTarefa(tarefa: Tarefa, slidingItem?: IonItemSliding) {
    if (slidingItem) {
      await slidingItem.close();
    }
    void this.tarefasService.excluirTarefa(tarefa.id);

    if (this.tarefaSelecionada && this.tarefaSelecionada.id === tarefa.id) {
      this.fecharDetalhesModal();
    }
    if (this.tarefaParaExcluir && this.tarefaParaExcluir.id === tarefa.id) {
      this.fecharExcluirModal();
    }
  }

  // --- 3. MODAL DE EXCLUSÃO ---
  solicitarExclusao(tarefa: Tarefa) {
    this.tarefaParaExcluir = tarefa;
    this.isExcluirModalOpen = true;
  }

  fecharExcluirModal() {
    this.isExcluirModalOpen = false;
    this.tarefaParaExcluir = null;
  }

  confirmarExcluirTarefa() {
    if (this.tarefaParaExcluir) {
      this.excluirTarefa(this.tarefaParaExcluir);
      this.fecharExcluirModal();
    }
  }

  // --- 4. MODAL: PESQUISA E FILTROS ---
  abrirFiltrosModal() {
    this.isFiltrosModalOpen = true;
  }

  fecharFiltrosModal() {
    this.isFiltrosModalOpen = false;
  }

  limparFiltros() {
    this.termoBusca = '';
    this.filtroStatus = 'Todas';
    this.filtroPrioridade = 'Todas';
    this.filtroCategoria = 'Todas';
  }

  // --- 5. MODAL DE EDIÇÃO ---
  abrirEditarTarefa(tarefa: Tarefa) {
    this.tarefaSelecionada = tarefa;
    this.editTitulo = tarefa.titulo;
    this.editNotas = tarefa.notas || '';
    this.editCategoria = tarefa.categoria;
    this.editPrioridade = tarefa.prioridade;
    const { data, hora } = separarPrazo(tarefa.prazo);
    this.editPrazoData = data;
    this.editPrazoHora = hora;
    this.isEditarModalOpen = true;
  }

  fecharEditarModal() {
    this.isEditarModalOpen = false;
  }

  salvarEdicaoTarefa() {
    if (!this.tarefaSelecionada || !this.editTitulo.trim()) return;

    const id = this.tarefaSelecionada.id;
    this.tarefasService.atualizarTarefa(id, {
      titulo: this.editTitulo.trim(),
      notas: this.editNotas.trim() || undefined,
      categoria: this.editCategoria,
      prioridade: this.editPrioridade,
      prazo: montarPrazo(this.editPrazoData, this.editPrazoHora)
    });
    this.atualizarSelecionada(id);
    this.fecharEditarModal();
  }

  // --- 6. MODAL: ESTATÍSTICAS / DASHBOARD ---
  abrirEstatisticasModal() {
    this.isEstatisticasModalOpen = true;
  }

  fecharEstatisticasModal() {
    this.isEstatisticasModalOpen = false;
  }

  // Auxiliares
  alternarMostrarConcluidas() {
    this.mostrarConcluidas = !this.mostrarConcluidas;
  }

  getIconeCategoria(categoria: string): string {
    return iconeCategoria(categoria);
  }

  textoPrazo(tarefa: Tarefa): string {
    return formatarPrazo(tarefa.prazo, this.tarefasService.agora());
  }

  estaAtrasada(tarefa: Tarefa): boolean {
    return !tarefa.concluida && estaAtrasada(tarefa.prazo, this.tarefasService.agora());
  }

  textoCriacao(tarefa: Tarefa): string {
    return formatarDataCompleta(tarefa.criadaEm);
  }
}
