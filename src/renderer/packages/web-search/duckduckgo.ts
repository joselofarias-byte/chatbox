import type { SearchResult } from '@shared/types'
import WebSearch from './base'

function resolveLink(href: string): string | null {
  try {
    const url = new URL(href, 'https://duckduckgo.com')
    const destination = url.hostname.endsWith('duckduckgo.com') ? url.searchParams.get('uddg') : null
    const external = destination ? new URL(destination) : url
    return external.protocol === 'https:' || external.protocol === 'http:' ? external.toString() : null
  } catch {
    return null
  }
}

export class DuckDuckGoSearch extends WebSearch {
  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    // GET avoids mobile CapacitorHttp incompatibilities with URLSearchParams POST.
    const html = await this.fetch('https://html.duckduckgo.com/html/', {
      method: 'GET',
      query: { q: query },
      responseType: 'text',
      signal,
    })
    if (typeof html !== 'string') throw new Error('DuckDuckGo returned a non-HTML response')
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const items = Array.from(doc.querySelectorAll('.result'))
      .map((node) => {
        const anchor = node.querySelector<HTMLAnchorElement>('.result__a')
        const link = anchor && resolveLink(anchor.getAttribute('href') || '')
        const title = anchor?.textContent?.trim()
        if (!link || !title) return null
        return {
          title,
          link,
          snippet: node.querySelector('.result__snippet')?.textContent?.trim() || '',
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, 10)
    return { items }
  }
}
