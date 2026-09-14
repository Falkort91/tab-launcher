import { TAB_GROUP_COLORS } from './tabGroupColors'
import type { LinkItem, TabGroupColor } from './types'

const API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'openai/gpt-oss-120b:free'

export interface GroupSuggestion {
  name: string
  color: TabGroupColor
}

/**
 * Demande à un LLM (OpenRouter) un nom court et une couleur pour un groupe
 * d'onglets, à partir des liens qui le composent.
 *
 * La clé API est celle de l'utilisateur, saisie et stockée localement
 * (voir aiSettings.ts) : elle part directement du navigateur vers OpenRouter,
 * sans passer par un backend. C'est le modèle "bring your own key" utilisé
 * par la plupart des extensions de navigateur qui appellent un LLM pour le
 * compte de leur utilisateur — acceptable ici car la clé ne quitte jamais la
 * machine de son propriétaire (pas d'export, pas de télémétrie), mais à
 * proscrire pour une clé partagée entre plusieurs utilisateurs.
 */
export async function suggestGroupMeta(apiKey: string, links: LinkItem[]): Promise<GroupSuggestion> {
  if (links.length === 0) {
    throw new Error('Ajoute au moins un lien avant de demander une suggestion.')
  }

  const linksSummary = links.map((link) => `- ${link.label}: ${link.url}`).join('\n')
  const prompt = [
    "Voici une liste de liens qui seront regroupés dans un même groupe d'onglets de navigateur :",
    linksSummary,
    '',
    'Propose un nom court (2 à 4 mots, en français) pour ce groupe, et une couleur parmi exactement cette liste : ' +
      TAB_GROUP_COLORS.join(', ') +
      '.',
    'Réponds uniquement avec un objet JSON strict de la forme {"name": string, "color": string}, sans texte autour.',
  ].join('\n')

  let response: Response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } catch {
    throw new Error('Impossible de contacter le service IA (réseau).')
  }

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Clé API IA invalide ou expirée.'
        : `Appel IA échoué (code ${response.status}).`,
    )
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Réponse IA vide ou inattendue.')
  }

  return parseSuggestion(content)
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

  // La couleur renvoyée par le modèle est contrainte à la palette Chrome
  // existante quoi qu'il réponde : chrome.tabGroups.update rejette toute
  // valeur hors de son enum, mieux vaut retomber sur 'grey' qu'échouer.
  const matchedColor = TAB_GROUP_COLORS.find((candidate) => candidate === color.toLowerCase())
  return { name: trimmedName, color: matchedColor ?? 'grey' }
}
