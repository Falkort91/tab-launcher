import { generateId } from './id'
import type { Category, Config, LinkItem, Subcategory, TabGroupColor } from './types'

export function addCategory(config: Config, name: string): Config {
  const category: Category = { id: generateId(), name, subcategories: [] }
  return [...config, category]
}

export function updateCategory(
  config: Config,
  categoryId: string,
  patch: Partial<Pick<Category, 'name' | 'icon'>>,
): Config {
  return config.map((category) =>
    category.id === categoryId ? { ...category, ...patch } : category,
  )
}

export function deleteCategory(config: Config, categoryId: string): Config {
  return config.filter((category) => category.id !== categoryId)
}

export function addSubcategory(
  config: Config,
  categoryId: string,
  input: { name: string; color: TabGroupColor },
): Config {
  const subcategory: Subcategory = { id: generateId(), name: input.name, color: input.color, links: [] }
  return config.map((category) =>
    category.id === categoryId
      ? { ...category, subcategories: [...category.subcategories, subcategory] }
      : category,
  )
}

export function updateSubcategory(
  config: Config,
  categoryId: string,
  subcategoryId: string,
  patch: Partial<Pick<Subcategory, 'name' | 'color'>>,
): Config {
  return config.map((category) =>
    category.id !== categoryId
      ? category
      : {
          ...category,
          subcategories: category.subcategories.map((subcategory) =>
            subcategory.id === subcategoryId ? { ...subcategory, ...patch } : subcategory,
          ),
        },
  )
}

export function deleteSubcategory(config: Config, categoryId: string, subcategoryId: string): Config {
  return config.map((category) =>
    category.id !== categoryId
      ? category
      : { ...category, subcategories: category.subcategories.filter((s) => s.id !== subcategoryId) },
  )
}

export function addLink(
  config: Config,
  categoryId: string,
  subcategoryId: string,
  input: { label: string; url: string },
): Config {
  const link: LinkItem = { id: generateId(), label: input.label, url: input.url }
  return config.map((category) =>
    category.id !== categoryId
      ? category
      : {
          ...category,
          subcategories: category.subcategories.map((subcategory) =>
            subcategory.id === subcategoryId
              ? { ...subcategory, links: [...subcategory.links, link] }
              : subcategory,
          ),
        },
  )
}

export function updateLink(
  config: Config,
  categoryId: string,
  subcategoryId: string,
  linkId: string,
  patch: Partial<Pick<LinkItem, 'label' | 'url'>>,
): Config {
  return config.map((category) =>
    category.id !== categoryId
      ? category
      : {
          ...category,
          subcategories: category.subcategories.map((subcategory) =>
            subcategory.id !== subcategoryId
              ? subcategory
              : {
                  ...subcategory,
                  links: subcategory.links.map((link) =>
                    link.id === linkId ? { ...link, ...patch } : link,
                  ),
                },
          ),
        },
  )
}

export function deleteLink(
  config: Config,
  categoryId: string,
  subcategoryId: string,
  linkId: string,
): Config {
  return config.map((category) =>
    category.id !== categoryId
      ? category
      : {
          ...category,
          subcategories: category.subcategories.map((subcategory) =>
            subcategory.id !== subcategoryId
              ? subcategory
              : { ...subcategory, links: subcategory.links.filter((l) => l.id !== linkId) },
          ),
        },
  )
}
