import { handleMessage } from './messages'
import { seedDefaultConfigIfEmpty } from './seed'
import type { ExtensionMessage } from './messages'

chrome.runtime.onInstalled.addListener((details) => {
  // onInstalled se déclenche aussi sur chaque mise à jour de l'extension, pas
  // seulement à la première installation — sans ce filtre, un utilisateur qui a
  // volontairement vidé sa config la verrait réapparaître avec les données de démo
  // à la prochaine mise à jour automatique.
  if (details.reason === 'install') {
    seedDefaultConfigIfEmpty().catch((error: unknown) => {
      console.error('[tab-launcher] échec du seed de la config par défaut', error)
    })
  }
  console.log('[tab-launcher] extension installed')
})

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  void handleMessage(message).then(sendResponse)
  return true
})
