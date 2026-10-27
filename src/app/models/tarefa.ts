export type Prioridade = 'Alta' | 'Média' | 'Baixa';
export type Categoria = 'Trabalho' | 'Estudo' | 'Pessoal' | 'Saúde' | 'Casa' | 'Finanças';

export const PRIORIDADES: readonly Prioridade[] = ['Alta', 'Média', 'Baixa'];
export const CATEGORIAS: readonly Categoria[] = ['Trabalho', 'Estudo', 'Pessoal', 'Saúde', 'Casa', 'Finanças'];

/** Peso usado na ordenação: quanto menor, mais urgente. */
export const PESO_PRIORIDADE: Record<Prioridade, number> = { Alta: 1, Média: 2, Baixa: 3 };

/** Sufixo das classes CSS de cada prioridade (sem acento): priority-alta, priority-media, priority-baixa. */
export const CLASSE_PRIORIDADE: Record<Prioridade, string> = { Alta: 'alta', Média: 'media', Baixa: 'baixa' };

/** Ícone (nome do Ionicons) de cada categoria. Os ícones são registrados em utils/icones-categoria.ts. */
const ICONE_CATEGORIA: Record<Categoria, string> = {
  Trabalho: 'briefcase-outline',
  Estudo: 'school-outline',
  Pessoal: 'person-outline',
  Saúde: 'fitness-outline',
  Casa: 'home-outline',
  Finanças: 'wallet-outline',
};

/** Sufixo das classes CSS de cada categoria (sem acento): cat-badge-saude, fill-financas... */
export const CLASSE_CATEGORIA: Record<Categoria, string> = {
  Trabalho: 'trabalho',
  Estudo: 'estudo',
  Pessoal: 'pessoal',
  Saúde: 'saude',
  Casa: 'casa',
  Finanças: 'financas',
};

export interface Tarefa {
  id: string;
  titulo: string;
  categoria: Categoria;
  prioridade: Prioridade;
  concluida: boolean;
  /** Prazo no horário do aparelho: 'AAAA-MM-DD' (o dia todo) ou 'AAAA-MM-DDTHH:mm'. */
  prazo?: string;
  notas?: string;
  /** Momento da criação, em ISO 8601. */
  criadaEm: string;
  /** Momento da conclusão, em ISO 8601. Vazio enquanto a tarefa está pendente. */
  concluidaEm?: string;
}

/** Campos que o usuário preenche ao criar ou editar uma tarefa. */
export type DadosTarefa = Pick<Tarefa, 'titulo' | 'categoria' | 'prioridade' | 'prazo' | 'notas'>;

export function ehPrioridade(valor: unknown): valor is Prioridade {
  return PRIORIDADES.includes(valor as Prioridade);
}

export function ehCategoria(valor: unknown): valor is Categoria {
  return CATEGORIAS.includes(valor as Categoria);
}

export function iconeCategoria(categoria: string): string {
  return ehCategoria(categoria) ? ICONE_CATEGORIA[categoria] : 'folder-outline';
}

/** Identificador único; usa o gerador do navegador quando disponível. */
export function gerarId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
