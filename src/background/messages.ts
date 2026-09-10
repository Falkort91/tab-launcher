import { openTabGroup } from '../lib/tabGroups'
import type { Subcategory } from '../lib/types'

export interface OpenTabGroupMessage {
  type: 'openTabGroup'
  subcategory: Subcategory
}

export type ExtensionMessage = OpenTabGroupMessage

export interface MessageResponse {
  ok: boolean
  error?: string
}

export async function handleMessage(message: ExtensionMessage): Promise<MessageResponse> {
  switch (message.type) {
    case 'openTabGroup':
      try {
        await openTabGroup(message.subcategory)
        return { ok: true }
      } catch (error) {
        console.error('[tab-launcher] openTabGroup failed', error)
        return { ok: false, error: error instanceof Error ? error.message : 'Erreur inconnue.' }
      }
  }
}
