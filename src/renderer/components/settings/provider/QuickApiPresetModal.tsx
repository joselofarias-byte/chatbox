import { Anchor, Button, PasswordInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiRequest } from '@/utils/request'
import { readConnectedRouterModels } from './quick-api-router-probe'
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
  const [customModel, setCustomModel] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [checkingRouter, setCheckingRouter] = useState(false)
  const [routerApiHost, setRouterApiHost] = useState('http://127.0.0.1:20130/v1')
  const [routerModels, setRouterModels] = useState<string[] | null>(null)
  const [routerConnections, setRouterConnections] = useState<number | null>(null)
  const [importRouterModels, setImportRouterModels] = useState(true)
  const preset = QUICK_API_PRESETS.find((p) => p.id === presetId) ?? QUICK_API_PRESETS[0]

  const switchPreset = (value: string | null) => {
    if (!value) return
    setPresetId(value)
    setCustomModel(null)
    setApiKey('')
    setRouterApiHost('http://127.0.0.1:20130/v1')
    setRouterModels(null)
    setRouterConnections(null)
    setError('')
  }

  const checkLocalRouter = async () => {
    if (preset.id !== '9router-local' || !preset.apiHost || !apiKey.trim()) return
    setCheckingRouter(true)
    setRouterModels(null)
    setError('')
    try {
      const result = await readConnectedRouterModels(routerApiHost, apiKey, apiRequest.get)
      setRouterModels(result.models)
      setRouterConnections(result.connectionCount)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      if (/401|403|Unauthorized/i.test(message)) {
        setError('El router rechazó la clave de cliente. Verificá tu clave en 9router-go → Endpoint.')
      } else {
        setError('No se pudo consultar el router local: ' + message.slice(0, 240))
      }
    } finally {
      setCheckingRouter(false)
    }
  }

  const save = () => {
    try {
      const patch = buildQuickApiProviderPatch({
        preset,
        apiKey,
        modelId: customModel === null ? preset.defaultModel : customModel,
        apiHostOverride: preset.id === '9router-local' ? routerApiHost : undefined,
        discoveredModels: preset.id === '9router-local' && importRouterModels ? routerModels ?? [] : [],
        providers:
        customProviders,
      })
      setSettings(patch)
      setApiKey('')
      setCustomModel(null)
      setRouterModels(null)
      setRouterConnections(null)
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
          onChange={(e) => { setApiKey(e.currentTarget.value); setRouterModels(null); setRouterConnections(null) }}
        />
        {preset.apiHost && (
          <TextInput
            label={t('Modelo inicial')}
            description={t('Opcional cambiarlo; verificá el ID gratuito en el catálogo.')}
            value={customModel ?? preset.defaultModel ?? ''}
            onChange={(e) => setCustomModel(e.currentTarget.value)}
          />
        )}
        {preset.id === '9router-local' && (
          <Stack gap="xs">
            <TextInput
              label="Endpoint local de 9router"
              description="20130 es el habitual; usá 20131 para probar otra instancia sin reemplazar la estable."
              value={routerApiHost}
              onChange={(e) => { setRouterApiHost(e.currentTarget.value); setRouterModels(null); setRouterConnections(null) }}
            />
            <Text size="xs" c="dimmed">
              Solo necesitás la clave de cliente generada en 9router-go → Endpoint; las claves de los demás proveedores quedan allí.
            </Text>
            <Button variant="light" loading={checkingRouter} disabled={!apiKey.trim()} onClick={checkLocalRouter}>
              Comprobar router y consultar modelos (sin inferencia)
            </Button>
            {routerModels && (
              <>
                <Text size="xs" c="dimmed">
                  Router accesible. {routerConnections ?? 'Sin dato de'} conexiones activas, {routerModels.length} modelos anunciados.
                </Text>
                <Text size="xs" c="dimmed">
                  Los modelos anunciados no están necesariamente probados ni garantizados como gratuitos.
                </Text>
                <label className="text-sm">
                  <input type="checkbox" checked={importRouterModels} onChange={(e) => setImportRouterModels(e.currentTarget.checked)} />
                  {' '}Agregar los modelos anunciados a Chatbox al guardar
                </label>
              </>
            )}
          </Stack>
        )}
        <Text size="xs" c="dimmed">{preset.notes}</Text>
        {preset.apiHost && preset.id !== '9router-local' &&
          <Text size="xs" c="dimmed">Endpoint: {preset.apiHost}</Text>}
        <Anchor href={preset.website} target="_blank" rel="noreferrer" size="sm">
          {t('Ver sitio y obtener clave')}
        </Anchor>
        {error && <Text role="alert" c="red" size="sm">{error}</Text>}
        <Text size="xs" c="dimmed">
          {t('Guardar no consume tokens ni verifica la conexión. Probá el modelo desde su configuración. Las claves nunca se guardan en el repositorio.')}
        </Text>
        <AdaptiveModal.Actions>
          <AdaptiveModal.CloseButton onClick={() => { setApiKey(''); setRouterModels(null); setRouterConnections(null); setError(''); onClose() }} />
          <Button onClick={save} disabled={!apiKey.trim()}>{t('Guardar conexión')}</Button>
        </AdaptiveModal.Actions>
      </Stack>
    </AdaptiveModal>
  )
}
