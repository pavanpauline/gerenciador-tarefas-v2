/**
 * Funções de apoio usadas só pelos testes (*.spec.ts).
 * Não entram no app: nenhum arquivo do app importa este.
 */
import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tarefa } from '../models/tarefa';
import { CHAVE_TAREFAS, criarArmazenamentoEmMemoria } from '../services/armazenamento';
import { ARMAZENAMENTO } from '../services/armazenamento.token';
import { paraDataLocal } from '../utils/datas';

/** Prazo relativo a hoje: prazoEm(-1, '18:00') é ontem às 18:00; prazoEm(2) é depois de amanhã (o dia todo). */
export function prazoEm(dias: number, hora?: string): string {
  const dia = new Date();
  dia.setDate(dia.getDate() + dias);
  return hora ? `${paraDataLocal(dia)}T${hora}` : paraDataLocal(dia);
}

/** Momento (ISO 8601) relativo a hoje, por padrão ao meio-dia. */
export function momentoEm(dias: number, hora = 12): string {
  const momento = new Date();
  momento.setDate(momento.getDate() + dias);
  momento.setHours(hora, 0, 0, 0);
  return momento.toISOString();
}

/** Tarefa com valores padrão; basta informar o que importa para o teste. */
export function criarTarefa(dados: Partial<Tarefa> & Pick<Tarefa, 'id'>): Tarefa {
  return {
    titulo: dados.id,
    categoria: 'Trabalho',
    prioridade: 'Média',
    concluida: false,
    criadaEm: momentoEm(-7),
    ...dados,
  };
}

/** Configura o TestBed com um armazenamento em memória que já contém estas tarefas. */
export function configurarComTarefas(tarefas: Tarefa[], providers: (Provider | EnvironmentProviders)[] = []) {
  const armazenamento = criarArmazenamentoEmMemoria({
    [CHAVE_TAREFAS]: JSON.stringify({ versao: 2, tarefas }),
  });
  TestBed.configureTestingModule({
    providers: [{ provide: ARMAZENAMENTO, useValue: armazenamento }, ...providers],
  });
  return armazenamento;
}
