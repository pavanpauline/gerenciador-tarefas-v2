import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identificador único do app nas lojas (formato de domínio invertido). Só dá para mudar antes de publicar.
  appId: 'com.pavanpauline.gerenciadortarefas',
  // Nome que aparece embaixo do ícone no celular
  appName: 'Gerenciador de Tarefas',
  // Pasta gerada pelo "npm run build"; é ela que vai para dentro do app nativo
  webDir: 'www',
  plugins: {
    // Barras do sistema (Capacitor 8): o app desenha atrás da barra de status e da barra de gestos,
    // e o CSS usa as áreas seguras (--ion-safe-area-*) para não ficar nada embaixo delas.
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      // Ícones da barra de status claros ou escuros conforme o tema do aparelho
      style: 'DEFAULT',
    },
  },
};

export default config;
