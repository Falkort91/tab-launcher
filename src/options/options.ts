import {
  addCategory,
  addLink,
  addSubcategory,
  deleteCategory,
  deleteLink,
  deleteSubcategory,
  updateCategory,
  updateLink,
  updateSubcategory,
} from '../lib/config'
import { parseConfig, serializeConfig } from '../lib/importExport'
import { getConfig, saveConfig } from '../lib/storage'
import { TAB_GROUP_COLOR_HEX, TAB_GROUP_COLORS } from '../lib/tabGroupColors'
import type { Category, Config, LinkItem, Subcategory } from '../lib/types'

const app = document.querySelector<HTMLDivElement>('#app')

let config: Config = []
let selectedCategoryId: string | null = null

async function persist(next: Config): Promise<void> {
  config = next
  await saveConfig(config)
  render()
}

function render(): void {
  if (!app) return
  app.innerHTML = ''

  const header = document.createElement('div')
  header.className = 'page-header'

  const title = document.createElement('span')
  title.className = 'page-title'
  title.textContent = 'Tab Launcher'
  header.append(title)

  const toolbar = document.createElement('div')
  toolbar.className = 'toolbar'
  toolbar.append(renderExportButton(), renderImportButton())
  header.append(toolbar)

  app.append(header)

  const layout = document.createElement('div')
  layout.className = 'layout'
  layout.append(renderSidebar(), renderDetail())
  app.append(layout)
}

function renderSidebar(): HTMLElement {
  const sidebar = document.createElement('div')
  sidebar.className = 'sidebar'

  const list = document.createElement('ul')
  for (const category of config) {
    const item = document.createElement('li')
    const button = document.createElement('button')
    button.textContent = category.name
    button.className = category.id === selectedCategoryId ? 'selected' : ''
    button.addEventListener('click', () => {
      selectedCategoryId = category.id
      render()
    })
    item.append(button)
    list.append(item)
  }
  sidebar.append(list)

  const addForm = document.createElement('form')
  addForm.className = 'add-row'
  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = 'Nouvelle catégorie'
  input.required = true
  const submit = document.createElement('button')
  submit.type = 'submit'
  submit.textContent = '+'
  addForm.append(input, submit)
  addForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const name = input.value.trim()
    if (!name) return
    void persist(addCategory(config, name))
  })
  sidebar.append(addForm)

  return sidebar
}

function renderDetail(): HTMLElement {
  const detail = document.createElement('div')
  detail.className = 'detail'

  const category = config.find((c) => c.id === selectedCategoryId)
  if (!category) {
    const empty = document.createElement('div')
    empty.className = 'empty-state'
    empty.textContent = 'Sélectionne une catégorie à gauche, ou crée-en une nouvelle.'
    detail.append(empty)
    return detail
  }

  detail.append(renderCategoryHeader(category))

  for (const subcategory of category.subcategories) {
    detail.append(renderSubcategory(category.id, subcategory))
  }

  detail.append(renderAddSubcategoryForm(category.id))

  return detail
}

function renderCategoryHeader(category: Category): HTMLElement {
  const header = document.createElement('div')
  header.className = 'detail-header'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.className = 'category-name'
  nameInput.value = category.name
  nameInput.addEventListener('change', () => {
    const name = nameInput.value.trim()
    if (!name) {
      render()
      return
    }
    void persist(updateCategory(config, category.id, { name }))
  })

  const deleteButton = document.createElement('button')
  deleteButton.textContent = 'Supprimer la catégorie'
  deleteButton.className = 'delete-button'
  deleteButton.addEventListener('click', () => {
    if (!confirm(`Supprimer "${category.name}" et tout son contenu ?`)) return
    selectedCategoryId = null
    void persist(deleteCategory(config, category.id))
  })

  header.append(nameInput, deleteButton)
  return header
}

function renderSubcategory(categoryId: string, subcategory: Subcategory): HTMLElement {
  const section = document.createElement('section')
  section.className = 'subcategory'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.value = subcategory.name
  nameInput.addEventListener('change', () => {
    const name = nameInput.value.trim()
    if (!name) {
      render()
      return
    }
    void persist(updateSubcategory(config, categoryId, subcategory.id, { name }))
  })

  const colorSwatches = document.createElement('div')
  colorSwatches.className = 'color-swatches'
  for (const color of TAB_GROUP_COLORS) {
    const swatch = document.createElement('button')
    swatch.type = 'button'
    swatch.className = color === subcategory.color ? 'color-swatch selected' : 'color-swatch'
    swatch.style.background = TAB_GROUP_COLOR_HEX[color]
    swatch.title = color
    swatch.addEventListener('click', () => {
      void persist(updateSubcategory(config, categoryId, subcategory.id, { color }))
    })
    colorSwatches.append(swatch)
  }

  const deleteButton = document.createElement('button')
  deleteButton.textContent = 'Supprimer'
  deleteButton.className = 'delete-button'
  deleteButton.addEventListener('click', () => {
    if (!confirm(`Supprimer "${subcategory.name}" et ses liens ?`)) return
    void persist(deleteSubcategory(config, categoryId, subcategory.id))
  })

  const header = document.createElement('div')
  header.className = 'subcategory-header'
  header.append(nameInput, colorSwatches, deleteButton)
  section.append(header)

  const linkList = document.createElement('ul')
  linkList.className = 'link-list'
  for (const link of subcategory.links) {
    linkList.append(renderLink(categoryId, subcategory.id, link))
  }
  section.append(linkList)

  section.append(renderAddLinkForm(categoryId, subcategory.id))

  return section
}

function renderLink(categoryId: string, subcategoryId: string, link: LinkItem): HTMLElement {
  const item = document.createElement('li')

  const labelInput = document.createElement('input')
  labelInput.type = 'text'
  labelInput.value = link.label
  labelInput.addEventListener('change', () => {
    const label = labelInput.value.trim()
    if (!label) {
      render()
      return
    }
    void persist(updateLink(config, categoryId, subcategoryId, link.id, { label }))
  })

  const urlInput = document.createElement('input')
  urlInput.type = 'url'
  urlInput.value = link.url
  urlInput.addEventListener('change', () => {
    const url = urlInput.value.trim()
    if (!url) {
      render()
      return
    }
    void persist(updateLink(config, categoryId, subcategoryId, link.id, { url }))
  })

  const deleteButton = document.createElement('button')
  deleteButton.textContent = '✕'
  deleteButton.className = 'delete-button'
  deleteButton.addEventListener('click', () => {
    void persist(deleteLink(config, categoryId, subcategoryId, link.id))
  })

  item.append(labelInput, urlInput, deleteButton)
  return item
}

function renderAddSubcategoryForm(categoryId: string): HTMLElement {
  const form = document.createElement('form')
  form.className = 'add-row'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.placeholder = 'Nouvelle sous-catégorie'
  nameInput.required = true

  const submit = document.createElement('button')
  submit.type = 'submit'
  submit.textContent = '+ sous-catégorie'

  form.append(nameInput, submit)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const name = nameInput.value.trim()
    if (!name) return
    void persist(addSubcategory(config, categoryId, { name, color: 'grey' }))
  })

  return form
}

function renderAddLinkForm(categoryId: string, subcategoryId: string): HTMLElement {
  const form = document.createElement('form')
  form.className = 'add-row'

  const labelInput = document.createElement('input')
  labelInput.type = 'text'
  labelInput.placeholder = 'Nom du lien'
  labelInput.required = true

  const urlInput = document.createElement('input')
  urlInput.type = 'url'
  urlInput.placeholder = 'https://...'
  urlInput.required = true

  const submit = document.createElement('button')
  submit.type = 'submit'
  submit.textContent = '+ lien'

  form.append(labelInput, urlInput, submit)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const label = labelInput.value.trim()
    const url = urlInput.value.trim()
    if (!label || !url) return
    void persist(addLink(config, categoryId, subcategoryId, { label, url }))
  })

  return form
}

function renderExportButton(): HTMLElement {
  const button = document.createElement('button')
  button.textContent = 'Exporter (JSON)'
  button.addEventListener('click', () => {
    const blob = new Blob([serializeConfig(config)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tab-launcher-config.json'
    link.click()
    URL.revokeObjectURL(url)
  })
  return button
}

function renderImportButton(): HTMLElement {
  const label = document.createElement('label')
  label.className = 'import-button'
  label.textContent = 'Importer (JSON)'

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.hidden = true
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      try {
        const text = String(reader.result)
        const imported = parseConfig(text)
        if (!confirm('Remplacer la configuration actuelle par ce fichier ?')) return
        selectedCategoryId = null
        void persist(imported)
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Import impossible.')
      }
    })
    reader.readAsText(file)
    input.value = ''
  })

  label.append(input)
  return label
}

async function init(): Promise<void> {
  config = await getConfig()
  render()
}

void init()
