import type { Subcategory, TabGroupColor } from './types'

export interface TabGroupPlan {
  urls: string[]
  groupTitle: string
  groupColor: TabGroupColor
}

export function buildTabGroupPlan(subcategory: Subcategory): TabGroupPlan {
  return {
    urls: subcategory.links.map((link) => link.url),
    groupTitle: subcategory.name,
    groupColor: subcategory.color,
  }
}

export async function openTabGroup(subcategory: Subcategory): Promise<void> {
  const plan = buildTabGroupPlan(subcategory)
  if (plan.urls.length === 0) return

  // active: false pour chaque onglet créé : chrome.tabs.create({ url }) sans ce
  // champ ouvre l'onglet actif par défaut, ce qui vole le focus au popup — et
  // Chrome ferme automatiquement un popup dès qu'il perd le focus, potentiellement
  // avant que les onglets suivants soient créés/groupés/colorés.
  const tabs = await Promise.all(plan.urls.map((url) => chrome.tabs.create({ url, active: false })))
  const tabIds = tabs.map((tab) => tab.id).filter((id): id is number => id !== undefined)
  if (tabIds.length === 0) return

  // tabIds contient au moins 1 élément grâce au garde ci-dessus, mais le type de
  // chrome.tabs.group exige un tuple non-vide, ce qu'un simple check .length ne
  // permet pas à TypeScript de déduire.
  const groupId = await chrome.tabs.group({ tabIds: tabIds as [number, ...number[]] })
  await chrome.tabGroups.update(groupId, { title: plan.groupTitle, color: plan.groupColor })

  // Une fois le groupe formé, on active le dernier onglet pour que l'utilisateur
  // atterrisse dessus — comportement natif attendu d'un "ouvrir tout dans de
  // nouveaux onglets", et seulement à ce stade car tout le reste est terminé.
  const lastTabId = tabIds[tabIds.length - 1]
  await chrome.tabs.update(lastTabId, { active: true })
}
