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
  if (plan.urls.length === 0) {
    throw new Error('Cette sous-catégorie ne contient aucun lien.')
  }

  // active: false pour chaque onglet créé : chrome.tabs.create({ url }) sans ce
  // champ ouvre l'onglet actif par défaut, ce qui vole le focus au popup — et
  // Chrome ferme automatiquement un popup dès qu'il perd le focus, potentiellement
  // avant que les onglets suivants soient créés/groupés/colorés.
  const tabs = await Promise.all(plan.urls.map((url) => chrome.tabs.create({ url, active: false })))
  const tabIds = tabs.map((tab) => tab.id).filter((id): id is number => id !== undefined)

  if (tabIds.length === 0) {
    throw new Error("Aucun des onglets n'a pu être créé.")
  }

  // tabIds contient au moins 1 élément grâce au garde ci-dessus, mais le type de
  // chrome.tabs.group exige un tuple non-vide, ce qu'un simple check .length ne
  // permet pas à TypeScript de déduire.
  const groupId = await chrome.tabs.group({ tabIds: tabIds as [number, ...number[]] })
  const lastTabId = tabIds[tabIds.length - 1]

  // Nommer/colorer le groupe et activer le dernier onglet sont deux opérations
  // indépendantes (l'une porte sur le groupe, l'autre sur un onglet précis) : les
  // lancer en parallèle réduit la fenêtre pendant laquelle la séquence pourrait
  // être interrompue, plutôt que de les enchaîner sans raison.
  await Promise.all([
    chrome.tabGroups.update(groupId, { title: plan.groupTitle, color: plan.groupColor }),
    chrome.tabs.update(lastTabId, { active: true }),
  ])

  // Le groupe est formé avec les onglets valides — mais si certains onglets créés
  // n'ont pas renvoyé d'id (cas limite de l'API), ils sont restés hors du groupe
  // sans qu'on le signale : on le fait remonter maintenant, après coup, pour ne pas
  // annuler le travail déjà réussi.
  if (tabIds.length < tabs.length) {
    throw new Error(`${tabs.length - tabIds.length} onglet(s) n'ont pas pu être ajoutés au groupe.`)
  }
}
