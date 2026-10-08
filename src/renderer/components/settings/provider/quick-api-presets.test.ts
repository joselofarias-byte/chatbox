import { describe, expect, it } from 'vitest'
import { QUICK_API_PRESETS, buildQuickApiProviderPatch } from './quick-api-presets'

const getPreset = (id: string) => {
  const preset = QUICK_API_PRESETS.find((p) => p.id === id)
  if (!preset) throw new Error('Missing preset: ' + id)
  return preset
}

describe('quick API provider presets', () => {
  it('lists our known free / experimental endpoints separately from built-in providers', () => {
    expect(getPreset('unorouter').apiHost).toBe('https://api.unorouter.com/v1')
    expect(getPreset('aihubmix').apiHost).toBe('https://aihubmix.com/v1')
    expect(getPreset('apinex').category).toBe('experimental')
    expect(getPreset('kira-vn').category).toBe('experimental')
    expect(getPreset('9router-local').defaultModel).toBe('free-best')
  })

  it('creates one custom provider with its endpoint and initial model', () => {
    const patch = buildQuickApiProviderPatch({
      preset: getPreset('unorouter'),
      apiKey: ' secret-test ',
      providers: {},
      customProviders: [],
    })
    expect(patch.customProviders).toHaveLength(1)
    expect(patch.customProviders?.[0].id).toBe('custom-provider-jolufa-unorouter')
    expect(patch.providers?.['custom-provider-jolufa-unorouter']).toMatchObject({
      apiHost: 'https://api.unorouter.com/v1',
      apiKey: 'secret-test',
      models: [{ modelId: 'qwen3.8-27b:free' }],
    })
  })

  it('reuses an existing custom preset without duplicating it or dropping models', () => {
    const first = buildQuickApiProviderPatch({
      preset: getPreset('aihubmix'),
      apiKey: 'old-key',
      providers: {},
      customProviders: [],
    })
    const next = buildQuickApiProviderPatch({
      preset: getPreset('aihubmix'),
      apiKey: 'new-key',
      providers: first.providers,
      customProviders: first.customProviders,
    })
    expect(next.customProviders).toHaveLength(1)
    expect(next.providers?.['custom-provider-jolufa-aihubmix']?.apiKey).toBe('new-key')
    expect(next.providers?.['custom-provider-jolufa-aihubmix']?.models).toHaveLength(1)
  })

  it('updates a built-in key without creating fake custom providers', () => {
    const patch = buildQuickApiProviderPatch({
      preset: getPreset('groq'),
      apiKey: 'abc',
      providers: { groq: { models: [{ modelId: 'some-model' }] } },
      customProviders: [],
    })
    expect(patch.customProviders).toBeUndefined()
    expect(patch.providers?.groq?.models?.[0].modelId).toBe('some-model')
  })

  it('imports only local router model IDs without erasing existing models', () => {
    const preset = getPreset('9router-local')
    const original = { modelId: 'special-model', nickname: 'My configured model' }
    const patch = buildQuickApiProviderPatch({
      preset,
      apiKey: 'my-router-key',
      providers: {
        [preset.providerId]: { models: [original] },
      },
      customProviders: [],
      discoveredModels: ['special-model', 'free-best', 'unorouter-personal/qwen3.8-27b:free'],
    })
    expect(patch.providers?.[preset.providerId]?.models).toEqual([
      original,
      { modelId: 'free-best' },
      { modelId: 'unorouter-personal/qwen3.8-27b:free' },
    ])
    expect(patch.providers?.[preset.providerId]?.apiKey).toBe('my-router-key')
  })

  it('refuses blank keys and collisions with different custom providers', () => {
    expect(() => buildQuickApiProviderPatch({
      preset: getPreset('openrouter'),
      apiKey: ' ',
      providers: {},
      customProviders: [],
    })).toThrow('API key')
    expect(() => buildQuickApiProviderPatch({
      preset: getPreset('unorouter'),
      apiKey: 'key',
      providers: {},
      customProviders: [
        { id: 'custom-provider-jolufa-unorouter', name: 'Somebody else', isCustom: true, type: 'openai' as never },
      ],
    })).toThrow('identificador')
  })
})
