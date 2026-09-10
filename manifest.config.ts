import { defineManifest } from '@crxjs/vite-plugin'
import packageJson from './package.json' with { type: 'json' }

const { version } = packageJson

export default defineManifest({
  manifest_version: 3,
  name: 'Tab Launcher',
  description:
    "Ouvre des groupes d'onglets pré-configurés par catégorie, en un clic.",
  version,
  action: {
    default_popup: 'src/popup/popup.html',
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
})
