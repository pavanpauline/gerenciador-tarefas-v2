import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  statsChart,
  statsChartOutline,
  pieChartOutline,
  checkmarkCircle,
  timeOutline,
  flash,
  briefcaseOutline,
  schoolOutline,
  personOutline,
  cellularOutline,
  closeOutline,
  arrowBackOutline,
  trendingUpOutline,
  flagOutline,
  layersOutline
} from 'ionicons/icons';
import { TarefasService } from '../services/tarefas.service';
import { iconeCategoria } from '../models/tarefa';

@Component({
  selector: 'app-estatisticas',
  templateUrl: './estatisticas.page.html',
  styleUrls: ['./estatisticas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonIcon
  ]
})
export class EstatisticasPage {
  @Input() isModal: boolean = false;
  @Output() fechar = new EventEmitter<void>();

  constructor(private readonly tarefasService: TarefasService) {
    addIcons({
      statsChart,
      statsChartOutline,
      pieChartOutline,
      checkmarkCircle,
      timeOutline,
      flash,
      briefcaseOutline,
      schoolOutline,
      personOutline,
      cellularOutline,
      closeOutline,
      arrowBackOutline,
      trendingUpOutline,
      flagOutline,
      layersOutline
    });
  }

  // O serviço guarda as estatísticas num computed: ler várias vezes não refaz as contas.
  get stats() {
    return this.tarefasService.estatisticas();
  }

  get insightTexto(): string {
    const s = this.stats;
    if (s.total === 0) {
      return 'Nenhuma tarefa cadastrada ainda. Crie tarefas para acompanhar suas métricas em tempo real!';
    }
    if (s.taxaConclusao === 100) {
      return 'Incrível! 100% de conclusão. Todas as suas tarefas foram concluídas com sucesso!';
    }
    if (s.taxaConclusao >= 70) {
      return 'Excelente ritmo de trabalho! A grande maioria das suas metas já foram concluídas.';
    }
    if (s.taxaConclusao >= 40) {
      return 'Bom progresso! Continue avançando nas tarefas pendentes para manter a produtividade alta.';
    }
    return 'Você tem tarefas pendentes importantes. Foque nas de Alta prioridade para acelerar seu dia!';
  }

  get categoriaMaisAtiva(): string {
    const categorias = this.stats.porCategoria;
    if (!categorias || categorias.length === 0) return 'Nenhuma';
    const maisAtiva = [...categorias].sort((a, b) => b.total - a.total)[0];
    return maisAtiva && maisAtiva.total > 0 ? maisAtiva.categoria : 'Equilibrado';
  }

  getIconeCategoria(cat: string): string {
    return iconeCategoria(cat);
  }

  fecharTela() {
    this.fechar.emit();
  }
}
