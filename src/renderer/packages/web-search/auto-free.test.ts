import { DOMParser } from 'linkedom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SearchResult } from '@shared/types'
import WebSearch from './base'
import { AutoFreeSearch, requirePublicPageUrl } from './auto-free'

class FakeSearch extends WebSearch {
  constructor(private readonly fn: () => Promise<SearchResult>) { super() }
  async search(): Promise<SearchResult> { return this.fn() }
}

describe('AutoFreeSearch', () => {
  beforeEach(() => vi.stubGlobal('DOMParser', DOMParser))
  afterEach(() => vi.unstubAllGlobals())

  it('falls back when an engine returns empty results', async () => {
    const first = vi.fn(async () => ({ items: [] }))
    const second = vi.fn(async () => ({ items: [{ title: 'Page', link: 'https://example.com', snippet: 'Text' }] }))
    const search = new AutoFreeSearch([new FakeSearch(first), new FakeSearch(second)])
    expect((await search.search('example')).items[0]?.title).toBe('Page')
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })

  it('falls back when a provider throws', async () => {
    const search = new AutoFreeSearch([
      new FakeSearch(async () => { throw new Error('Unavailable') }),
      new FakeSearch(async () => ({ items: [{ title: 'Backup', link: 'https://example.com', snippet: '' }] })),
    ])
    expect((await search.search('fallback')).items[0]?.title).toBe('Backup')
  })

  it('reports exhausted free providers', async () => {
    const search = new AutoFreeSearch([new FakeSearch(async () => ({ items: [] }))])
    await expect(search.search('nothing')).rejects.toThrow('no results')
  })

  it('rejects private, unsafe and credentialed URLs', () => {
    for (const u of ['file:///etc/passwd', 'http://localhost:20130', 'http://127.0.0.1', 'http://192.168.1.4', 'https://user:pass@example.com', 'http://[::1]']) {
      expect(() => requirePublicPageUrl(u)).toThrow()
    }
    expect(requirePublicPageUrl('https://example.com/article').hostname).toBe('example.com')
  })

  it('reads an article locally without the paid Chatbox parser', async () => {
    const search = new AutoFreeSearch([])
    const html = '<html><head><title>Example article</title></head><body><article><h1>Example article</h1><p>' +
      'This long article covers software testing and development. '.repeat(14) + '</p></article></body></html>'
    vi.spyOn(search, 'fetch').mockResolvedValue(html as never)
    const parsed = await search.parseLink('https://example.com/article')
    expect(parsed?.url).toBe('https://example.com/article')
    expect(parsed?.content).toContain('software testing')
    expect(parsed?.title).toContain('Example')
  })
})
