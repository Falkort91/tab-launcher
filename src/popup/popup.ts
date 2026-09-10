import { getConfig } from '../lib/storage'
import { openTabGroup } from '../lib/tabGroups'
import type { Category } from '../lib/types'

const app = document.querySelector<HTMLDivElement>('#app')

function renderCategories(categories: Category[]): void {
  if (!app) return
  app.innerHTML = ''

  if (categories.length === 0) {
    app.textContent = 'Aucune catégorie configurée.'
    return
  }

  const list = document.createElement('ul')
  list.className = 'category-list'

  for (const category of categories) {
    const item = document.createElement('li')
    const button = document.createElement('button')
    button.textContent = category.name
    button.addEventListener('click', () => renderSubcategories(category))
    item.append(button)
    list.append(item)
  }

  app.append(list)
}

function renderSubcategories(category: Category): void {
  if (!app) return
  app.innerHTML = ''

  const back = document.createElement('button')
  back.className = 'back-button'
  back.textContent = '← Retour'
  back.addEventListener('click', () => {
    void loadAndRender()
  })
  app.append(back)

  const list = document.createElement('ul')
  list.className = 'subcategory-list'

  for (const subcategory of category.subcategories) {
    const item = document.createElement('li')
    const button = document.createElement('button')
    button.textContent = subcategory.name
    button.addEventListener('click', () => {
      void openTabGroup(subcategory)
      window.close()
    })
    item.append(button)
    list.append(item)
  }

  app.append(list)
}

async function loadAndRender(): Promise<void> {
  const categories = await getConfig()
  renderCategories(categories)
}

void loadAndRender()
