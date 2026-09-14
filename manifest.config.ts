import { defineManifest } from '@crxjs/vite-plugin'
import packageJson from './package.json' with { type: 'json' }

const { version } = packageJson

export default defineManifest({
  manifest_version: 3,
  name: 'Tab Launcher',
  description:
    "Ouvre des groupes d'onglets pré-configurés par catégorie, en un clic.",
  version,
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/popup.html',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
  },
  options_ui: {
    page: 'src/options/options.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['storage', 'tabs', 'tabGroups'],
  // Nécessaire pour l'appel fetch vers le fournisseur IA choisi (suggestion de
  // nom/couleur de groupe) déclenché depuis la page d'options — cf. src/lib/ai.ts.
  host_permissions: ['https://openrouter.ai/*', 'https://api.anthropic.com/*', 'https://api.openai.com/*'],
})
