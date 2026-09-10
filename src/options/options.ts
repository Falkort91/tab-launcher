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
import { getConfig, saveConfig } from '../lib/storage'
import type { Category, Config, LinkItem, Subcategory } from '../lib/types'

const TAB_GROUP_COLORS: chrome.tabGroups.ColorEnum[] = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
]

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
    detail.textContent = 'Sélectionne une catégorie à gauche.'
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
    void persist(updateCategory(config, category.id, { name: nameInput.value.trim() }))
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
    void persist(updateSubcategory(config, categoryId, subcategory.id, { name: nameInput.value.trim() }))
  })

  const colorSelect = document.createElement('select')
  for (const color of TAB_GROUP_COLORS) {
    const option = document.createElement('option')
    option.value = color
    option.textContent = color
    option.selected = color === subcategory.color
    colorSelect.append(option)
  }
  colorSelect.addEventListener('change', () => {
    void persist(
      updateSubcategory(config, categoryId, subcategory.id, {
        color: colorSelect.value as chrome.tabGroups.ColorEnum,
      }),
    )
  })

  const deleteButton = document.createElement('button')
  deleteButton.textContent = 'Supprimer'
  deleteButton.className = 'delete-button'
  deleteButton.addEventListener('click', () => {
    if (!confirm(`Supprimer "${subcategory.name}" et ses liens ?`)) return
    void persist(deleteSubcategory(config, categoryId, subcategory.id))
  })

  const header = document.createElement('div')
  header.className = 'subcategory-header'
  header.append(nameInput, colorSelect, deleteButton)
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
    void persist(updateLink(config, categoryId, subcategoryId, link.id, { label: labelInput.value.trim() }))
  })

  const urlInput = document.createElement('input')
  urlInput.type = 'url'
  urlInput.value = link.url
  urlInput.addEventListener('change', () => {
    void persist(updateLink(config, categoryId, subcategoryId, link.id, { url: urlInput.value.trim() }))
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

async function init(): Promise<void> {
  config = await getConfig()
  render()
}

void init()
