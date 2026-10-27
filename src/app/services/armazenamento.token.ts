import { InjectionToken } from '@angular/core';
import { Armazenamento, criarArmazenamentoEmMemoria } from './armazenamento';

/**
 * Onde o app guarda os dados. Por padrão é o localStorage do navegador; se ele
 * não existir ou estiver bloqueado (modo privado, ambiente de testes), o app
 * usa a memória e continua funcionando, só sem guardar entre uma sessão e outra.
 * Os testes trocam por um armazenamento próprio com `{ provide: ARMAZENAMENTO, useValue: ... }`.
 */
export const ARMAZENAMENTO = new InjectionToken<Armazenamento>('ARMAZENAMENTO', {
  providedIn: 'root',
  factory: () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
    } catch {
      // Acesso ao localStorage bloqueado pelo navegador.
    }
    return criarArmazenamentoEmMemoria();
  },
});
