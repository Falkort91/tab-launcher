import type { AiSettings } from './aiSettings'
import { TAB_GROUP_COLORS } from './tabGroupColors'
import type { LinkItem, TabGroupColor } from './types'

export interface GroupSuggestion {
  name: string
  color: TabGroupColor
}

// Schéma JSON partagé pour contraindre la réponse du modèle : la couleur est
// un enum strict sur notre palette Chrome, pas un texte libre à réinterpréter
// après coup. Passé en Structured Outputs à OpenAI/OpenRouter, et comme
// input_schema d'un appel d'outil forcé à Anthropic (cf. callAnthropic).
const SUGGESTION_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Nom court du groupe, 2 à 4 mots, en français.' },
    color: { type: 'string', enum: TAB_GROUP_COLORS },
  },
  required: ['name', 'color'],
  additionalProperties: false,
} as const

// Nom de l'outil forcé côté Anthropic (voir callAnthropic) — un identifiant
// technique, pas un texte affiché.
const SUGGESTION_TOOL_NAME = 'set_group_suggestion'

/**
 * Demande à un LLM un nom court et une couleur pour un groupe d'onglets, à
 * partir des liens qui le composent — la clé API est celle de l'utilisateur,
 * saisie et stockée localement (voir aiSettings.ts), envoyée directement du
 * navigateur au fournisseur choisi, sans passer par un backend. C'est le
 * modèle "bring your own key" utilisé par la plupart des extensions qui
 * appellent un LLM pour le compte de leur utilisateur — acceptable ici car la
 * clé ne quitte jamais la machine de son propriétaire (pas d'export, pas de
 * télémétrie), mais à proscrire pour une clé partagée entre plusieurs
 * utilisateurs.
 */
export async function suggestGroupMeta(settings: AiSettings, links: LinkItem[]): Promise<GroupSuggestion> {
  if (links.length === 0) {
    throw new Error('Ajoute au moins un lien avant de demander une suggestion.')
  }

  const content = await callProvider(settings, buildPrompt(links))
  return parseSuggestion(content)
}

function buildPrompt(links: LinkItem[]): string {
  const linksSummary = links.map((link) => `- ${link.label}: ${link.url}`).join('\n')
  return [
    "Voici une liste de liens qui seront regroupés dans un même groupe d'onglets de navigateur :",
    linksSummary,
    '',
    'Propose un nom court (2 à 4 mots, en français) pour ce groupe, et une couleur qui reflète son',
    "thème dominant (ex : blue/cyan pour du contenu technique ou professionnel, green pour la santé/nature/finance,",
    'red pour urgent ou alerte, yellow/orange pour créatif ou marketing, purple/pink pour design ou social).',
    "Ne choisis pas systématiquement la même couleur d'une fois à l'autre : varie-la selon le contenu réel des liens.",
    'La couleur doit être EXACTEMENT l\'un de ces mots anglais, sans variante ni synonyme : ' +
      TAB_GROUP_COLORS.join(', ') +
      '.',
    'Réponds uniquement avec un objet JSON strict de la forme {"name": string, "color": string}, sans texte autour.',
  ].join('\n')
}

// Un fournisseur = un endpoint + un format de requête/réponse propre à lui —
// il n'existe pas de moyen générique d'accepter "n'importe quelle" clé IA,
// juste d'en couvrir plusieurs explicitement.
function callProvider(settings: AiSettings, prompt: string): Promise<string> {
  switch (settings.provider) {
    case 'openrouter':
      // 'openrouter/free' est le "Free Models Router" documenté par OpenRouter :
      // il sélectionne lui-même un modèle gratuit disponible, plutôt que
      // d'épingler un modèle précis qui peut être retiré du catalogue.
      return callOpenAiCompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        settings.apiKey,
        'openrouter/free',
        prompt,
      )
    case 'openai':
      // gpt-4o-mini : modèle léger/économique, à réajuster si OpenAI le retire
      // (cf. platform.openai.com/docs/models pour l'équivalent courant).
      return callOpenAiCompatible('https://api.openai.com/v1/chat/completions', settings.apiKey, 'gpt-4o-mini', prompt)
    case 'anthropic':
      return callAnthropic(settings.apiKey, prompt)
  }
}

async function callOpenAiCompatible(url: string, apiKey: string, model: string, prompt: string): Promise<string> {
  const response = await safeFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      // temperature au-dessus de la valeur par défaut : certains modèles,
      // surtout sur le tiers gratuit, convergent sinon systématiquement vers
      // la même réponse "sûre" (ex : "blue") pour ce genre de catégorisation.
      temperature: 0.9,
      // Best-effort : OpenRouter route parfois vers un modèle gratuit qui ne
      // supporte pas les Structured Outputs — dans ce cas ce paramètre est
      // silencieusement ignoré (pas d'erreur), d'où le garde-fou de parsing
      // texte + synonymes conservé côté parseSuggestion/normalizeColor.
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'group_suggestion', strict: true, schema: SUGGESTION_SCHEMA },
      },
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Réponse IA vide ou inattendue.')
  return content
}

async function callAnthropic(apiKey: string, prompt: string): Promise<string> {
  const response = await safeFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // L'API Anthropic bloque par défaut les appels venant d'un navigateur (la
      // clé serait visible dans l'onglet réseau de l'utilisateur) : ce header
      // est l'opt-in explicite qu'elle exige pour l'autoriser quand même.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      temperature: 0.9,
      // Appel d'outil forcé plutôt qu'une simple consigne texte : le modèle
      // doit renvoyer des arguments conformes à input_schema (dont l'enum de
      // couleur), il n'y a pas de "réponse libre" possible à mal interpréter.
      tools: [
        {
          name: SUGGESTION_TOOL_NAME,
          description: "Enregistre le nom et la couleur suggérés pour le groupe d'onglets.",
          input_schema: SUGGESTION_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: SUGGESTION_TOOL_NAME },
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = (await response.json()) as {
    content?: { type?: string; text?: string; input?: unknown }[]
  }

  const toolUse = data.content?.find((block) => block.type === 'tool_use')
  if (toolUse?.input) return JSON.stringify(toolUse.input)

  // Repli si le modèle répond quand même en texte libre malgré tool_choice
  // forcé : ne jamais présumer un format garanti à 100 % côté API externe.
  const textBlock = data.content?.find((block) => block.type === 'text')?.text
  if (!textBlock) throw new Error('Réponse IA vide ou inattendue.')
  return textBlock
}

async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch {
    throw new Error('Impossible de contacter le service IA (réseau, ou appel bloqué par le fournisseur depuis un navigateur).')
  }

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Clé API IA invalide ou expirée.'
        : `Appel IA échoué (code ${response.status}).`,
    )
  }

  return response
}

// Séparée de suggestGroupMeta pour être testable sans mocker fetch, et parce
// qu'un LLM entoure parfois le JSON demandé de texte ou d'un bloc ```json
// malgré la consigne de réponse stricte.
export function parseSuggestion(content: string): GroupSuggestion {
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('Réponse IA invalide (JSON introuvable).')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    throw new Error('Réponse IA invalide (JSON mal formé).')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as { name?: unknown }).name !== 'string' ||
    typeof (parsed as { color?: unknown }).color !== 'string'
  ) {
    throw new Error('Réponse IA invalide (champs manquants).')
  }

  const { name, color } = parsed as { name: string; color: string }
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error('Réponse IA invalide (nom vide).')
  }

  return { name: trimmedName, color: normalizeColor(color) }
}

// Synonymes/variantes fréquemment renvoyés par un LLM à la place du mot exact
// demandé (orthographe américaine, couleur "voisine" non listée...). Sans ce
// mapping, une réponse comme "gray" ou "navy" retombe sur 'grey' par défaut —
// silencieusement invisible sur une sous-catégorie qui est déjà grise
// (couleur par défaut à la création).
const COLOR_SYNONYMS: Record<string, TabGroupColor> = {
  gray: 'grey',
  navy: 'blue',
  indigo: 'blue',
  teal: 'cyan',
  turquoise: 'cyan',
  violet: 'purple',
  lavender: 'purple',
  magenta: 'pink',
  fuchsia: 'pink',
  rose: 'pink',
  amber: 'yellow',
  gold: 'yellow',
  lime: 'green',
  emerald: 'green',
  mint: 'green',
  crimson: 'red',
  maroon: 'red',
}

// La couleur renvoyée par le modèle est contrainte à la palette Chrome
// existante quoi qu'il réponde : chrome.tabGroups.update rejette toute valeur
// hors de son enum, mieux vaut retomber sur 'grey' qu'échouer.
function normalizeColor(rawColor: string): TabGroupColor {
  const normalized = rawColor.trim().toLowerCase().replace(/[^a-z]/g, '')

  const exactMatch = TAB_GROUP_COLORS.find((candidate) => candidate === normalized)
  if (exactMatch) return exactMatch

  const synonym = COLOR_SYNONYMS[normalized]
  if (synonym) return synonym

  console.warn(`[tab-launcher] couleur IA non reconnue ("${rawColor}"), repli sur "grey".`)
  return 'grey'
}
