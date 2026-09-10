export interface LinkItem {
  id: string
  label: string
  url: string
}

export interface Subcategory {
  id: string
  name: string
  color: chrome.tabGroups.ColorEnum
  links: LinkItem[]
}

export interface Category {
  id: string
  name: string
  icon?: string
  subcategories: Subcategory[]
}

export type Config = Category[]
