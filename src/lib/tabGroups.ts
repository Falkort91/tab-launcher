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

  const tabs = await Promise.all(plan.urls.map((url) => chrome.tabs.create({ url })))
  const tabIds = tabs.map((tab) => tab.id).filter((id): id is number => id !== undefined)
  if (tabIds.length === 0) return

  // tabIds contient au moins 1 élément grâce au garde ci-dessus, mais le type de
  // chrome.tabs.group exige un tuple non-vide, ce qu'un simple check .length ne
  // permet pas à TypeScript de déduire.
  const groupId = await chrome.tabs.group({ tabIds: tabIds as [number, ...number[]] })
  await chrome.tabGroups.update(groupId, { title: plan.groupTitle, color: plan.groupColor })
}
