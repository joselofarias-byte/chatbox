import { DOMParser } from 'linkedom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DuckDuckGoSearch } from './duckduckgo'

describe('DuckDuckGoSearch', () => {
  beforeEach(() => vi.stubGlobal('DOMParser', DOMParser))
  afterEach(() => vi.unstubAllGlobals())

  it('uses GET on mobile and resolves actual DuckDuckGo target URLs', async () => {
    const search = new DuckDuckGoSearch()
    const html = '<div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fguide">Example guide</a>' +
      '<div class="result__snippet">Useful text</div></div>'
    const spy = vi.spyOn(search, 'fetch').mockResolvedValue(html as never)
    const result = await search.search('test')
    expect(spy).toHaveBeenCalledWith('https://html.duckduckgo.com/html/', {
      method: 'GET', query: { q: 'test' }, responseType: 'text', signal: undefined,
    })
    expect(result.items).toEqual([{ title: 'Example guide', link: 'https://example.com/guide', snippet: 'Useful text' }])
  })

  it('ignores non-HTTP links', async () => {
    const search = new DuckDuckGoSearch()
    vi.spyOn(search, 'fetch').mockResolvedValue('<div class="result"><a class="result__a" href="javascript:alert(1)">Bad</a></div>' as never)
    expect((await search.search('test')).items).toEqual([])
  })
})
