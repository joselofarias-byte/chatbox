/**
 * Non-billable 9router connectivity check.
 * GET /v1/models?scope=connected reads advertised IDs only; it is NOT proof
 * of successful inference, account quota, or a model being free.
 */
export type RouterCatalogResponse = {
  models: string[]
  connectionCount: number | null
}

export type RouterReadRequester = (
  url: string,
  headers: Record<string, string>,
  options: { retry: number; useProxy: boolean }
) => Promise<Response>

const MAX_MODELS_TO_IMPORT = 2000

/** Do not probe any arbitrary host with the user's router API key. */
export function buildLocalRouterModelsURL(baseUrl: string): string {
  let url: URL
  try {
    url = new URL(baseUrl)
  } catch {
    throw new Error('Endpoint local de 9router inválido.')
  }
  if (
    url.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost'].includes(url.hostname) ||
    !url.port ||
    url.pathname.replace(/\/+$/, '') !== '/v1' ||
    url.username || url.password || url.search || url.hash
  ) {
    throw new Error('La comprobación automática solo se permite con 9router local.')
  }
  url.pathname = '/v1/models'
  url.searchParams.set('scope', 'connected')
  return url.toString()
}

export async function readConnectedRouterModels(
  baseUrl: string,
  apiKey: string,
  request: RouterReadRequester
): Promise<RouterCatalogResponse> {
  if (!apiKey.trim()) throw new Error('Pegá primero la clave de cliente de 9router.')
  const url = buildLocalRouterModelsURL(baseUrl)
  const response = await request(url, { Authorization: 'Bearer ' + apiKey.trim() }, {
    retry: 0,
    useProxy: true,
  })
  if (!response.ok) throw new Error('9router respondió HTTP ' + response.status)
  const payload: unknown = await response.json()
  if (!payload || typeof payload !== 'object') throw new Error('9router devolvió una respuesta no reconocida.')
  const data = payload as Record<string, unknown>
  if (data.mode !== 'connected' || !Array.isArray(data.data)) {
    throw new Error('9router no confirmó el listado de modelos conectados.')
  }

  const found: string[] = []
  const seen = new Set<string>()
  for (const item of data.data) {
    if (!item || typeof item !== 'object') continue
    const id = (item as { id?: unknown }).id
    if (typeof id !== 'string' || !id || id.length > 256 || seen.has(id)) continue
    seen.add(id)
    found.push(id)
    if (found.length >= MAX_MODELS_TO_IMPORT) break
  }

  return {
    models: found,
    connectionCount: typeof data.connections === 'number' && Number.isInteger(data.connections) && data.connections >= 0
      ? data.connections
      : null,
  }
}
