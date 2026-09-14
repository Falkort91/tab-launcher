import { suggestGroupMeta } from '../lib/ai'
import { AI_PROVIDERS, AI_PROVIDER_INFO, clearAiSettings, getAiSettings, saveAiSettings } from '../lib/aiSettings'
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
import type { AiProvider, AiSettings } from '../lib/aiSettings'
import type { Category, Config, LinkItem, Subcategory } from '../lib/types'

const app = document.querySelector<HTMLDivElement>('#app')

let config: Config = []
let selectedCategoryId: string | null = null
let aiSettings: AiSettings | null = null
let aiPanelOpen = false

// Les trois fournisseurs préfixent leurs clés API différemment — assez
// distinctement pour présélectionner le bon fournisseur dès que l'utilisateur
// colle sa clé, sans lui demander de cliquer sur un bouton au préalable. Le
// préfixe générique 'sk-' d'OpenAI est vérifié en dernier pour ne pas
// intercepter les clés Anthropic/OpenRouter, plus spécifiques.
function detectProviderFromKey(key: string): AiProvider | null {
  const trimmed = key.trim()
  if (trimmed.startsWith('sk-ant-')) return 'anthropic'
  if (trimmed.startsWith('sk-or-')) return 'openrouter'
  if (trimmed.startsWith('sk-')) return 'openai'
  return null
}

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
  toolbar.append(renderExportButton(), renderImportButton(), renderAiKeyButton())
  header.append(toolbar)

  app.append(header)

  if (aiPanelOpen) {
    app.append(renderAiSettingsPanel())
  }

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
    // Adressable depuis le champ de nom dans le panneau de détail, pour le
    // synchroniser en temps réel pendant la frappe (cf. renderCategoryHeader).
    button.dataset.categoryId = category.id
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
  // Reflète la frappe dans la sidebar en direct, sans sauvegarder à chaque
  // caractère : la persistance reste sur 'change' (blur/Enter) ci-dessous.
  nameInput.addEventListener('input', () => {
    const sidebarButton = app?.querySelector<HTMLButtonElement>(`.sidebar button[data-category-id="${category.id}"]`)
    if (sidebarButton) sidebarButton.textContent = nameInput.value
  })
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

  const suggestButton = document.createElement('button')
  suggestButton.type = 'button'
  suggestButton.className = 'ai-suggest-button'
  suggestButton.textContent = '✨ Suggérer'
  suggestButton.title = "Suggérer un nom et une couleur avec l'IA, à partir des liens de cette sous-catégorie"
  suggestButton.addEventListener('click', () => {
    void handleSuggest(categoryId, subcategory, suggestButton)
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
  header.append(nameInput, suggestButton, colorSwatches, deleteButton)
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
    // Un input hors <form> ne déclenche jamais la validation HTML5 native à la
    // soumission (contrairement au formulaire d'ajout) — on la déclenche à la main.
    // Pas de render() ici : on laisse la valeur tapée visible (avec le message
    // natif du navigateur dessus) pour que l'utilisateur puisse la corriger, au
    // lieu de la faire disparaître en reconstruisant tout le DOM.
    if (!urlInput.checkValidity()) {
      urlInput.reportValidity()
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

async function handleSuggest(
  categoryId: string,
  subcategory: Subcategory,
  button: HTMLButtonElement,
): Promise<void> {
  if (!aiSettings) {
    alert(`Renseigne d'abord une clé API IA (bouton "Clé API IA" en haut de la page).`)
    return
  }
  if (subcategory.links.length === 0) {
    alert('Ajoute au moins un lien avant de demander une suggestion.')
    return
  }

  // Pas de render() pendant l'appel : on désactive juste le bouton concerné, pour
  // ne pas perdre le focus/la saisie en cours ailleurs dans le formulaire pendant
  // l'attente réseau.
  const originalText = button.textContent
  button.disabled = true
  button.textContent = '…'

  try {
    const suggestion = await suggestGroupMeta(aiSettings, subcategory.links)
    await persist(
      updateSubcategory(config, categoryId, subcategory.id, {
        name: suggestion.name,
        color: suggestion.color,
      }),
    )
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Suggestion IA impossible.')
    button.disabled = false
    button.textContent = originalText
  }
}

function renderAiKeyButton(): HTMLElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = aiSettings ? `Clé API IA (${AI_PROVIDER_INFO[aiSettings.provider].label}) ✓` : 'Clé API IA'
  button.title = 'Fournisseur et clé API utilisés pour la suggestion de nom/couleur par IA'
  button.addEventListener('click', () => {
    aiPanelOpen = !aiPanelOpen
    render()
  })
  return button
}

function renderAiSettingsPanel(): HTMLElement {
  const panel = document.createElement('div')
  panel.className = 'ai-settings-panel'

  const title = document.createElement('div')
  title.className = 'ai-settings-title'
  title.textContent = 'Clé API IA'
  panel.append(title)

  let selectedProvider: AiProvider = aiSettings?.provider ?? 'openrouter'

  const providerRow = document.createElement('div')
  providerRow.className = 'ai-provider-choices'

  const keyInput = document.createElement('input')
  keyInput.type = 'password'
  keyInput.autocomplete = 'off'
  keyInput.placeholder = 'Colle ta clé API (le fournisseur est détecté automatiquement)'
  keyInput.value = aiSettings?.apiKey ?? ''

  const keyHint = document.createElement('a')
  keyHint.className = 'ai-key-hint'
  keyHint.target = '_blank'
  keyHint.rel = 'noopener noreferrer'

  function updateHint(): void {
    const info = AI_PROVIDER_INFO[selectedProvider]
    keyHint.href = info.keyUrl
    keyHint.textContent = `Obtenir une clé ${info.label} →`
  }

  function selectProvider(provider: AiProvider, resetKeyField: boolean): void {
    selectedProvider = provider
    for (const btn of providerRow.querySelectorAll('button')) {
      btn.classList.toggle('selected', btn.dataset.provider === provider)
    }
    updateHint()
    if (resetKeyField) {
      keyInput.value = aiSettings?.provider === provider ? aiSettings.apiKey : ''
    }
  }

  for (const provider of AI_PROVIDERS) {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.provider = provider
    button.className = provider === selectedProvider ? 'ai-provider-button selected' : 'ai-provider-button'
    button.textContent = AI_PROVIDER_INFO[provider].label
    // Sélection manuelle explicite : contrairement à la détection automatique
    // ci-dessous, on peut ici se permettre d'écraser le champ clé avec celle
    // déjà enregistrée pour ce fournisseur (ou vide), l'utilisateur choisit
    // sciemment de changer de fournisseur.
    button.addEventListener('click', () => selectProvider(provider, true))
    providerRow.append(button)
  }
  updateHint()

  // Dès que la clé collée correspond à un préfixe connu, on présélectionne le
  // bon fournisseur sans toucher au champ en cours de frappe.
  keyInput.addEventListener('input', () => {
    const detected = detectProviderFromKey(keyInput.value)
    if (detected && detected !== selectedProvider) {
      selectProvider(detected, false)
    }
  })

  panel.append(providerRow, keyInput, keyHint)

  const actions = document.createElement('div')
  actions.className = 'ai-settings-actions'

  const saveButton = document.createElement('button')
  saveButton.type = 'button'
  saveButton.textContent = 'Enregistrer'
  saveButton.addEventListener('click', () => {
    void handleSaveAiSettings(selectedProvider, keyInput.value)
  })
  actions.append(saveButton)

  const cancelButton = document.createElement('button')
  cancelButton.type = 'button'
  cancelButton.textContent = 'Annuler'
  cancelButton.addEventListener('click', () => {
    aiPanelOpen = false
    render()
  })
  actions.append(cancelButton)

  if (aiSettings) {
    const clearButton = document.createElement('button')
    clearButton.type = 'button'
    clearButton.className = 'ai-clear-button'
    clearButton.textContent = 'Supprimer la clé'
    clearButton.addEventListener('click', () => {
      void handleClearAiSettings()
    })
    actions.append(clearButton)
  }

  panel.append(actions)
  return panel
}

async function handleSaveAiSettings(provider: AiProvider, apiKeyRaw: string): Promise<void> {
  const trimmed = apiKeyRaw.trim()
  if (!trimmed) {
    alert('Renseigne une clé API, ou clique sur "Annuler".')
    return
  }
  aiSettings = { provider, apiKey: trimmed }
  await saveAiSettings(aiSettings)
  aiPanelOpen = false
  render()
}

async function handleClearAiSettings(): Promise<void> {
  await clearAiSettings()
  aiSettings = null
  aiPanelOpen = false
  render()
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
  const [loadedConfig, loadedAiSettings] = await Promise.all([getConfig(), getAiSettings()])
  config = loadedConfig
  aiSettings = loadedAiSettings
  render()
}

void init()
