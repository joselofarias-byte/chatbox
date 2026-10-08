import { Readability } from '@mozilla/readability'
import type { SearchResult } from '@shared/types'
import WebSearch, { type ParseLinkResult } from './base'

const MAX_HTML_LENGTH = 2_000_000
const MAX_PAGE_TEXT_LENGTH = 100_000

/**
 * No metered search API: SearXNG (if configured), then Bing, then DuckDuckGo.
 * Empty results and provider exceptions both advance to the next search engine.
 */
export class AutoFreeSearch extends WebSearch {
  override supportsParseLink = true

  constructor(private readonly providers: WebSearch[]) {
    super()
  }

  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const errors: unknown[] = []
    for (const provider of this.providers) {
      if (signal?.aborted) throw new Error('Web search was cancelled')
      try {
        const result = await provider.search(query, signal)
        const items = result.items.filter((item) => item.title?.trim() && item.link?.trim())
        if (items.length > 0) return { items }
      } catch (error) {
        if (signal?.aborted) throw error
        errors.push(error)
      }
    }
    if (errors.length) {
      throw new Error('All free web search providers failed or returned no results', { cause: errors[0] })
    }
    throw new Error('Free web search returned no results')
  }

  /**
   * Extract text locally from a public webpage using Mozilla Readability.
   * No Chatbox-hosted parser, credits, or search API license needed.
   */
  async parseLink(url: string, signal?: AbortSignal): Promise<ParseLinkResult> {
    const parsedUrl = requirePublicPageUrl(url)
    const html = await this.fetch(parsedUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'text/html,application/xhtml+xml' },
      responseType: 'text',
      signal,
    })
    if (typeof html !== 'string' || !html.length || html.length > MAX_HTML_LENGTH) {
      throw new Error('Webpage is empty, too large, or does not return HTML text')
    }
    const document = new DOMParser().parseFromString(html, 'text/html')
    const title = document.title
    const fallbackText = document.body?.textContent ?? ''
    const readable = new Readability(document).parse()
    const content = (readable?.textContent || fallbackText).replace(/\s+/g, ' ').trim()
    if (!content) throw new Error('No readable text found at the requested URL')
    return {
      url: parsedUrl.toString(),
      title: readable?.title || title || parsedUrl.hostname,
      content: content.slice(0, MAX_PAGE_TEXT_LENGTH),
    }
  }
}

/** Basic protection against model-directed requests to the local network. */
export function requirePublicPageUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('A valid public HTTP(S) URL is required')
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Only public HTTP(S) URLs without embedded credentials are supported')
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    host === 'localhost' || host.endsWith('.localhost') ||
    host.endsWith('.local') || host.endsWith('.internal') ||
    !host.includes('.') || host.includes(':')
  ) {
    throw new Error('Local or private-network webpage addresses are not supported')
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (ipv4) {
    const [a, b, c, d] = ipv4.slice(1).map(Number)
    if (
      [a, b, c, d].some((n) => n > 255) ||
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19))
    ) {
      throw new Error('Local or private-network webpage addresses are not supported')
    }
  }
  return url
}
