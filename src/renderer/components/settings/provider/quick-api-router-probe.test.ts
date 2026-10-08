import { describe, expect, it, vi } from 'vitest'
import { buildLocalRouterModelsURL, readConnectedRouterModels } from './quick-api-router-probe'

describe('9router local client connection', () => {
  it('only probes loopback without embedding the API key in the URL', async () => {
    const get = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      mode: 'connected', connections: 3,
      data: [
        { id: 'free-best' },
        { id: 'unorouter-personal/qwen3.8-27b:free' },
        { id: 'free-best' },
      ],
    })))
    const result = await readConnectedRouterModels('http://127.0.0.1:20130/v1', ' secret ', get)
    expect(result).toEqual({
      models: ['free-best', 'unorouter-personal/qwen3.8-27b:free'],
      connectionCount: 3,
    })
    expect(get).toHaveBeenCalledWith('http://127.0.0.1:20130/v1/models?scope=connected',
      { Authorization: 'Bearer secret' }, { retry: 0, useProxy: true })
    expect(get.mock.calls[0][0]).not.toContain('secret')
  })

  it('rejects non-loopback destinations before sending secrets', () => {
    for (const url of [
      'https://untrusted.example/v1',
      'http://192.168.1.2:20130/v1',
      'http://127.0.0.1:20130/not-v1',
      'http://secret:pass@localhost:20130/v1',
      'file:///tmp/v1',
    ]) {
      expect(() => buildLocalRouterModelsURL(url)).toThrow()
    }
  })

  it('rejects a full-catalog response, never presenting it as connected models', async () => {
    const get = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      mode: 'catalog', data: [{ id: 'paid-model' }],
    })))
    await expect(readConnectedRouterModels('http://localhost:20130/v1', 'key', get))
      .rejects.toThrow('no confirmó')
  })

  it('ignores malformed model IDs and preserves valid ones', async () => {
    const get = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      mode: 'connected', connections: 0, data: [null, {}, { id: '' }, { id: 'free-best' }],
    })))
    const result = await readConnectedRouterModels('http://127.0.0.1:20130/v1', 'key', get)
    expect(result.models).toEqual(['free-best'])
  })
})
