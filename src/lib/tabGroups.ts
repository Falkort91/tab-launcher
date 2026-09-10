import type { Subcategory } from './types'

export interface TabGroupPlan {
  urls: string[]
  groupTitle: string
  groupColor: chrome.tabGroups.ColorEnum
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

  const groupId = await chrome.tabs.group({ tabIds })
  await chrome.tabGroups.update(groupId, { title: plan.groupTitle, color: plan.groupColor })
}
