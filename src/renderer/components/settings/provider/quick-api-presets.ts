import { ModelProviderType, type Settings } from '@shared/types'

/** Catalog of connection shortcuts, not a list of verified/free API credits. */
export type QuickApiPreset = {
  id: string
  name: string
  providerId: string
  apiHost?: string
  defaultModel?: string
  category: 'existing' | 'catalog' | 'experimental' | 'local'
  notes: string
  website: string
}

export const QUICK_API_PRESETS: readonly QuickApiPreset[] = [
  {
    id: 'unorouter', name: 'UnoRouter', providerId: 'custom-provider-jolufa-unorouter',
    apiHost: 'https://api.unorouter.com/v1', defaultModel: 'qwen3.8-27b:free',
    category: 'catalog', website: 'https://unorouter.com/en/models?q=Free',
    notes: 'Solo IDs :free. Ruta documentada, pendiente de validar con tu clave.',
  },
  {
    id: 'aihubmix', name: 'AIHubMix', providerId: 'custom-provider-jolufa-aihubmix',
    apiHost: 'https://aihubmix.com/v1', defaultModel: 'coding-glm-5.3-flash-free',
    category: 'catalog', website: 'https://aihubmix.com/models/free',
    notes: 'Prueba inicial limitada; la cuota diaria ampliada puede requerir recarga.',
  },
  {
    id: 'apinex', name: 'APInex (experimental)', providerId: 'custom-provider-jolufa-apinex',
    apiHost: 'https://api.apinex.bond/v1', defaultModel: 'free/deepseek-v4.1-flash',
    category: 'experimental', website: 'https://apinex.bond/models',
    notes: 'Proveedor no auditado. No enviar código privado ni datos sensibles.',
  },
  {
    id: 'kira-vn', name: 'Kira AI API Vietnam (experimental)', providerId: 'custom-provider-jolufa-kira-vn',
    apiHost: 'https://kiraai.vn/api/v1', defaultModel: 'qwen3.8-flash-free',
    category: 'experimental', website: 'https://kiraai.vn/models/',
    notes: 'No es kiraai.ai. Promociones y privacidad por verificar; usar solo pruebas inocuas.',
  },
  {
    id: '9router-local', name: '9router-go (local)', providerId: 'custom-provider-jolufa-router-local',
    apiHost: 'http://127.0.0.1:20130/v1', defaultModel: 'free-best',
    category: 'local', website: 'https://github.com/joselofarias-byte/9router-go',
    notes: 'Solo si 9router-go funciona en este mismo dispositivo. Usar su clave del dashboard.',
  },
  {
    id: 'opencode-zen', name: 'OpenCode Zen', providerId: 'opencode-zen',
    category: 'existing', website: 'https://opencode.ai/docs/zen',
    notes: 'Elegí únicamente modelos Free cuando busques costo cero.',
  },
  {
    id: 'openrouter', name: 'OpenRouter', providerId: 'openrouter',
    category: 'existing', website: 'https://openrouter.ai/settings/keys',
    notes: 'Algunos modelos cuestan dinero; seleccioná explícitamente un modelo gratuito.',
  },
  {
    id: 'groq', name: 'Groq', providerId: 'groq',
    category: 'existing', website: 'https://console.groq.com/keys',
    notes: 'La gratuidad está sujeta al plan y límites de la cuenta.',
  },
  {
    id: 'gemini', name: 'Google Gemini API', providerId: 'gemini',
    category: 'existing', website: 'https://aistudio.google.com/apikey',
    notes: 'Una suscripción de Gemini no es una API key; revisar límites y facturación.',
  },
  {
    id: 'experiential', name: 'Experiential Labs', providerId: 'experiential',
    category: 'existing', website: 'https://platform.experientiallabs.ai/',
    notes: 'Incluido en nuestro fork; consultar los modelos disponibles con tu clave.',
  },
  {
    id: 'openai', name: 'OpenAI API', providerId: 'openai',
    category: 'existing', website: 'https://platform.openai.com/api-keys',
    notes: 'La API se factura por separado de las suscripciones de ChatGPT.',
  },
]

export function buildQuickApiProviderPatch(params: {
  preset: QuickApiPreset
  apiKey: string
  modelId?: string
  providers: Settings['providers'] | undefined
  customProviders: Settings['customProviders'] | undefined
}): Partial<Settings> {
  const { preset, providers, customProviders } = params
  const apiKey = params.apiKey.trim()
  if (!apiKey) throw new Error('La API key no puede estar vacía.')
  const current = providers?.[preset.providerId] ?? {}
  const known = QUICK_API_PRESETS.find((p) => p.id === preset.id)
  if (!known || known.providerId !== preset.providerId) throw new Error('Proveedor desconocido.')
  const modelId = (params.modelId ?? preset.defaultModel ?? '').trim()
  const custom = Boolean(preset.apiHost)
  if (custom && !modelId) throw new Error('El identificador del modelo es obligatorio para este proveedor.')
  const currentProviders = customProviders ?? []
  const collision = currentProviders.find((p) => p.id === preset.providerId)
  if (collision && (!collision.isCustom || collision.name !== preset.name)) {
    throw new Error('Ya existe otro proveedor usando este identificador.')
  }

  const nextSettings = {
    ...current,
    apiKey,
    ...(preset.apiHost ? { apiHost: preset.apiHost } : {}),
    ...(custom ? { models: [
      ...(current.models ?? []).filter((m) => m.modelId !== modelId),
      { modelId },
    ] } : {}),
  }
  if (!custom) return { providers: { ...providers, [preset.providerId]: nextSettings } }

  return {
    customProviders: collision ? currentProviders : [
      ...currentProviders,
      {
        id: preset.providerId,
        name: preset.name,
        isCustom: true as const,
        type: ModelProviderType.OpenAI,
        urls: { website: preset.website },
      },
    ],
    providers: { ...providers, [preset.providerId]: nextSettings },
  }
}
