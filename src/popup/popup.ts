import { TAB_GROUP_COLOR_HEX } from '../lib/tabGroupColors'
import { getConfig } from '../lib/storage'
import { openTabGroup } from '../lib/tabGroups'
import type { Category, Subcategory } from '../lib/types'

const app = document.querySelector<HTMLDivElement>('#app')

function renderCategories(categories: Category[]): void {
  if (!app) return
  app.innerHTML = ''

  const header = document.createElement('div')
  header.className = 'header'
  const wordmark = document.createElement('span')
  wordmark.className = 'wordmark'
  wordmark.textContent = 'Tab Launcher'
  header.append(wordmark, renderSettingsButton())
  app.append(header)

  if (categories.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'empty-state'
    empty.textContent = 'Aucune catégorie configurée.'
    app.append(empty)
    return
  }

  const list = document.createElement('ul')
  list.className = 'category-list'

  for (const category of categories) {
    const item = document.createElement('li')
    const button = document.createElement('button')
    button.className = 'row'

    const label = document.createElement('span')
    label.className = 'row-label'
    label.textContent = category.name

    const chevron = document.createElement('span')
    chevron.className = 'row-chevron'
    chevron.textContent = '›'

    button.append(label, chevron)
    button.addEventListener('click', () => renderSubcategories(category))
    item.append(button)
    list.append(item)
  }

  app.append(list)
}

function renderSubcategories(category: Category): void {
  if (!app) return
  app.innerHTML = ''

  const header = document.createElement('div')
  header.className = 'header'

  const back = document.createElement('button')
  back.className = 'back-button'
  back.textContent = '‹'
  back.addEventListener('click', () => {
    void loadAndRender()
  })

  const title = document.createElement('span')
  title.className = 'header-title'
  title.textContent = category.name

  header.append(back, title)
  app.append(header)

  const list = document.createElement('ul')
  list.className = 'subcategory-list'

  for (const subcategory of category.subcategories) {
    const item = document.createElement('li')
    const button = document.createElement('button')
    button.className = 'row'

    const dot = document.createElement('span')
    dot.className = 'dot'
    dot.style.background = TAB_GROUP_COLOR_HEX[subcategory.color]

    const label = document.createElement('span')
    label.className = 'row-label'
    label.textContent = subcategory.name

    const meta = document.createElement('span')
    meta.className = 'row-meta'
    meta.textContent = `${subcategory.links.length} lien${subcategory.links.length > 1 ? 's' : ''}`

    button.append(dot, label, meta)
    button.addEventListener('click', () => {
      void handleOpenTabGroup(subcategory)
    })
    item.append(button)
    list.append(item)
  }

  app.append(list)
}

async function handleOpenTabGroup(subcategory: Subcategory): Promise<void> {
  try {
    await openTabGroup(subcategory)
  } catch (error) {
    console.error('[tab-launcher] failed to open tab group', error)
    alert("Impossible d'ouvrir ce groupe d'onglets. Réessaie.")
    return
  }
  window.close()
}

const SETTINGS_ICON_SVG = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </g>
  </svg>
`.trim()

function renderSettingsButton(): HTMLElement {
  const button = document.createElement('button')
  button.className = 'settings-button'
  button.type = 'button'
  button.title = 'Gérer les catégories'

  const icon = document.createElement('span')
  icon.className = 'settings-button-icon'
  icon.innerHTML = SETTINGS_ICON_SVG

  const label = document.createElement('span')
  label.textContent = 'Gérer'

  button.append(icon, label)
  button.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })
  return button
}

async function loadAndRender(): Promise<void> {
  const categories = await getConfig()
  renderCategories(categories)
}

void loadAndRender()
