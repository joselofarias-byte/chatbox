import { Anchor, Button, PasswordInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdaptiveModal } from '@/components/common/AdaptiveModal'
import { useSettingsStore } from '@/stores/settingsStore'
import { buildQuickApiProviderPatch, QUICK_API_PRESETS } from './quick-api-presets'

type Props = { opened: boolean; onClose: () => void }

export function QuickApiPresetModal({ opened, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setSettings = useSettingsStore((s) => s.setSettings)
  const providers = useSettingsStore((s) => s.providers)
  const customProviders = useSettingsStore((s) => s.customProviders)
  const [presetId, setPresetId] = useState('unorouter')
  const [apiKey, setApiKey] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [error, setError] = useState('')
  const preset = QUICK_API_PRESETS.find((p) => p.id === presetId) ?? QUICK_API_PRESETS[0]

  const switchPreset = (value: string | null) => {
    if (!value) return
    setPresetId(value)
    setCustomModel('')
    setError('')
  }

  const save = () => {
    try {
      const patch = buildQuickApiProviderPatch({
        preset,
        apiKey,
        modelId: customModel || preset.defaultModel,
        providers,
        customProviders,
      })
      setSettings(patch)
      setApiKey('')
      setCustomModel('')
      setError('')
      onClose()
      navigate({ to: '/settings/provider/$providerId', params: { providerId: preset.providerId } })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  return (
    <AdaptiveModal opened={opened} onClose={onClose} centered size="md" title={t('Conexión rápida de APIs')}>
      <Stack gap="sm">
        <Text size="sm">
          {t('Elegí un proveedor y pegá su clave. El endpoint ya está configurado.')}
        </Text>
        <Select
          label={t('Proveedor')}
          data={QUICK_API_PRESETS.map((p) => ({
            value: p.id,
            label: p.name + (p.category === 'experimental' ? ' ⚠' : ''),
          }))}
          value={presetId}
          onChange={switchPreset}
          searchable
        />
        <PasswordInput
          label="API key"
          placeholder={t('Pegá tu clave aquí')}
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.currentTarget.value)}
        />
        {preset.apiHost && (
          <TextInput
            label={t('Modelo inicial')}
            description={t('Opcional cambiarlo; verificá el ID gratuito en el catálogo.')}
            value={customModel || preset.defaultModel || ''}
            onChange={(e) => setCustomModel(e.currentTarget.value)}
          />
        )}
        <Text size="xs" c="dimmed">{preset.notes}</Text>
        {preset.apiHost && <Text size="xs" c="dimmed">Endpoint: {preset.apiHost}</Text>}
        <Anchor href={preset.website} target="_blank" rel="noreferrer" size="sm">
          {t('Ver sitio y obtener clave')}
        </Anchor>
        {error && <Text role="alert" c="red" size="sm">{error}</Text>}
        <Text size="xs" c="dimmed">
          {t('Guardar no consume tokens ni verifica la conexión. Probá el modelo desde su configuración. Las claves nunca se guardan en el repositorio.')}
        </Text>
        <AdaptiveModal.Actions>
          <AdaptiveModal.CloseButton onClick={() => { setApiKey(''); setError(''); onClose() }} />
          <Button onClick={save} disabled={!apiKey.trim()}>{t('Guardar conexión')}</Button>
        </AdaptiveModal.Actions>
      </Stack>
    </AdaptiveModal>
  )
}
