import { ModelProviderEnum, ModelProviderType } from '../../types'
import { defineProvider } from '../registry'
import Experiential from './models/experiential'

const DEFAULT_MODELS = [
  {
    modelId: 'hauhaucs/qwen3.8-27b-uncensored:free',
    nickname: 'Qwen3.8 27B Uncensored (Free)',
  },
]

export const experientialProvider = defineProvider({
  id: ModelProviderEnum.Experiential,
  name: 'Experiential Labs',
  type: ModelProviderType.OpenAI,
  urls: {
    website: 'https://platform.experientiallabs.ai/',
    docs: 'https://platform.experientiallabs.ai/docs',
  },
  defaultSettings: {
    apiHost: 'https://api.experientiallabs.ai/v1',
    models: DEFAULT_MODELS,
  },
  createModel: (config) => {
    return new Experiential(
      {
        apiKey: config.effectiveApiKey,
        apiHost: config.formattedApiHost,
        model: config.model,
        temperature: config.settings.temperature,
        topP: config.settings.topP,
        maxOutputTokens: config.settings.maxTokens,
        stream: config.settings.stream,
        listModelsFallback: DEFAULT_MODELS,
      },
      config.dependencies
    )
  },
  getDisplayName: (modelId, providerSettings) => {
    return `Experiential Labs (${providerSettings?.models?.find((m) => m.modelId === modelId)?.nickname || modelId})`
  },
})
