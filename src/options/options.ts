import { addCategory, deleteCategory, updateCategory } from '../lib/config'
import { getConfig, saveConfig } from '../lib/storage'
import type { Category, Config } from '../lib/types'

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

async function init(): Promise<void> {
  config = await getConfig()
  render()
}

void init()
