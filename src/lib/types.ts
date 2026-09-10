export type TabGroupColor = `${chrome.tabGroups.Color}`

export interface LinkItem {
  id: string
  label: string
  url: string
}

export interface Subcategory {
  id: string
  name: string
  color: TabGroupColor
  links: LinkItem[]
}

export interface Category {
  id: string
  name: string
  icon?: string
  subcategories: Subcategory[]
}

export type Config = Category[]
