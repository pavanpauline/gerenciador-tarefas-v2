import { Haptics, ImpactStyle } from '@capacitor/haptics';

export { ImpactStyle };

/**
 * Feedback tátil. No celular usa o motor de vibração nativo (@capacitor/haptics);
 * no navegador tenta a Vibration API; onde nada disso existe, não faz nada.
 */
export async function vibrar(estilo: ImpactStyle = ImpactStyle.Medium): Promise<void> {
  try {
    await Haptics.impact({ style: estilo });
  } catch {
    try {
      navigator.vibrate?.(40);
    } catch {
      // Sem suporte a vibração: segue sem feedback.
    }
  }
}
