import { Tarefa } from '../models/tarefa';
import { paraDataLocal } from '../utils/datas';

/**
 * Tarefas de demonstração, criadas só na primeira vez que o app abre.
 * As datas são relativas ao dia de hoje para a demonstração sempre fazer sentido.
 */
export function criarTarefasExemplo(agora: Date): Tarefa[] {
  const dia = (deslocamento: number) => {
    const data = new Date(agora);
    data.setDate(data.getDate() + deslocamento);
    return data;
  };
  const prazo = (deslocamento: number, hora: string) => `${paraDataLocal(dia(deslocamento))}T${hora}`;
  const momento = (deslocamento: number) => dia(deslocamento).toISOString();

  return [
    {
      id: 'exemplo-1',
      titulo: 'Revisar slides da apresentação',
      categoria: 'Estudo',
      prioridade: 'Alta',
      concluida: false,
      prazo: prazo(0, '14:00'),
      notas: 'Focar na conclusão dos slides de metodologia e resultados esperados.',
      criadaEm: momento(-6),
    },
    {
      id: 'exemplo-2',
      titulo: 'Enviar relatório semanal',
      categoria: 'Trabalho',
      prioridade: 'Alta',
      concluida: false,
      prazo: prazo(0, '18:00'),
      notas: 'Consolidar as entregas da sprint e métricas de desempenho da equipe.',
      criadaEm: momento(-5),
    },
    {
      id: 'exemplo-3',
      titulo: 'Ler capítulo 4 de Estatística',
      categoria: 'Estudo',
      prioridade: 'Média',
      concluida: false,
      prazo: prazo(-1, '20:00'),
      notas: 'Fazer anotações sobre distribuições de probabilidade.',
      criadaEm: momento(-5),
    },
    {
      id: 'exemplo-4',
      titulo: 'Organizar planilha de investimentos',
      categoria: 'Pessoal',
      prioridade: 'Média',
      concluida: false,
      prazo: prazo(1, '11:30'),
      notas: 'Atualizar dividendos e aportes do mês.',
      criadaEm: momento(-4),
    },
    {
      id: 'exemplo-5',
      titulo: 'Revisar relatório financeiro',
      categoria: 'Trabalho',
      prioridade: 'Alta',
      concluida: false,
      prazo: prazo(3, '10:00'),
      notas: 'Verificar os centros de custo e despesas operacionais do mês.',
      criadaEm: momento(-4),
    },
    {
      id: 'exemplo-6',
      titulo: 'Atualizar repositório Git',
      categoria: 'Trabalho',
      prioridade: 'Baixa',
      concluida: false,
      prazo: prazo(5, '16:00'),
      notas: 'Limpar branches antigas e atualizar a documentação no README.',
      criadaEm: momento(-3),
    },
    {
      id: 'exemplo-7',
      titulo: 'Comprar mantimentos para a semana',
      categoria: 'Pessoal',
      prioridade: 'Baixa',
      concluida: false,
      prazo: prazo(6, '10:00'),
      notas: 'Frutas, legumes, café e itens essenciais.',
      criadaEm: momento(-2),
    },
    {
      id: 'exemplo-8',
      titulo: 'Reunião de alinhamento com cliente',
      categoria: 'Trabalho',
      prioridade: 'Alta',
      concluida: true,
      prazo: prazo(-1, '15:00'),
      notas: 'Apresentação do cronograma ajustado.',
      criadaEm: momento(-6),
      concluidaEm: momento(-1),
    },
    {
      id: 'exemplo-9',
      titulo: 'Resumo do artigo científico',
      categoria: 'Estudo',
      prioridade: 'Média',
      concluida: true,
      prazo: prazo(-2, '23:00'),
      notas: 'Submissão para a disciplina de computação.',
      criadaEm: momento(-7),
      concluidaEm: momento(-2),
    },
    {
      id: 'exemplo-10',
      titulo: 'Planejamento das metas semanais',
      categoria: 'Pessoal',
      prioridade: 'Baixa',
      concluida: true,
      prazo: prazo(-4, '09:00'),
      notas: 'Definição das três prioridades principais da semana.',
      criadaEm: momento(-8),
      concluidaEm: momento(-4),
    },
  ];
}
