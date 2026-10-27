import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { CHAVE_TAREFAS } from './armazenamento';

/**
 * Cópia de segurança das tarefas no armazenamento nativo do celular (@capacitor/preferences).
 *
 * O app lê e grava no localStorage, que é rápido e funciona igual no navegador e no celular.
 * Só que, no iOS, o sistema pode apagar o localStorage do WebView quando falta espaço.
 * Por isso, no celular, cada gravação também vai para o Preferences, que o sistema não apaga;
 * se um dia o localStorage aparecer vazio, as tarefas são recuperadas de lá.
 * No navegador não faz nada.
 */
@Injectable({ providedIn: 'root' })
export class BackupNativoService {
  readonly ativo = Capacitor.isNativePlatform();

  async salvar(texto: string): Promise<void> {
    if (!this.ativo) return;
    try {
      await Preferences.set({ key: CHAVE_TAREFAS, value: texto });
    } catch {
      // Sem o backup o app continua funcionando com o localStorage.
    }
  }

  async ler(): Promise<string | null> {
    if (!this.ativo) return null;
    try {
      return (await Preferences.get({ key: CHAVE_TAREFAS })).value;
    } catch {
      return null;
    }
  }
}
