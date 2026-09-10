import { seedDefaultConfigIfEmpty } from './seed'

chrome.runtime.onInstalled.addListener(() => {
  void seedDefaultConfigIfEmpty()
  console.log('[tab-launcher] extension installed')
})
